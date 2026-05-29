// admin.js
import { kv } from "./db.js";
import { renderLayout } from "./homeview.js";

// ANTI-XSS INJECTION PROTECTION LAYER
function sanitizeInput(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

// Complex Admin Dashboard View managing complete CRUD operations for programmes, modules, and lists
export async function showAdmin(ctx) {
  const authQuery = "?auth=true";

  // Pre-load all programmes into an internal lookup map so we can cross-reference titles rapidly
  const progsLookup = {};
  const mapIter = kv.list({ prefix: ["programmes"] });
  for await (const pr of mapIter) {
    progsLookup[pr.value.id] = pr.value.title;
  }

  let adminHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 30px;">
      
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid var(--border);">
        <h3>Create Degree Programme</h3>
        <form action="/admin/create-programme${authQuery}" method="POST" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
          <input type="text" name="title" placeholder="Programme Title (e.g., BSc Cyber Security)" required>
          <select name="level">
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
          </select>
          <input type="text" name="leader" placeholder="Programme Leader Name" required>
          <textarea name="description" placeholder="Course marketing specifications..." required style="height: 60px; font-family: inherit; resize: none;"></textarea>
          <button type="submit">Save Programme</button>
        </form>
      </div>

      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid var(--border);">
        <h3>Add & Assign Module</h3>
        <form action="/admin/create-module${authQuery}" method="POST" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
          
          <label style="font-weight: 600; font-size: 0.9rem; display:block; margin-bottom: 4px;">Assign to Programmes (Select all that apply):</label>
          <div style="background: var(--bg); padding: 10px; border-radius: 6px; border: 1px solid var(--border); max-height: 100px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
  `;

  for (const id in progsLookup) {
    adminHtml += `
      <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 500; cursor:pointer;">
        <input type="checkbox" name="progIds" value="${id}" style="width: auto; cursor:pointer;"> ${progsLookup[id]}
      </label>
    `;
  }

  adminHtml += `
          </div>

          <input type="text" name="name" placeholder="Module Title (e.g., Systems Architecture)" required style="margin-top:5px;">
          <select name="year">
            <option value="1">Year level 1</option>
            <option value="2">Year level 2</option>
            <option value="3">Year level 3</option>
          </select>
          <input type="text" name="leader" placeholder="Assigned Module Leader Staff" required>
          <button type="submit" style="background: var(--accent);">Deploy & Assign Module</button>
        </form>
      </div>
    </div>

    <h3>Degree Programmes Lifecycle State Rows</h3>
    <table style="margin-top: 15px;">
      <thead>
        <tr>
          <th>Course Details & Modifications</th>
          <th>Leader</th>
          <th>Status</th>
          <th style="width: 250px;">Operational Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  const progIter = kv.list({ prefix: ["programmes"] });
  for await (const res of progIter) {
    const p = res.value;
    adminHtml += `
      <tr>
        <td>
          <strong style="font-size: 1.1rem; color: var(--text-heading);">${p.title}</strong> <small style="color:#64748b;">(${p.level})</small>
          
          <form action="/admin/update-programme/${p.id}${authQuery}" method="POST" style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px dashed var(--border);">
            <label style="font-size: 0.8rem; font-weight: bold; color: var(--text-main);">Update Description Live:</label>
            <textarea name="description" required style="height: 50px; font-size: 0.85rem; font-family: inherit; resize: none; padding: 6px;">${p.description}</textarea>
            <button type="submit" style="padding: 4px 10px; font-size: 0.8rem; background: #475569; max-width: 130px; align-self: flex-end;">Apply Changes</button>
          </form>
        </td>
        <td>${p.leader}</td>
        <td>
          <span style="padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; background: ${p.published ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
            ${p.published ? "Published" : "Draft"}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <form action="/admin/toggle-programme/${p.id}${authQuery}" method="POST" style="margin:0;">
              <button type="submit" style="background: #3b82f6; font-size: 0.85rem; padding: 6px 10px; width: auto;">Toggle Publish</button>
            </form>
            <form action="/admin/delete-programme/${p.id}${authQuery}" method="POST" style="margin:0;">
              <button type="submit" style="background: var(--danger); font-size: 0.85rem; padding: 6px 10px; width: auto;">Delete</button>
            </form>
          </div>
        </td>
      </tr>
    `;
  }

  adminHtml += `
      </tbody>
    </table>

    <h3 style="margin-top: 40px;">Active Academic Modules & Staff Reassignments</h3>
    <table style="margin-top: 15px;">
      <thead>
        <tr>
          <th>Module Name & Level</th>
          <th>Assigned Shared Programs</th>
          <th>Current Module Leader / Reassign</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  const modIter = kv.list({ prefix: ["modules"] });
  let hasModules = false;
  for await (const res of modIter) {
    const m = res.value;
    hasModules = true;

    // Compile titles of matching shared programs
    const sharedTitles = (m.progIds || []).map(id => progsLookup[id] || `Unknown ID (${id})`);

    adminHtml += `
      <tr>
        <td><strong>${m.name}</strong><br><small style="color: #64748b;">Year Level ${m.year}</small></td>
        <td><div style="font-size:0.85rem; color:var(--text-main); max-width: 250px;">${sharedTitles.join(", ")}</div></td>
        <td>
          <form action="/admin/reassign-module/${m.id}${authQuery}" method="POST" style="display:flex; gap:6px; align-items:center;">
            <input type="text" name="leader" value="${m.leader}" required style="padding: 6px 10px; font-size:0.9rem; max-width:180px; background:#fff;">
            <button type="submit" style="padding: 6px 10px; font-size:0.8rem; width:auto; background:#475569;">Reassign</button>
          </form>
        </td>
        <td>
          <form action="/admin/delete-module/${m.id}${authQuery}" method="POST" style="margin:0;">
            <button type="submit" style="background: var(--danger); font-size: 0.85rem; padding: 6px 10px; width: auto;">Delete</button>
          </form>
        </td>
      </tr>
    `;
  }

  if (!hasModules) {
    adminHtml += `<tr><td colspan="4" style="text-align:center; color:#64748b;">No core modules currently tracked in system memory databases.</td></tr>`;
  }

  adminHtml += `
      </tbody>
    </table>

    <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); margin-top: 45px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
        <h3>Captured Prospective Student Mailing Arrays</h3>
        <a href="/admin/export-mailing-list${authQuery}" target="_blank" style="background: var(--success); color: white; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; font-size: 0.9rem;">Export Mailing List (CSV)</a>
      </div>
      <ul style="list-style-type: none; padding: 0;">
  `;
  
  const studentIter = kv.list({ prefix: ["students"] });
  let hasStudents = false;
  for await (const res of studentIter) {
    const s = res.value;
    hasStudents = true;
    adminHtml += `
      <li style="padding: 12px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
        <div>
          <strong style="color: var(--text-heading);">${s.email}</strong> <span style="color:#64748b; margin-left: 10px; font-size: 0.9rem;">(Target Course ID: ${s.progId})</span>
        </div>
        <form action="/admin/delete-student/${res.key[1]}${authQuery}" method="POST" style="margin:0;">
          <button type="submit" style="background: var(--danger); padding: 4px 10px; font-size: 0.8rem; width: auto;">Remove Record</button>
        </form>
      </li>
    `;
  }
  if (!hasStudents) adminHtml += "<li style='color: #64748b; font-size: 0.95rem;'>No prospective students listed within memory arrays.</li>";
  
  adminHtml += "</ul></div>";
  ctx.response.body = renderLayout("Admin Control Center", adminHtml, true);
}

// --- CONTROLLERS FOR CORE CRUD MUTATIONS ---

export async function createProgramme(ctx) {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const title = sanitizeInput(value.get("title") || "");
  const level = value.get("level") || "Undergraduate";
  const leader = sanitizeInput(value.get("leader") || "");
  const description = sanitizeInput(value.get("description") || "");

  if (title && leader && description) {
    const id = Date.now(); 
    await kv.set(["programmes", id], { id, title, level, leader, description, published: false }); 
  }
  ctx.response.redirect("/admin?auth=true");
}

export async function updateProgramme(ctx) {
  const id = parseInt(ctx.params.id || "0");
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const newDesc = sanitizeInput(value.get("description") || "");

  const res = await kv.get(["programmes", id]);
  if (res.value && newDesc) {
    const p = res.value;
    p.description = newDesc; 
    await kv.set(["programmes", id], p); 
  }
  ctx.response.redirect("/admin?auth=true");
}

export async function createModule(ctx) {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  
  const progIds = value.getAll("progIds").map(id => parseInt(id)); 
  const name = sanitizeInput(value.get("name") || "");
  const year = parseInt(value.get("year") || "1");
  const leader = sanitizeInput(value.get("leader") || "");

  if (progIds.length > 0 && name && leader) {
    const id = Date.now();
    await kv.set(["modules", id], { id, progIds, year, name, leader }); 
  }
  ctx.response.redirect("/admin?auth=true");
}

// NEW: MODULE REASSIGNMENT CONTROLLER (DIRECT INTERACTION UPDATE MATCH)
// Target precise module IDs and dynamically overwrite the teacher field in-place
export async function reassignModule(ctx) {
  const id = parseInt(ctx.params.id || "0");
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const newLeader = sanitizeInput(value.get("leader") || "");

  const res = await kv.get(["modules", id]);
  if (res.value && newLeader) {
    const m = res.value;
    m.leader = newLeader; // Swap module leader fields live
    await kv.set(["modules", id], m); // Persist mutation updates back down
  }
  ctx.response.redirect("/admin?auth=true");
}

// NEW: DELETE MODULE CONTROLLER
export async function deleteModule(ctx) {
  const id = parseInt(ctx.params.id || "0");
  await kv.delete(["modules", id]);
  ctx.response.redirect("/admin?auth=true");
}

export async function toggleProgramme(ctx) {
  const id = parseInt(ctx.params.id || "0");
  const res = await kv.get(["programmes", id]);
  if (res.value) {
    const p = res.value;
    p.published = !p.published; 
    await kv.set(["programmes", id], p);
  }
  ctx.response.redirect("/admin?auth=true");
}

export async function deleteProgramme(ctx) {
  const id = parseInt(ctx.params.id || "0");
  await kv.delete(["programmes", id]); 
  ctx.response.redirect("/admin?auth=true");
}

export async function deleteStudent(ctx) {
  const studentId = ctx.params.id;
  await kv.delete(["students", studentId]);
  ctx.response.redirect("/admin?auth=true");
}

export async function exportMailingList(ctx) {
  let csvContent = "Student Email,Target Programme ID\n";
  const iter = kv.list({ prefix: ["students"] });
  
  for await (const res of iter) {
    csvContent += `${res.value.email},${res.value.progId}\n`;
  }
  
  ctx.response.headers.set("Content-Type", "text/csv");
  ctx.response.headers.set("Content-Disposition", "attachment; filename=university_mailing_list.csv");
  ctx.response.body = csvContent;
}