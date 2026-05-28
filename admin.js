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

  let adminHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 30px;">
      
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid var(--border);">
        <h3>Create Degree Programme [CRUD - Create]</h3>
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
        <h3>Add & Assign Module [Relational CRUD]</h3>
        <form action="/admin/create-module${authQuery}" method="POST" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
          <label style="font-weight: 600; font-size: 0.9rem;">Target Parent Programme:</label>
          <select name="progId">
  `;

  const optIter = kv.list({ prefix: ["programmes"] });
  for await (const res of optIter) {
    adminHtml += `<option value="${res.value.id}">${res.value.title}</option>`;
  }

  adminHtml += `
          </select>
          <input type="text" name="name" placeholder="Module Title (e.g., Network Security)" required>
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
          <th style="width: 280px;">Operational Actions</th>
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
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
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

    <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); margin-top: 35px;">
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

// NEW: CRUD UPDATE CONTROLLER
// Patches changes directly to targeted system keys while leaving existing visibility flags untouched
export async function updateProgramme(ctx) {
  const id = parseInt(ctx.params.id || "0");
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const newDesc = sanitizeInput(value.get("description") || "");

  const res = await kv.get(["programmes", id]);
  if (res.value && newDesc) {
    const p = res.value;
    p.description = newDesc; // Mutates description inline
    await kv.set(["programmes", id], p); // Saves record back down safely
  }
  ctx.response.redirect("/admin?auth=true");
}

export async function createModule(ctx) {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  const progId = parseInt(value.get("progId") || "0");
  const name = sanitizeInput(value.get("name") || "");
  const year = parseInt(value.get("year") || "1");
  const leader = sanitizeInput(value.get("leader") || "");

  if (progId && name && leader) {
    const id = Date.now();
    await kv.set(["modules", id], { id, progId, year, name, leader }); 
  }
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