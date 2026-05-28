// controller.js
import { kv } from "./db.js";
import { renderLayout } from "./homeview.js";

// ANTI-XSS INJECTION PROTECTION LAYER
// Escapes raw HTML input characters to prevent malicious script injection attacks on my database
function sanitizeInput(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

// Student Hub View: Handles both dropdown level filters AND the text search keyword queries concurrently
export async function showHome(ctx) {
  const url = new URL(ctx.request.url);
  const filter = url.searchParams.get("level") || "All"; 
  const searchKeyword = (url.searchParams.get("search") || "").trim().toLowerCase(); 

  let listHtml = `
    <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid var(--border);">
      <form method="GET" action="/" style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
        
        <div style="flex: 2; min-width: 250px;">
          <label for="search-box" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.9rem;">Search Degree Programmes:</label>
          <input type="text" id="search-box" name="search" value="${url.searchParams.get("search") || ""}" placeholder="e.g., Cyber Security, Web Development...">
        </div>

        <div style="flex: 1; min-width: 180px;">
          <label for="level-select" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.9rem;">Course Level:</label>
          <select id="level-select" name="level">
            <option value="All" ${filter === "All" ? "selected" : ""}>Show All Courses</option>
            <option value="Undergraduate" ${filter === "Undergraduate" ? "selected" : ""}>Undergraduate</option>
            <option value="Postgraduate" ${filter === "Postgraduate" ? "selected" : ""}>Postgraduate</option>
          </select>
        </div>

        <div style="min-width: 120px;">
          <button type="submit">Apply Filter</button>
        </div>
      </form>
    </div>
    <main>
  `;

  // Explicit, curated list of 3 distinct, high-fidelity technology photo IDs from Picsum
  // 1. id/0: Laptop workspace layout, 2. id/60: Mainframe components, 3. id/160: Server connectivity
  const imagePool = ["0", "60", "160"];
  let imageCounter = 0;

  const iter = kv.list({ prefix: ["programmes"] });
  let foundAny = false;

  for await (const res of iter) {
    const p = res.value;
    
    const matchesKeyword = searchKeyword === "" || p.title.toLowerCase().includes(searchKeyword) || p.description.toLowerCase().includes(searchKeyword);
    const matchesLevel = filter === "All" || p.level === filter;

    if (p.published && matchesLevel && matchesKeyword) {
      foundAny = true;
      
      // Select an image from our pool and step forward sequentially to give each course a unique picture
      const assignedImageId = imagePool[imageCounter % imagePool.length];
      imageCounter++;

      listHtml += `
        <section class="card">
          <div>
            <img src="https://picsum.photos/id/${assignedImageId}/600/300" alt="Visual representation of ${p.title}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border);">
            
            <div class="card-body">
              <h2>${p.title} (${p.level})</h2>
              <span class="leader-badge">Leader: ${p.leader}</span>
              <p style="margin-top: 8px;">${p.description}</p>
            </div>
          </div>
          
          <div>
            <button onclick="fetchModules(${p.id}, this)" style="margin-bottom: 15px;">View Academic Course Structure</button>
            <div id="modules-container-${p.id}" style="margin-bottom: 15px; display:none; background:#f8fafc; padding: 12px; border-radius:8px; border: 1px solid var(--border);"></div>

            <div style="border-top: 1px solid var(--border); padding-top: 15px; display: flex; flex-direction: column; gap: 12px;">
              <form action="/register-interest" method="POST" style="display: flex; flex-direction: column; gap: 6px;">
                <input type="hidden" name="progId" value="${p.id}">
                <input type="email" name="email" placeholder="Enter your email to express interest" required aria-label="Email tracking for ${p.title}">
                <button type="submit" style="background: var(--accent); color: white;">Express Interest</button>
              </form>

              <form action="/withdraw-interest" method="POST" style="background: #fef2f2; padding: 10px; border-radius: 8px; border: 1px solid #fee2e2; display: flex; flex-direction: column; gap: 6px;">
                <input type="hidden" name="progId" value="${p.id}">
                <input type="email" name="email" placeholder="Enter email to unsubscribe" required style="padding: 6px 10px;">
                <button type="submit" style="background: var(--danger); color: white; padding: 6px 12px; font-size: 0.85rem;">Withdraw My Interest</button>
              </form>
            </div>
          </div>
        </section>
      `;
    }
  }

  if (!foundAny) {
    listHtml += `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px; background: white; border-radius: 8px; border: 1px solid var(--border);">No matching degree programmes found in the system database.</p>`;
  }

  listHtml += "</main>";
  ctx.response.body = renderLayout("Prospective Student Hub", listHtml);
}

// API Endpoint: Feeds specific courses background JSON module information arrays via client fetch
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

// Handles prospective user student signups
export async function handleRegister(ctx) {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const email = sanitizeInput(value.get("email") || ""); 
  const progId = parseInt(value.get("progId") || "0");

  if (email && progId) {
    const keyString = `${email}_${progId}`;
    await kv.set(["students", keyString], { email, progId }); 
    ctx.response.body = renderLayout("Thank You!", `<div style="background:white; padding:30px; border-radius:10px; border:1px solid var(--border); text-align:center;"><p style="margin-bottom:15px;">Interest registered persistently for: <strong>${email}</strong></p><a href="/" class="btn" style="display:inline-block; max-width:200px; text-decoration:none;">Back Home</a></div>`);
  } else {
    ctx.response.status = 400;
    ctx.response.body = "Error: Invalid processing parameters passed.";
  }
}

// WITHDRAW INTEREST PIPELINE CONTROLLER
// Locates a precise composite key match and purges it directly from the storage track arrays
export async function handleWithdraw(ctx) {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const email = sanitizeInput(value.get("email") || "");
  const progId = parseInt(value.get("progId") || "0");

  if (email && progId) {
    const keyString = `${email}_${progId}`;
    const check = await kv.get(["students", keyString]);
    
    if (check.value) {
      await kv.delete(["students", keyString]); 
      ctx.response.body = renderLayout("Unsubscribed Successfully", `<div style="background:white; padding:30px; border-radius:10px; border:1px solid var(--border); text-align:center;"><p style="margin-bottom:15px; color:var(--danger); font-weight:bold;">Your address ${email} has been removed from this system stream.</p><a href="/" class="btn" style="display:inline-block; max-width:200px; text-decoration:none;">Back Home</a></div>`);
    } else {
      ctx.response.body = renderLayout("Record Not Found", `<div style="background:white; padding:30px; border-radius:10px; border:1px solid var(--border); text-align:center;"><p style="margin-bottom:15px;">Could not identify any tracking history matching that submission parameter block.</p><a href="/" class="btn" style="display:inline-block; max-width:200px; text-decoration:none;">Back Home</a></div>`);
    }
  } else {
    ctx.response.status = 400;
    ctx.response.body = "Error: Invalid processing parameters passed.";
  }
}