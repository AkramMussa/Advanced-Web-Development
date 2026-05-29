// homeview.js

// Premium, highly aligned layout engine managing spacing parameters and access states
export function renderLayout(title, content, isAdmin = false) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        :root { 
          --primary: #0f172a; /* Sophisticated deep slate dark blue */
          --accent: #0284c7;  /* High-tech clear blue accents */
          --accent-hover: #0369a1;
          --bg: #f8fafc;      /* Crisp, clean canvas gray background */
          --card-bg: #ffffff;
          --text-main: #334155;
          --text-heading: #0f172a;
          --border: #e2e8f0;
          --danger: #dc2626;
          --success: #16a34a;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
          font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; 
          background: var(--bg); 
          color: var(--text-main); 
          line-height: 1.6;
          padding: 30px 15px;
        }

        /* Standardized viewport constraint column preventing messy screen stretching */
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        nav { 
          display: flex; 
          align-items: center;
          gap: 15px; 
          background: var(--card-bg); 
          padding: 16px 24px; 
          border-radius: 10px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 35px;
          border: 1px solid var(--border);
        }

        nav a {
          color: var(--text-main);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: color 0.2s;
        }

        nav a:hover { color: var(--accent); }
        
        h1 { 
          font-size: 2.2rem; 
          color: var(--text-heading); 
          margin-bottom: 25px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        /* Uniform card distribution system */
        main { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); 
          gap: 25px; 
          margin-top: 25px; 
        }
        
        /* Fixed structural grid cards to enforce total vertical box alignment */
        .card { 
          background: var(--card-bg); 
          padding: 24px; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }

        /* Wraps upper textual context blocks uniformly */
        .card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .card h2 { 
          font-size: 1.35rem; 
          color: var(--text-heading);
          font-weight: 700;
        }

        .card p { 
          color: var(--text-main); 
          font-size: 0.95rem;
        }

        .leader-badge {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--accent);
          background: #f0f9ff;
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
          align-self: flex-start;
        }

        /* Completely standardized structure for inputs and form text elements */
        input, select, textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.95rem;
          color: var(--text-heading);
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        /* High Visibility Accessible Outline Focus Indicators complying with WCAG requirements */
        input:focus, button:focus, select:focus, textarea:focus { 
          outline: 3px solid #f97316; 
          border-color: transparent;
        }

        button, .btn {
          background: var(--accent);
          color: white;
          border: none;
          padding: 11px 18px;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
          width: 100%;
          text-align: center;
        }

        button:hover { background: var(--accent-hover); }

        /* Unified style guides for data registers and layouts */
        table {
          width: 100%;
          background: var(--card-bg);
          border-collapse: collapse;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          margin: 20px 0;
          border: 1px solid var(--border);
        }

        th, td { padding: 14px 16px; text-align: left; font-size: 0.95rem; }
        th { background: #f1f5f9; font-weight: 700; color: var(--text-heading); }
        tr:not(:last-child) { border-bottom: 1px solid var(--border); }

      </style>
      <script>
        // VIDEO 3 ASYNC BACKGROUND DATA STREAM FETCHING
        async function fetchModules(progId, element) {
          const container = document.getElementById('modules-container-' + progId);
          
          if (container.style.display === 'block') {
            container.style.display = 'none';
            element.innerText = 'View Academic Course Structure';
            return;
          }

          const response = await fetch('/api/modules/' + progId);
          const modules = await response.json();

          if(modules.length === 0) {
            container.innerHTML = "<p style='padding: 12px 0; color:#64748b; font-size:0.9rem;'>No dynamic layout modules mapped for this entry.</p>";
          } else {
            let html = "<h4 style='margin: 15px 0 10px 0; color:var(--accent); font-size:1rem;'>Course Outline Structure:</h4>";
            const years = [...new Set(modules.map(m => m.year))];
            
            years.forEach(year => {
              html += "<h5 style='margin: 10px 0 5px 0; font-size:0.9rem; font-weight:700;'>Level Year " + year + " Modules</h5><ul style='padding:0; list-style:none; display:flex; flex-direction:column; gap:8px;'>";
              modules.filter(m => m.year === year).forEach(m => {
                
                let sharedBadgeHtml = "";
                if (m.sharedWith && m.sharedWith.length > 0) {
                  sharedBadgeHtml = \`<div style="margin-top:4px; font-size:0.75rem; background:#f1f5f9; color:#475569; padding:2px 6px; border-radius:4px; display:inline-block; font-weight:600;">🔗 Shared with: \${m.sharedWith.join(', ')}</div>\`;
                }

                html += \`
                  <li style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border);">
                    <strong style="font-size:0.9rem; color:var(--text-heading);">\${m.name}</strong><br>
                    <small style="color: #64748b;">Leader: \${m.leader}</small><br>
                    \${sharedBadgeHtml}
                  </li>
                \`;
              });
              html += "</ul>";
            });
            container.innerHTML = html;
          }
          container.style.display = 'block';
          element.innerText = 'Hide Academic Course Structure';
        }
      </script>
    </head>
    <body>
      <div class="container">
        <nav>
          <a href="/">Home (Student View)</a> 
          
          ${isAdmin ? `
            | <span style="color: var(--accent); font-weight: 700;">[Authenticated Portal Active]</span> 
            | <a href="/" style="color: var(--danger);">Logout</a>
          ` : `
            | <a href="/login">Faculty Login Portal</a>
          `}
        </nav>
        <h1>${title}</h1>
        ${content}
      </div>
    </body>
    </html>
  `;
}