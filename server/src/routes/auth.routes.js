import { Router } from "express";
import {
  loginHandler,
  meHandler,
  registerHandler,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/auth/register", registerHandler);
router.post("/auth/login", loginHandler);
router.get("/auth/me", requireAuth, meHandler);

export default router;
