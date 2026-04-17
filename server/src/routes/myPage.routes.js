import { Router } from "express";
import { uploadAvatarHandler } from "../controllers/avatar.controller.js";
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
import { updateShopHandler } from "../controllers/shop.controller.js";

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

export default router;
