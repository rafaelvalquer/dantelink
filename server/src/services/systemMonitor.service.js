import mongoose from "mongoose";
import MyPage from "../models/MyPage.js";
import User from "../models/User.js";

const MAX_RECENT_ERRORS = 24;

const monitorState = {
  recentErrors: [],
  imports: {
    successTotal: 0,
    partialTotal: 0,
    manualTotal: 0,
    failedTotal: 0,
  },
};

function pushRecentError(event = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: String(event.level || "error"),
    code: String(event.code || "UNHANDLED_ERROR"),
    message: String(event.message || "Erro interno do servidor."),
    route: String(event.route || ""),
    requestId: String(event.requestId || ""),
    userId: event.userId ? String(event.userId) : "",
  };

  monitorState.recentErrors.unshift(entry);
  monitorState.recentErrors = monitorState.recentErrors.slice(0, MAX_RECENT_ERRORS);
}

function getMongoStatusLabel(readyState = 0) {
  switch (Number(readyState)) {
    case 1:
      return "Conectado";
    case 2:
      return "Conectando";
    case 3:
      return "Desconectando";
    default:
      return "Desconectado";
  }
}

export function recordSystemMonitorError(event = {}) {
  pushRecentError(event);

  if (String(event.code || "").startsWith("SHOP_IMPORT")) {
    monitorState.imports.failedTotal += 1;
  }
}

export function recordImportPreviewResult(result = {}) {
  const status = String(result?.status || "manual").toLowerCase();

  if (status === "complete") {
    monitorState.imports.successTotal += 1;
    return;
  }

  if (status === "partial") {
    monitorState.imports.partialTotal += 1;
    return;
  }

  monitorState.imports.manualTotal += 1;
}

export async function getSystemMonitorOverview() {
  const [usersTotal, pagesTotal, latestUser] = await Promise.all([
    User.countDocuments(),
    MyPage.countDocuments(),
    User.findOne().sort({ createdAt: -1 }).select({ createdAt: 1 }).lean(),
  ]);

  const dbStatus = getMongoStatusLabel(mongoose.connection.readyState);
  const appStatus = mongoose.connection.readyState === 1 ? "Operacional" : "Atencao";

  return {
    health: {
      appStatus,
      dbStatus,
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
    counts: {
      usersTotal,
      pagesTotal,
    },
    latest: {
      latestUserCreatedAt: latestUser?.createdAt || null,
    },
    imports: {
      ...monitorState.imports,
    },
    recentErrors: monitorState.recentErrors.slice(0, 8),
  };
}
