// server.js
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { showHome, handleRegister, showAdmin } from "./controller.js";

const app = new Application();
const router = new Router();

// Authentication Security Check Middleware Layer
const authMiddleware = async (ctx, next) => {
  const isAuth = ctx.cookies.get("authenticated_session");
  if (isAuth === "true") {
    await next(); // Pass verification checks cleanly
  } else {
    ctx.response.status = 403; // Return access block code to client
    ctx.response.body = "Access Denied: Administrators Only.";
  }
};

// Route mapping pointing cleanly to external decoupled controllers
router.get("/", showHome);
router.post("/register-interest", handleRegister);
router.get("/admin", authMiddleware, showAdmin);

// Quick simulated login/logout routes
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

console.log("Modular architectural server running at http://localhost:8000");
await app.listen({ port: 8000 });