import { readFile } from "node:fs/promises";
import path from "node:path";

const routesPath = path.join(process.cwd(), "src", "app", "routes.jsx");
const source = await readFile(routesPath, "utf8");

const requiredPaths = [
  "/",
  "/login",
  "/cadastro",
  "/admin/links",
  "/admin/shop",
  "/admin/analytics",
  "/admin/design",
  "/admin/system-monitor",
  "/:slug/shop",
  "/:slug",
];

const requiredLazyPages = [
  "LandingPage",
  "LoginPage",
  "RegisterPage",
  "AdminLinksPage",
  "AdminShopProductsPage",
  "AdminAnalyticsDashboardPage",
  "AdminDesignPage",
  "AdminSystemMonitorPage",
  "PublicMyPage",
  "PublicShopPage",
];

const missingPaths = requiredPaths.filter((routePath) => {
  const escaped = routePath.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return !new RegExp(`path:\\s*["']${escaped}["']`, "u").test(source);
});

const missingLazyPages = requiredLazyPages.filter((pageName) => {
  return !new RegExp(`const\\s+${pageName}\\s*=\\s*lazy\\(`, "u").test(source);
});

const hasSuspense = /<Suspense\s+fallback=/u.test(source);
const hasFallback = /function\s+RouteLoadingFallback/u.test(source);

if (missingPaths.length || missingLazyPages.length || !hasSuspense || !hasFallback) {
  if (missingPaths.length) {
    console.error(`Rotas ausentes: ${missingPaths.join(", ")}`);
  }

  if (missingLazyPages.length) {
    console.error(`Páginas sem lazy loading: ${missingLazyPages.join(", ")}`);
  }

  if (!hasSuspense) {
    console.error("Suspense fallback não encontrado em routes.jsx.");
  }

  if (!hasFallback) {
    console.error("RouteLoadingFallback não encontrado em routes.jsx.");
  }

  process.exit(1);
}

console.log("check:routes ok - rotas principais e lazy loading preservados.");
