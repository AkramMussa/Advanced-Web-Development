// staff.js
import { kv } from "./db.js";
import { renderLayout } from "./homeview.js";

// Serves the private, authenticated schedule panel to a verified faculty user
export async function showStaffDashboard(ctx) {
  // Pull the verified staff name out of the URL parameter state
  const staffName = ctx.params.name;

  // Pre-load all university degree tracks into a mapping register
  const progsLookup = {};
  const pIter = kv.list({ prefix: ["programmes"] });
  for await (const p of pIter) {
    progsLookup[p.value.id] = p.value.title;
  }

  let staffHtml = `
    <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); margin-bottom: 30px;">
      <h2 style="color: var(--accent); margin-bottom: 5px;">Welcome Back, ${staffName}</h2>
      <p style="color: #64748b; font-size: 0.95rem;">Private faculty portal displaying your secure contract responsibilities and cross-course modular impact metrics.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 25px;">
      
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border);">
        <h3 style="margin-bottom: 15px; color: var(--text-heading); border-bottom: 2px solid var(--bg); padding-bottom: 10px;">Your Active Teaching Modules</h3>
        <ul style="list-style-type: none; padding: 0; display: flex; flex-direction: column; gap: 12px;">
  `;

  const mIter = kv.list({ prefix: ["modules"] });
  let moduleCount = 0;
  const sharedTracksSet = new Set();

  for await (const res of mIter) {
    const m = res.value;
    
    // FIXED: Case-insensitive parameter lookup matches regardless of capitalization or extra title tags
    if (m.leader && m.leader.toLowerCase().includes(staffName.toLowerCase())) {
      moduleCount++;
      
      // Look up all courses that share this specific module (Many-to-Many Mapping)
      const parentTitles = (m.progIds || []).map(id => {
        if (progsLookup[id]) {
          sharedTracksSet.add(progsLookup[id]); // Save for the impact analyzer card
          return progsLookup[id];
        }
        return `Course ID ${id}`;
      });

      staffHtml += `
        <li style="background: var(--bg); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
          <strong style="font-size: 1.1rem; color: var(--text-heading);">${m.name}</strong>
          <div style="color: #64748b; font-size: 0.85rem; margin-top: 4px; font-weight: 500;">Year Level Placement: Level Year ${m.year}</div>
          <div style="color: #64748b; font-size: 0.85rem; font-weight: 500;">Assigned Registered Leader: ${m.leader}</div>
          
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border);">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--accent); background: #f0f9ff; padding: 4px 8px; border-radius: 4px; display: inline-block;">
              🔗 Included in: ${parentTitles.join(", ")}
            </span>
          </div>
        </li>
      `;
    }
  }

  if (moduleCount === 0) {
    staffHtml += `<li style="color: #64748b; font-style: italic;">No specific module classes are assigned to your name in the core database registry.</li>`;
  }

  staffHtml += `
        </ul>
      </div>

      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); height: fit-content;">
        <h3 style="margin-bottom: 15px; color: var(--text-heading); border-bottom: 2px solid var(--bg); padding-bottom: 10px;">Curriculum Impact Footprint</h3>
        <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 15px;">This maps out how your teaching modules intersect with various degree tracks across the department.</p>
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border: 1px solid #bae6fd; text-align: center; margin-bottom: 20px;">
          <div style="font-size: 2.5rem; font-weight: 800; color: #0369a1;">${sharedTracksSet.size}</div>
          <div style="font-size: 0.85rem; font-weight: 700; color: #0c4a6e; text-transform: uppercase; letter-spacing: 0.05em;">Connected Degree Programmes</div>
        </div>

        <h4 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--text-heading);">Impact Matrix List:</h4>
        <ul style="padding-left: 20px; font-size: 0.9rem; color: var(--text-main); display: flex; flex-direction: column; gap: 6px;">
          ${Array.from(sharedTracksSet).map(title => `<li><strong>${title}</strong></li>`).join("")}
          ${sharedTracksSet.size === 0 ? "<li>No connected programs tracked.</li>" : ""}
        </ul>
      </div>

    </div>
  `;

  // Render out the layout passing 'true' to display the specialized staff/admin navigation view
  ctx.response.body = renderLayout(`Staff Workspace Directory`, staffHtml, true);
}