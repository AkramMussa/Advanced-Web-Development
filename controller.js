// controller.js
import { kv } from "./db.js";
import { renderLayout } from "./homeview.js";

// ANTI-XSS INJECTION PROTECTION LAYER
function sanitizeInput(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

// Student Hub View: Handles both dropdown level filters AND the new keyword text search bar 
export async function showHome(ctx) {
  const url = new URL(ctx.request.url);
  const filter = url.searchParams.get("level") || "All"; 
  const searchKeyword = (url.searchParams.get("search") || "").trim().toLowerCase(); // Pull search inputs 

  let listHtml = `
    <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
      <form method="GET" action="/" style="display: flex; gap: 10px; width: 100%; flex-wrap: wrap;">
        
        <div style="flex: 1; min-width: 250px;">
          <label for="search-box"><strong>Search Courses:</strong></label>
          <input type="text" id="search-box" name="search" value="${url.searchParams.get("search") || ""}" placeholder="e.g., Cyber Security..." style="width: 90%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        </div>

        <div>
          <label for="level-select"><strong>Course Level:</strong></label>
          <select id="level-select" name="level" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            <option value="All" ${filter === "All" ? "selected" : ""}>Show All Courses</option>
            <option value="Undergraduate" ${filter === "Undergraduate" ? "selected" : ""}>Undergraduate</option>
            <option value="Postgraduate" ${filter === "Postgraduate" ? "selected" : ""}>Postgraduate</option>
          </select>
        </div>

        <button type="submit" style="background: #005A9C; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; align-self: flex-end;">Apply Filter</button>
      </form>
    </div>
    <main>
  `;

  const iter = kv.list({ prefix: ["programmes"] });
  let foundAny = false;

  for await (const res of iter) {
    const p = res.value;
    
    // Evaluate if the entry title matches the text search keyword constraint 
    const matchesKeyword = searchKeyword === "" || p.title.toLowerCase().includes(searchKeyword) || p.description.toLowerCase().includes(searchKeyword);
    const matchesLevel = filter === "All" || p.level === filter;

    if (p.published && matchesLevel && matchesKeyword) {
      foundAny = true;
      listHtml += `
        <section class="card">
          <img src="https://picsum.photos/seed/${p.id}/400/200" alt="Visual representation of ${p.title}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 4px; margin-bottom: 15px;"> <h2>${p.title} (${p.level})</h2>
          <p><strong>Programme Leader:</strong> ${p.leader}</p>
          <p>${p.description}</p>
          
          <button onclick="fetchModules(${p.id}, this)">View Academic Course Structure</button>
          <div id="modules-container-${p.id}" style="margin-top: 15px; padding: 10px; display:none; background:#f9f9f9; border-radius:4px;"></div>

          <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top:10px;">
            <form action="/register-interest" method="POST" style="margin-bottom: 8px;">
              <input type="hidden" name="progId" value="${p.id}">
              <input type="email" name="email" placeholder="Enter your email to join mailing list" required style="width: 90%; padding: 6px; margin-bottom: 5px; border: 1px solid #ccc; border-radius: 4px;" aria-label="Email for ${p.title}">
              <button type="submit" style="background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Express Interest</button> </form>

            <form action="/withdraw-interest" method="POST" style="background: #fff5f5; padding: 8px; border-radius: 4px; border: 1px solid #fed7d7;">
              <input type="hidden" name="progId" value="${p.id}">
              <input type="email" name="email" placeholder="Enter email to unsubscribe" required style="width: 88%; padding: 4px; margin-bottom: 5px; border: 1px solid #ccc; border-radius: 4px;">
              <button type="submit" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">Withdraw My Interest</button> </form>
          </div>
        </section>
      `;
    }
  }

  if (!foundAny) {
    listHtml += `<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 4px;">No educational programmes match your active filter keywords.</p>`;
  }

  listHtml += "</main>";
  ctx.response.body = renderLayout("Prospective Student Hub", listHtml);
}

// Serves specific course module lists asynchronously back to our browser templates
export async function getModulesApi(ctx) {
  const progId = parseInt(ctx.params.progId || "0"); 
  const moduleList = [];
  
  const iter = kv.list({ prefix: ["modules"] });
  for await (const res of iter) {
    if (res.value.progId === progId) {
      moduleList.push(res.value);
    }
  }
  ctx.response.headers.set("Content-Type", "application/json");
  ctx.response.body = moduleList; 
}

// Handle dynamic registration postings securely
export async function handleRegister(ctx) {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const email = sanitizeInput(value.get("email") || ""); 
  const progId = parseInt(value.get("progId") || "0");

  if (email && progId) {
    // Generate a unique token key string using both components to ease lookups during deletion queries
    const keyString = `${email}_${progId}`;
    await kv.set(["students", keyString], { email, progId }); 
    ctx.response.body = renderLayout("Thank You!", `<p>Interest registered persistently for: <strong>${email}</strong></p><a href="/">Back Home</a>`);
  } else {
    ctx.response.status = 400;
    ctx.response.body = "Error: Invalid processing parameters.";
  }
}

// NEW: WITHDRAW INTEREST PIPELINE CONTROLLER
// Validates registration keys and drops items directly from memory lists to respect opt-out user stories 
export async function handleWithdraw(ctx) {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const email = sanitizeInput(value.get("email") || "");
  const progId = parseInt(value.get("progId") || "0");

  if (email && progId) {
    const keyString = `${email}_${progId}`;
    const check = await kv.get(["students", keyString]);
    
    if (check.value) {
      await kv.delete(["students", keyString]); // Wipe matching signups out 
      ctx.response.body = renderLayout("Unsubscribed Successfully", `<p>Your email address <strong>${email}</strong> has been completely removed from this course mailing list track.</p><a href="/">Back Home</a>`);
    } else {
      ctx.response.body = renderLayout("Record Not Found", `<p>Could not locate an active interest registration matching that email on this specific programme model.</p><a href="/">Back Home</a>`);
    }
  } else {
    ctx.response.status = 400;
    ctx.response.body = "Error: Invalid processing parameters.";
  }
}