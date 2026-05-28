// admin.js
import { kv } from "./db.js";
import { renderLayout } from "./homeview.js";

// ANTI-XSS ATTACK DEFENSE LAYER
// Escapes raw input characters to keep attackers from injecting scripts into my database entries
function sanitizeInput(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

// Admin view displaying database state records alongside management action forms [cite: 19]
export async function showAdmin(ctx) {
  let adminHtml = `
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <h3>Create New Programme Entry [CRUD - Create]</h3> <form action="/admin/create-programme" method="POST" style="display: flex; flex-direction: column; gap: 10px; max-width: 400px;">
        <input type="text" name="title" placeholder="Programme Title (e.g., BSc Computer Science)" required>
        <select name="level">
          <option value="Undergraduate">Undergraduate</option>
          <option value="Postgraduate">Postgraduate</option>
        </select>
        <input type="text" name="leader" placeholder="Programme Leader Name" required>
        <textarea name="description" placeholder="Course details..." required style="height: 60px;"></textarea>
        <button type="submit" style="background: #22c55e; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer;">Save Programme</button>
      </form>
    </div>

    <h3>Existing System Programmes [CRUD - Update/Delete/Publish]</h3> <table style="width: 100%; background: white; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <thead>
        <tr style="background: #e2e8f0; text-align: left;">
          <th style="padding: 12px;">ID</th>
          <th style="padding: 12px;">Programme Title</th>
          <th style="padding: 12px;">Level</th>
          <th style="padding: 12px;">Status</th>
          <th style="padding: 12px;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Dynamic iteration streaming existing course nodes straight from server memory rows
  const progIter = kv.list({ prefix: ["programmes"] });
  for await (const res of progIter) {
    const p = res.value;
    adminHtml += `
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 12px;">${p.id}</td>
        <td style="padding: 12px;"><strong>${p.title}</strong></td>
        <td style="padding: 12px;">${p.level}</td>
        <td style="padding: 12px;">
          <span style="padding: 4px 8px; border-radius: 12px; font-size: 0.85em; background: ${p.published ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
            ${p.published ? "Published" : "Draft (Unpublished)"}
          </span>
        </td>
        <td style="padding: 12px; display: flex; gap: 10px;">
          <form action="/admin/toggle-programme/${p.id}" method="POST" style="margin:0;">
            <button type="submit" style="background: #3b82f6; color: white; border:none; padding: 6px 12px; border-radius:4px; cursor:pointer;">
              ${p.published ? "Unpublish" : "Publish"} </button>
          </form>
          <form action="/admin/delete-programme/${p.id}" method="POST" style="margin:0;">
            <button type="submit" style="background: #ef4444; color: white; border:none; padding: 6px 12px; border-radius:4px; cursor:pointer;">Delete</button> </form>
        </td>
      </tr>
    `;
  }

  adminHtml += `
      </tbody>
    </table>

    <h3 style="margin-top: 40px;">Registered Interest Mailing List:</h3> <ul style="background: white; padding: 20px; border-radius: 8px; list-style-position: inside; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
  `;
  
  // Streaming collected prospective user entries [cite: 5, 7, 43]
  const studentIter = kv.list({ prefix: ["students"] });
  let hasStudents = false;
  for await (const res of studentIter) {
    const s = res.value;
    hasStudents = true;
    adminHtml += `<li><strong>${s.email}</strong> expressed interest in Programme ID: ${s.progId}</li>`;
  }
  if (!hasStudents) adminHtml += "<li>No student signups logged yet.</li>";
  
  adminHtml += "</ul>";
  ctx.response.body = renderLayout("Admin Control Center", adminHtml, true);
}

// CRUD Action: Handle adding fresh program entries into database instances [cite: 20, 43]
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
  ctx.response.redirect("/admin");
}

// CRUD Action: Toggle active publication parameters (Publish / Unpublish) [cite: 21, 43]
export async function toggleProgramme(ctx) {
  const id = parseInt(ctx.params.id || "0");
  const res = await kv.get(["programmes", id]);
  
  if (res.value) {
    const p = res.value;
    p.published = !p.published; 
    await kv.set(["programmes", id], p);
  }
  ctx.response.redirect("/admin");
}

// CRUD Action: Erase records completely from storage tracks [cite: 20, 43]
export async function deleteProgramme(ctx) {
  const id = parseInt(ctx.params.id || "0");
  await kv.delete(["programmes", id]); 
  ctx.response.redirect("/admin");
}