import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicOnlyRoute from "./PublicOnlyRoute.jsx";

const AdminAnalyticsDashboardPage = lazy(() => import("../pages/AdminAnalyticsDashboardPage.jsx"));
const AdminDesignPage = lazy(() => import("../pages/AdminDesignPage.jsx"));
const AdminLinksPage = lazy(() => import("../pages/AdminLinksPageV2.jsx"));
const AdminShopProductsPage = lazy(() => import("../pages/AdminShopProductsPage.jsx"));
const AdminSystemMonitorPage = lazy(() => import("../pages/AdminSystemMonitorPage.jsx"));
const LandingPage = lazy(() => import("../pages/LandingPage.jsx"));
const LoginPage = lazy(() => import("../pages/LoginPage.jsx"));
const PublicMyPage = lazy(() => import("../pages/PublicMyPage.jsx"));
const PublicShopPage = lazy(() => import("../pages/PublicShopPage.jsx"));
const RegisterPage = lazy(() => import("../pages/RegisterPage.jsx"));

function RouteLoadingFallback() {
  return (
    <div className="route-loading" role="status">
      Carregando...
    </div>
  );
}

function withSuspense(element) {
  return <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<LandingPage />),
  },
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        {withSuspense(<LoginPage />)}
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/cadastro",
    element: (
      <PublicOnlyRoute>
        {withSuspense(<RegisterPage />)}
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/admin/links",
    element: (
      <ProtectedRoute>
        {withSuspense(<AdminLinksPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/shop",
    element: (
      <ProtectedRoute>
        {withSuspense(<AdminShopProductsPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/analytics",
    element: (
      <ProtectedRoute>
        {withSuspense(<AdminAnalyticsDashboardPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/design",
    element: (
      <ProtectedRoute>
        {withSuspense(<AdminDesignPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/system-monitor",
    element: (
      <ProtectedRoute requireSystemMonitorAccess>
        {withSuspense(<AdminSystemMonitorPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: "/:slug/shop",
    element: withSuspense(<PublicShopPage />),
  },
  {
    path: "/:slug",
    element: withSuspense(<PublicMyPage />),
  },
]);
