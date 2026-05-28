// homeview.js
// Layout wrapper function acting as the View Layer of the MVC structure
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
        input:focus, button:focus { outline: 3px solid orange; } /* Accessible focus rings for WCAG standards compliance */
      </style>
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