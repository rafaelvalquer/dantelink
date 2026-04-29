import { Router } from "express";
import { getSystemMonitorOverviewHandler } from "../controllers/systemMonitor.controller.js";
import { requireAuth, requireSystemMonitorAccess } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireSystemMonitorAccess);
router.get("/system-monitor/overview", getSystemMonitorOverviewHandler);

export default router;
