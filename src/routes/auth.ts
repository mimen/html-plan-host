import { Hono } from "hono";
import { handleCallback, logout, startLogin } from "../auth.ts";
import { esc, page } from "../views/layout.ts";

export const authRoutes = new Hono();

authRoutes.get("/login", (c) => startLogin(c, c.req.query("returnTo") ?? "/"));

authRoutes.get("/logout", (c) => {
  logout(c);
  return c.redirect("/");
});

authRoutes.get("/callback", async (c) => {
  const result = await handleCallback(c);
  if (result.ok) return c.redirect(result.returnTo || "/");

  const detail =
    result.error === "Domain not allowed"
      ? `The account ${esc(result.email ?? "")} isn't on an allowed domain. Sign in with your Salesforce or Heroku email.`
      : "Sign-in failed. Please try again.";

  return c.html(
    page(
      "Access denied",
      `<header><h1>Access denied</h1></header>
       <p>${detail}</p>
       <p><a href="/auth/login">Try again</a></p>`,
    ),
    403,
  );
});
