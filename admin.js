// admin.js
import { kv } from "./db.js";
import { renderLayout } from "./homeview.js";

// ANTI-XSS INJECTION PROTECTION LAYER
// Clean user inputs to block embedded malicious scripts from executing in the administrative environment
function sanitizeInput(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

// Complex Admin Dashboard View managing complete CRUD operations for programmes, modules, and lists
export async function showAdmin(ctx) {
  // Hardcode our active security query suffix to attach to all internal submission targets
  const authQuery = "?auth=true";

  let adminHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 30px;">
      
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h3>Create Degree Programme [CRUD]</h3>
        <form action="/admin/create-programme${authQuery}" method="POST" style="display: flex; flex-direction: column; gap: 10px;">
          <input type="text" name="title" placeholder="Programme Title (e.g., BSc Cyber Security)" required>
          <select name="level">
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
          </select>
          <input type="text" name="leader" placeholder="Programme Leader Name" required>
          <textarea name="description" placeholder="Course marketing specifications..." required style="height: 50px;"></textarea>
          <button type="submit" style="background: #22c55e; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Save Programme</button>
        </form>
      </div>

      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h3>Add & Assign Module [Relational CRUD]</h3>
        <form action="/admin/create-module${authQuery}" method="POST" style="display: flex; flex-direction: column; gap: 10px;">
          <label for="prog-select"><strong>Target Parent Programme:</strong></label>
          <select id="prog-select" name="progId">
  `;

  // Dynamically populate target option loops so modules link cleanly back to active courses
  const optIter = kv.list({ prefix: ["programmes"] });
  for await (const res of optIter) {
    adminHtml += `<option value="${res.value.id}">${res.value.title}</option>`;
  }

  adminHtml += `
          </select>
          <input type="text" name="name" placeholder="Module Title (e.g., Intro to Crypto)" required>
          <select name="year">
            <option value="1">Year level 1</option>
            <option value="2">Year level 2</option>
            <option value="3">Year level 3</option>
          </select>
          <input type="text" name="leader" placeholder="Assigned Module Leader Staff" required>
          <button type="submit" style="background: #005A9C; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Deploy & Assign Module</button>
        </form>
      </div>
    </div>

    <h3>Degree Programmes Lifecycle State Rows</h3>
    <table style="width: 100%; background: white; border-collapse: collapse; margin-bottom: 30px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <thead>
        <tr style="background: #e2e8f0; text-align: left;">
          <th style="padding: 12px;">ID</th>
          <th style="padding: 12px;">Course Specifics</th>
          <th style="padding: 12px;">Leader State</th>
          <th style="padding: 12px;">Status Badge</th>
          <th style="padding: 12px;">Operational Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  const progIter = kv.list({ prefix: ["programmes"] });
  for await (const res of progIter) {
    const p = res.value;
    adminHtml += `
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 12px;">${p.id}</td>
        <td style="padding: 12px;"><strong>${p.title}</strong><br><small style="color:#666">${p.level}</small></td>
        <td style="padding: 12px;">${p.leader}</td>
        <td style="padding: 12px;">
          <span style="padding: 4px 8px; border-radius: 12px; font-size: 0.85em; background: ${p.published ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
            ${p.published ? "Published" : "Draft Entry"}
          </span>
        </td>
        <td style="padding: 12px; display: flex; gap: 5px;">
          <form action="/admin/toggle-programme/${p.id}${authQuery}" method="POST" style="margin:0;">
            <button type="submit" style="background: #3b82f6; color: white; border:none; padding: 6px 10px; border-radius:4px; cursor:pointer;">Toggle Publish</button>
          </form>
          <form action="/admin/delete-programme/${p.id}${authQuery}" method="POST" style="margin:0;">
            <button type="submit" style="background: #ef4444; color: white; border:none; padding: 6px 10px; border-radius:4px; cursor:pointer;">Delete</button>
          </form>
        </td>
      </tr>
    `;
  }

  adminHtml += `
      </tbody>
    </table>

    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3>Captured Prospective Student Mailing Arrays</h3>
        <a href="/admin/export-mailing-list${authQuery}" target="_blank" style="background: #15803d; color: white; text-decoration: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 0.9em;">Export Mailing List (CSV)</a>
      </div>
      <ul style="list-style-type: none; padding: 0;">
  `;
  
  const studentIter = kv.list({ prefix: ["students"] });
  let hasStudents = false;
  for await (const res of studentIter) {
    const s = res.value;
    hasStudents = true;
    adminHtml += `
      <li style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${s.email}</strong> <span style="color:#777; margin-left: 10px;">(Registered Target ID: ${s.progId})</span>
        </div>
        <form action="/admin/delete-student/${res.key[1]}${authQuery}" method="POST" style="margin:0;">
          <button type="submit" style="background: #b91c1c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">Remove Record</button>
        </form>
      </li>
    `;
  }
  if (!hasStudents) adminHtml += "<li style='color: #777;'>No prospective students listed within memory arrays.</li>";
  
  adminHtml += "</ul></div>";
  ctx.response.body = renderLayout("Admin Control Center", adminHtml, true);
}

// CRUD OPERATIONAL CORE ROUTING ENDPOINTS

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