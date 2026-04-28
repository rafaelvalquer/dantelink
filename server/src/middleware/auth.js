import { env } from "../config/env.js";
import { verifyJwt } from "../utils/jwt.js";

export function requireAuth(req, _res, next) {
  try {
    const authorization = String(req.get("authorization") || "");
    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      const error = new Error("Autenticacao obrigatoria.");
      error.status = 401;
      error.code = "AUTH_REQUIRED";
      throw error;
    }

    const payload = verifyJwt(match[1], env.authSecret);

    if (!payload?.sub) {
      const error = new Error("Sessao invalida ou expirada.");
      error.status = 401;
      error.code = "AUTH_INVALID_TOKEN";
      throw error;
    }

    req.auth = {
      token: match[1],
      userId: String(payload.sub),
      email: String(payload.email || ""),
    };

    next();
  } catch (error) {
    next(error);
  }
}
