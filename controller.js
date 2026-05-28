// controller.js
import { kv } from "./db.js";
import { renderLayout } from "./homeview.js";

// Input Sanitization helper function targeting Cross-Site Scripting (XSS) attacks
function sanitizeInput(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

// Render student homepage with data from DB
export async function showHome(ctx) {
  let listHtml = "<main>";
  const iter = kv.list({ prefix: ["programmes"] });
  
  for await (const res of iter) {
    const p = res.value;
    if (p.published) {
      listHtml += `
        <section class="card">
          <h2>${p.title} (${p.level})</h2>
          <p>${p.description}</p>
          <form action="/register-interest" method="POST">
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

// Handle Form Submissions securely
export async function handleRegister(ctx) {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const email = sanitizeInput(value.get("email") || ""); // Explicit sanitization
  const progId = parseInt(value.get("progId") || "0"); // Strict numerical parsing to prevent injection

  if (email && progId) {
    const studentId = Date.now().toString();
    await kv.set(["students", studentId], { email, progId }); // Data persistence
    ctx.response.body = renderLayout("Thank You!", `<p>Interest registered persistently for: ${email}</p><a href="/">Back Home</a>`);
  } else {
    ctx.response.status = 400;
    ctx.response.body = "Error: Invalid submission data.";
  }
}

// Protected Admin dashboard view
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