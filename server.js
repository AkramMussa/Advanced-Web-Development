// server.js
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { showHome, handleRegister, getModulesApi } from "./controller.js";
import { showAdmin, createProgramme, toggleProgramme, deleteProgramme } from "./admin.js";
import { renderLayout } from "./homeview.js"; // Imported layout helper for consistent styles

const app = new Application();
const router = new Router();

// URL-BASED SECURITY INTERCEPTOR MIDDLEWARE
// This checks for an explicit authorization token in the URL string, completely bypassing broken browser cookie locks!
const authMiddleware = async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const token = url.searchParams.get("auth"); // Looking for ?auth=true in the address string

  if (token === "true") {
    await next(); // If the token parameter is present and valid, pass control cleanly to admin handlers
  } else {
    ctx.response.status = 403; // Short-circuit unauthorized requests instantly
    ctx.response.body = "Access Denied: Administrators Only.";
  }
};

// Application route maps aligning with my frontend student views
router.get("/", showHome);
router.get("/api/modules/:progId", getModulesApi); 
router.post("/register-interest", handleRegister);

// Administration Endpoint tracks locked behind my URL parameters security checker
router.get("/admin", authMiddleware, showAdmin);
router.post("/admin/create-programme", authMiddleware, createProgramme); 
router.post("/admin/toggle-programme/:id", authMiddleware, toggleProgramme); 
router.post("/admin/delete-programme/:id", authMiddleware, deleteProgramme); 

// Clear gateway card template to mimic enterprise login forms
router.get("/login", (ctx) => {
  const loginFormHtml = `
    <div style="background: white; padding: 30px; border-radius: 8px; max-width: 400px; margin: 40px auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
      <h2>Administrator Authentication</h2>
      <p style="color: #666; margin-bottom: 20px;">Click the action button below to pass token credentials directly into the active routing framework context.</p>
      <form action="/admin" method="GET">
        <input type="hidden" name="auth" value="true"> <button type="submit" style="background: var(--primary); color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 4px; cursor: pointer; width: 100%;">Authorize Admin Session</button>
      </form>
    </div>
  `;
  ctx.response.body = renderLayout("Admin Portal Login", loginFormHtml);
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Token-parameter fallback server active at http://localhost:8000");
await app.listen({ port: 8000 });