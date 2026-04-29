import AdminAnalyticsDashboardPage from "../pages/AdminAnalyticsDashboardPage.jsx";
import AdminSystemMonitorPage from "../pages/AdminSystemMonitorPage.jsx";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicOnlyRoute from "./PublicOnlyRoute.jsx";
import AdminDesignPage from "../pages/AdminDesignPage.jsx";
import AdminLinksPage from "../pages/AdminLinksPageV2.jsx";
import AdminShopProductsPage from "../pages/AdminShopProductsPage.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import PublicMyPage from "../pages/PublicMyPage.jsx";
import PublicShopPage from "../pages/PublicShopPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/cadastro",
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/admin/links",
    element: (
      <ProtectedRoute>
        <AdminLinksPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/shop",
    element: (
      <ProtectedRoute>
        <AdminShopProductsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/analytics",
    element: (
      <ProtectedRoute>
        <AdminAnalyticsDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/design",
    element: (
      <ProtectedRoute>
        <AdminDesignPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/system-monitor",
    element: (
      <ProtectedRoute requireSystemMonitorAccess>
        <AdminSystemMonitorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/:slug/shop",
    element: <PublicShopPage />,
  },
  {
    path: "/:slug",
    element: <PublicMyPage />,
  },
]);
