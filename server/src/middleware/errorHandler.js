import { env } from "../config/env.js";

export function errorHandler(error, _req, res, _next) {
  const status = Number(error?.status || error?.statusCode) || 500;
  const payload = {
    ok: false,
    error: error?.message || "Erro interno do servidor.",
  };

  if (error?.code) {
    payload.code = error.code;
  }

  if (env.nodeEnv !== "production") {
    console.error(error);

    if (error?.details) {
      payload.details = error.details;
    }
  }

  res.status(status).json(payload);
}
