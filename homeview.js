// homeview.js
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
        .card { background: white; padding: 20px; border-radius: 8px; border-top: 5px solid var(--primary); }
        input:focus, button:focus, select:focus { outline: 3px solid orange; } /* Accessible visual tracking outline rings [cite: 149, 358] */
      </style>
      <script>
        // Video 3 Asynchronous Fetch Execution Pipeline Demonstration [cite: 146]
        async function fetchModules(progId, element) {
          const container = document.getElementById('modules-container-' + progId);
          
          if (container.style.display === 'block') {
            container.style.display = 'none';
            element.innerText = 'View Academic Course Structure';
            return;
          }

          // Query our custom background API instead of triggering expensive full page reloads [cite: 146]
          const response = await fetch('/api/modules/' + progId);
          const modules = await response.json();

          if(modules.length === 0) {
            container.innerHTML = "<p>No modular details logged.</p>";
          } else {
            // Group modules inside the client template by Year metrics dynamically 
            let html = "<h4>Course Outline Structure:</h4>";
            const years = [...new Set(modules.map(m => m.year))];
            
            years.forEach(year => {
              html += "<h5>Level Year " + year + " Modules</h5><ul>";
              modules.filter(m => m.year === year).forEach(m => {
                html += "<li><strong>" + m.name + "</strong> - Led by: " + m.leader + "</li>"; // 
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
        <a href="/admin">Admin Dashboard</a>
        ${isAdmin ? '<strong>[Logged In as Admin]</strong> <a href="/logout">Logout</a>' : '<a href="/login">Admin Login</a>'}
      </nav>
      <h1>${title}</h1>
      ${content}
    </body>
    </html>
  `;
}