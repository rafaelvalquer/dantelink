import { Router } from "express";
import { uploadAvatarHandler } from "../controllers/avatar.controller.js";
import {
  internalizeProductImageFromUrlHandler,
  uploadProductImageHandler,
} from "../controllers/productImage.controller.js";
import {
  createLinkHandler,
  deleteLinkHandler,
  reorderLinksHandler,
  toggleLinkHandler,
  updateLinkHandler,
} from "../controllers/links.controller.js";
import {
  getMyPageHandler,
  getPublicMyPageHandler,
  updateMyPageHandler,
} from "../controllers/myPage.controller.js";
import { autocompleteLocationsHandler } from "../controllers/locations.controller.js";
import {
  createSecondaryLinkHandler,
  deleteSecondaryLinkHandler,
  reorderSecondaryLinksHandler,
  toggleSecondaryLinkHandler,
  updateSecondaryLinkHandler,
} from "../controllers/secondaryLinks.controller.js";
import { uploadAvatarSingle } from "../middleware/uploadAvatar.js";
import { uploadProductImageSingle } from "../middleware/uploadProductImage.js";
import { updateShopHandler } from "../controllers/shop.controller.js";
import {
  createShopProductHandler,
  deleteShopProductHandler,
  importShopProductHandler,
  reorderShopProductsHandler,
  toggleShopProductHandler,
  updateShopProductHandler,
} from "../controllers/shopProducts.controller.js";

const router = Router();

router.get("/my-page", getMyPageHandler);
router.put("/my-page", updateMyPageHandler);
router.get("/my-page/public/:slug", getPublicMyPageHandler);
router.post("/my-page/avatar", uploadAvatarSingle, uploadAvatarHandler);
router.get("/my-page/locations/autocomplete", autocompleteLocationsHandler);

router.post("/my-page/links", createLinkHandler);
router.patch("/my-page/links/reorder", reorderLinksHandler);
router.put("/my-page/links/:id", updateLinkHandler);
router.delete("/my-page/links/:id", deleteLinkHandler);
router.patch("/my-page/links/:id/toggle", toggleLinkHandler);

router.post("/my-page/secondary-links", createSecondaryLinkHandler);
router.patch("/my-page/secondary-links/reorder", reorderSecondaryLinksHandler);
router.put("/my-page/secondary-links/:id", updateSecondaryLinkHandler);
router.delete("/my-page/secondary-links/:id", deleteSecondaryLinkHandler);
router.patch("/my-page/secondary-links/:id/toggle", toggleSecondaryLinkHandler);

router.put("/my-page/shop", updateShopHandler);
router.post("/my-page/shop/products/import", importShopProductHandler);
router.post("/my-page/shop/products/image-from-url", internalizeProductImageFromUrlHandler);
router.post("/my-page/shop/products/image", uploadProductImageSingle, uploadProductImageHandler);
router.post("/my-page/shop/products", createShopProductHandler);
router.patch("/my-page/shop/products/reorder", reorderShopProductsHandler);
router.put("/my-page/shop/products/:id", updateShopProductHandler);
router.delete("/my-page/shop/products/:id", deleteShopProductHandler);
router.patch("/my-page/shop/products/:id/toggle", toggleShopProductHandler);

export default router;
