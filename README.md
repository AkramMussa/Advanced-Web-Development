# CTEC3705 - Advanced Web Development Web Project

## Student Course Hub
This full-stack application serves as a dynamic marketing platform for a UK university to showcase undergraduate and postgraduate degree programmes and capture prospective student information securely.

## Technical Architecture (MVC Layout)
- **Model**: Data definitions and persistence handling via **Deno KV** (`db.js`).
- **View**: Dynamic server-side rendered user interfaces (`homeview.js`).
- **Controller**: Endpoint routes, entry gatekeepers, and data validation layers (`controller.js`, `server.js`).

## Security Features
- **Cross-Site Scripting (XSS) Prevention**: Explicit input sanitization processing.
- **Data Injection Defenses**: Type-enforced parameters parsing using `parseInt`.
- **RBAC & Authentication**: Cookie-based middleware verification shielding administrative endpoints.

## Local Deployment Instructions
To execute this codebase locally, run:
```bash
deno run --allow-net --allow-read --allow-write --unstable-kv server.js