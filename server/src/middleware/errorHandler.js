import { env } from "../config/env.js";
import { logError, serializeError } from "../utils/logger.js";

export function errorHandler(error, req, res, _next) {
  if (error?.name === "MulterError" && error?.code === "LIMIT_FILE_SIZE") {
    error.status = 400;
    error.message = "A imagem deve ter no máximo 5 MB.";
    error.code = "AVATAR_TOO_LARGE";
  }

  const status = Number(error?.status || error?.statusCode) || 500;
  const payload = {
    ok: false,
    error: error?.message || "Erro interno do servidor.",
    requestId: req?.requestId,
  };

  if (error?.code) {
    payload.code = error.code;
  }

  logError("http.request.failed", {
    requestId: req?.requestId,
    method: req?.method,
    route: req?.originalUrl,
    userId: req?.auth?.userId,
    status,
    error: serializeError(error),
  });

  if (env.nodeEnv !== "production") {
    if (error?.details) {
      payload.details = error.details;
    }
  }

  res.status(status).json(payload);
}
