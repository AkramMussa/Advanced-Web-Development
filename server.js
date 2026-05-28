// server.js
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { showHome, handleRegister, showAdmin, getModulesApi } from "./controller.js";

const app = new Application();
const router = new Router();

const authMiddleware = async (ctx, next) => {
  const isAuth = ctx.cookies.get("authenticated_session");
  if (isAuth === "true") {
    await next();
  } else {
    ctx.response.status = 403;
    ctx.response.body = "Access Denied: Administrators Only.";
  }
};

// Application route maps aligning cleanly with external controllers 
router.get("/", showHome);
router.get("/api/modules/:progId", getModulesApi); // Asynchronous JSON endpoint [cite: 146]
router.post("/register-interest", handleRegister);
router.get("/admin", authMiddleware, showAdmin);

router.get("/login", (ctx) => {
  ctx.cookies.set("authenticated_session", "true");
  ctx.response.redirect("/admin");
});
router.get("/logout", (ctx) => {
  ctx.cookies.set("authenticated_session", "false");
  ctx.response.redirect("/");
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Fully compliant scenario server running at http://localhost:8000");
await app.listen({ port: 8000 });