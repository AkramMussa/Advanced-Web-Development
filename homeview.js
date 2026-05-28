// homeview.js

// Template layout wrapper injection framework keeping our styling patterns centralized
export function renderLayout(title, content, isAdmin = false) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        :root { --primary: #005A9C; --dark: #333; }
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f4f4f4; color: var(--dark); }
        nav { display: flex; gap: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        main { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; border-top: 5px solid var(--primary); display: flex; flex-direction: column; justify-content: space-between; }
        input:focus, button:focus, select:focus, textarea:focus { outline: 3px solid orange; } /* Visible accessible layout track border guides */
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
            container.innerHTML = "<p>No modular details logged.</p>";
          } else {
            let html = "<h4>Course Outline Structure:</h4>";
            const years = [...new Set(modules.map(m => m.year))];
            
            years.forEach(year => {
              html += "<h5>Level Year " + year + " Modules</h5><ul style='padding-left:15px; list-style:none;'>";
              modules.filter(m => m.year === year).forEach(m => {
                html += \`
                  <li style="margin-bottom: 15px; background: white; padding: 8px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <img src="https://picsum.photos/seed/\${m.id}/150/80" alt="Module Visual Thumbnail" style="width: 80px; height: 50px; object-fit: cover; float: left; margin-right: 10px; border-radius: 4px;"> <strong>\${m.name}</strong><br>
                    <small style="color: #666;">Leader: \${m.leader}</small>
                    <div style="clear: both;"></div>
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
      <nav>
        <a href="/">Home (Student View)</a> | 
        ${isAdmin ? `
          <a href="/admin?auth=true">Admin Dashboard</a> | 
          <strong>[Logged In as Admin]</strong> <a href="/">Logout</a>
        ` : `
          <a href="/admin">Admin Dashboard</a> | 
          <a href="/login">Admin Login</a>
        `}
      </nav>
      <h1>${title}</h1>
      ${content}
    </body>
    </html>
  `;
}