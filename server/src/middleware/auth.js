import { env } from "../config/env.js";
import { createHttpError } from "../utils/httpError.js";
import { verifyJwt } from "../utils/jwt.js";
import { canAccessSystemMonitor } from "../utils/systemMonitorAccess.js";

export function requireAuth(req, _res, next) {
  try {
    const authorization = String(req.get("authorization") || "");
    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      throw createHttpError(401, "Autenticação obrigatória.", "AUTH_REQUIRED");
    }

    const payload = verifyJwt(match[1], env.authSecret);

    if (!payload?.sub) {
      throw createHttpError(401, "Sessão inválida ou expirada.", "AUTH_INVALID_TOKEN");
    }

    req.auth = {
      token: match[1],
      userId: String(payload.sub),
      email: String(payload.email || ""),
      canAccessSystemMonitor: canAccessSystemMonitor(payload.email),
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireSystemMonitorAccess(req, _res, next) {
  try {
    if (!req.auth?.canAccessSystemMonitor) {
      throw createHttpError(
        403,
        "Voce nao tem permissao para acessar a monitoria do sistema.",
        "SYSTEM_MONITOR_FORBIDDEN",
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}
