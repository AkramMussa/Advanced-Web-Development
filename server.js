// server.js
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { showHome, handleRegister, handleWithdraw, getModulesApi } from "./controller.js";
import { showAdmin, createProgramme, createModule, updateProgramme, reassignModule, deleteModule, toggleProgramme, deleteProgramme, deleteStudent, exportMailingList } from "./admin.js";
import { showStaffDashboard } from "./staff.js"; // Import our new staff controller
import { renderLayout } from "./homeview.js";

const app = new Application();
const router = new Router();

// URL-BASED ARCHITECTURAL GATEKEEPER MIDDLEWARE
const authMiddleware = async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const token = url.searchParams.get("auth");

  if (token === "true") {
    await next(); 
  } else {
    ctx.response.status = 403; 
    ctx.response.body = "Access Denied: Unauthenticated Access Blocked.";
  }
};

// --- PUBLIC HUB ROUTES ---
router.get("/", showHome);
router.get("/api/modules/:progId", getModulesApi); 
router.post("/register-interest", handleRegister);
router.post("/withdraw-interest", handleWithdraw); 

// --- SECURE AUTHENTICATED STAFF ROUTE ---
router.get("/staff/:name", authMiddleware, showStaffDashboard); // Protected Faculty Panel Route

// --- SECURE COMPLIANT ADMINISTRATIVE OPERATIONAL CLUSTERS ---
router.get("/admin", authMiddleware, showAdmin);
router.post("/admin/create-programme", authMiddleware, createProgramme); 
router.post("/admin/create-module", authMiddleware, createModule); 
router.post("/admin/update-programme/:id", authMiddleware, updateProgramme); 
router.post("/admin/reassign-module/:id", authMiddleware, reassignModule); 
router.post("/admin/delete-module/:id", authMiddleware, deleteModule); 
router.post("/admin/toggle-programme/:id", authMiddleware, toggleProgramme); 
router.post("/admin/delete-programme/:id", authMiddleware, deleteProgramme); 
router.post("/admin/delete-student/:id", authMiddleware, deleteStudent); 
router.get("/admin/export-mailing-list", authMiddleware, exportMailingList); 

// --- DYNAMIC MULTI-ROLE LOGIN CHALLENGE VIEW ---
router.get("/login", (ctx) => {
  const loginFormHtml = `
    <div style="background: white; padding: 30px; border-radius: 8px; max-width: 400px; margin: 40px auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="text-align: center; margin-bottom: 10px;">Faculty Authentication</h2>
      <p style="text-align: center; color: #64748b; font-size: 0.85rem; margin-bottom: 20px;">Log in using Admin credentials or your Faculty Last Name.</p>
      
      ${ctx.request.url.searchParams.get("error") ? `
        <div style="background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 0.9em; text-align: center; font-weight: bold;">
          Invalid Credentials. Access Denied.
        </div>
      ` : ""}

      <form action="/login" method="POST" style="display: flex; flex-direction: column; gap: 15px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Username / Identity:</label>
          <input type="text" name="username" placeholder="e.g., admin OR Stuart" required style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 4px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Security Password Key:</label>
          <input type="password" name="password" placeholder="Enter key password" required style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 4px;">
        </div>
        <button type="submit" style="background: #005A9C; color: white; border: none; padding: 12px; font-size: 16px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px; width: 100%;">Authenticate Identity</button>
      </form>
    </div>
  `;
  ctx.response.body = renderLayout("Portal Login", loginFormHtml);
});

// MULTI-ROLE POST RESOLVER
// Dynamically branches routing paths depending on user identity parameters
router.post("/login", async (ctx) => {
  const body = ctx.request.body({ type: "form" });
  const value = await body.value;
  
  const username = value.get("username").trim();
  const password = value.get("password");

  // Route A: System Administrator match
  if (username === "admin" && password === "dmu2026") {
    ctx.response.redirect("/admin?auth=true");
  } 
  // Route B: Generic Staff Member match (Uses standardized faculty security password)
  else if (username !== "" && password === "staff2026") {
    // Escapes the user input string name and routes them directly to their personalized dashboard view
    ctx.response.redirect(`/staff/${encodeURIComponent(username)}?auth=true`);
  } 
  // Route C: Authentication failure fallback
  else {
    ctx.response.redirect("/login?error=true");
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Multi-Role Enterprise Server listening active at http://localhost:8000");
await app.listen({ port: 8000 });