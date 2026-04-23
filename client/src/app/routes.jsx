import { Navigate, createBrowserRouter } from "react-router-dom";
import AdminDesignPage from "../pages/AdminDesignPage.jsx";
import AdminLinksPage from "../pages/AdminLinksPageV2.jsx";
import AdminShopProductsPage from "../pages/AdminShopProductsPage.jsx";
import PublicMyPage from "../pages/PublicMyPage.jsx";
import PublicShopPage from "../pages/PublicShopPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/admin/links" replace />,
  },
  {
    path: "/admin/links",
    element: <AdminLinksPage />,
  },
  {
    path: "/admin/shop",
    element: <AdminShopProductsPage />,
  },
  {
    path: "/admin/design",
    element: <AdminDesignPage />,
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
