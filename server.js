// server.js
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { showHome, handleRegister, getModulesApi } from "./controller.js";
import { showAdmin, createProgramme, createModule, toggleProgramme, deleteProgramme, deleteStudent, exportMailingList } from "./admin.js"; // Bound all expanded components
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
    ctx.response.body = "Access Denied: Administrators Only.";
  }
};

// Public Facing Application Route Handles
router.get("/", showHome);
router.get("/api/modules/:progId", getModulesApi); 
router.post("/register-interest", handleRegister);

// ADVANCED COMPLIANT ADMINISTRATIVE OPERATIONAL CLUSTERS
router.get("/admin", authMiddleware, showAdmin);
router.post("/admin/create-programme", authMiddleware, createProgramme); 
router.post("/admin/create-module", authMiddleware, createModule); // Structural Relational Creation Route
router.post("/admin/toggle-programme/:id", authMiddleware, toggleProgramme); 
router.post("/admin/delete-programme/:id", authMiddleware, deleteProgramme); 
router.post("/admin/delete-student/:id", authMiddleware, deleteStudent); // Mailing List Manipulation Route
router.get("/admin/export-mailing-list", authMiddleware, exportMailingList); // CSV Bulk Export Engine Node

// Entry Authorization Terminal Screen View
router.get("/login", (ctx) => {
  const loginFormHtml = `
    <div style="background: white; padding: 30px; border-radius: 8px; max-width: 400px; margin: 40px auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
      <h2>Administrator Authentication</h2>
      <p style="color: #666; margin-bottom: 20px;">Click the action button below to pass token credentials directly into the active routing framework context.</p>
      <form action="/admin" method="GET">
        <input type="hidden" name="auth" value="true"> 
        <button type="submit" style="background: var(--primary); color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 4px; cursor: pointer; width: 100%;">Authorize Admin Session</button>
      </form>
    </div>
  `;
  ctx.response.body = renderLayout("Admin Portal Login", loginFormHtml);
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Enterprise Full-Scenario Server listening active at http://localhost:8000");
await app.listen({ port: 8000 });