// controller.js
import { kv } from "./db.js";
import { renderLayout } from "./homeview.js";

// Input Sanitization helper function targeting Cross-Site Scripting (XSS) attacks [cite: 140, 372]
function sanitizeInput(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

// Render dynamic home interface matching multi-level course filters [cite: 351, 378]
export async function showHome(ctx) {
  const url = new URL(ctx.request.url);
  const filter = url.searchParams.get("level") || "All"; // Handles Undergraduate/Postgraduate filtering user story 

  let listHtml = `
    <div style="margin-bottom: 20px;">
      <form method="GET" action="/">
        <label for="level-select"><strong>Filter by Course Level: </strong></label>
        <select id="level-select" name="level" onchange="this.form.submit()">
          <option value="All" ${filter === "All" ? "selected" : ""}>Show All Courses</option>
          <option value="Undergraduate" ${filter === "Undergraduate" ? "selected" : ""}>Undergraduate</option>
          <option value="Postgraduate" ${filter === "Postgraduate" ? "selected" : ""}>Postgraduate</option>
        </select>
      </form>
    </div>
    <main>
  `;

  const iter = kv.list({ prefix: ["programmes"] });
  for await (const res of iter) {
    const p = res.value;
    // Check constraints: ensure course status is published and matches filter selections [cite: 363, 378]
    if (p.published && (filter === "All" || p.level === filter)) {
      listHtml += `
        <section class="card">
          <h2>${p.title} (${p.level})</h2>
          <p><strong>Programme Leader:</strong> ${p.leader}</p> <p>${p.description}</p>
          
          <button onclick="fetchModules(${p.id}, this)">View Academic Course Structure</button>
          <div id="modules-container-${p.id}" style="margin-top: 15px; padding-left: 10px; display:none; background:#f9f9f9; border-radius:4px;"></div>

          <form action="/register-interest" method="POST" style="margin-top: 15px; border-top: 1px solid #eee; padding-top:10px;">
            <input type="hidden" name="progId" value="${p.id}">
            <input type="email" name="email" placeholder="Enter your email" required aria-label="Email for ${p.title}">
            <button type="submit">Express Interest</button>
          </form>
        </section>
      `;
    }
  }
  listHtml += "</main>";
  ctx.response.body = renderLayout("Prospective Student Hub", listHtml);
}

// Client-Side Fetch Data Endpoint supporting asynchronous UI rendering requests [cite: 145, 146]
export async function getModulesApi(ctx) {
  const progId = parseInt(ctx.params.progId || "0"); // Defensive injection parameter check block [cite: 140]
  const moduleList = [];
  
  const iter = kv.list({ prefix: ["modules"] });
  for await (const res of iter) {
    if (res.value.progId === progId) {
      moduleList.push(res.value);
    }
  }
  ctx.response.headers.set("Content-Type", "application/json");
  ctx.response.body = moduleList; // Directly pushes JSON responses back to client runtime loops [cite: 146]
}

export async function handleRegister(ctx) {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const email = sanitizeInput(value.get("email") || ""); // Protect against embedded script payloads [cite: 140, 372]
  const progId = parseInt(value.get("progId") || "0");

  if (email && progId) {
    const studentId = Date.now().toString();
    await kv.set(["students", studentId], { email, progId }); // Commit records to safe server persistence [cite: 52]
    ctx.response.body = renderLayout("Thank You!", `<p>Interest registered persistently for: ${email}</p><a href="/">Back Home</a>`);
  } else {
    ctx.response.status = 400;
    ctx.response.body = "Error: Invalid submission data.";
  }
}

export async function showAdmin(ctx) {
  let adminHtml = "<h3>Registered Interest Mailing List (Loaded from KV Database):</h3><ul>";
  const iter = kv.list({ prefix: ["students"] });
  for await (const res of iter) {
    const s = res.value;
    adminHtml += `<li><strong>${s.email}</strong> expressed interest in Programme ID: ${s.progId}</li>`;
  }
  adminHtml += "</ul>";
  ctx.response.body = renderLayout("Admin Control Center", adminHtml, true);
}