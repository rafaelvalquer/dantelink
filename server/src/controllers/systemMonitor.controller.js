import { getSystemMonitorOverview } from "../services/systemMonitor.service.js";

export async function getSystemMonitorOverviewHandler(req, res, next) {
  try {
    const overview = await getSystemMonitorOverview();
    res.json({ ok: true, overview });
  } catch (error) {
    next(error);
  }
}
