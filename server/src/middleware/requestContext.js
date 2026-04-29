import crypto from "crypto";
import { getRequestLogContext, logInfo } from "../utils/logger.js";

export function requestContext(req, res, next) {
  const startAt = Date.now();
  req.requestId = crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);

  logInfo("http.request.started", getRequestLogContext(req));

  res.on("finish", () => {
    logInfo("http.request.finished", {
      ...getRequestLogContext(req),
      status: res.statusCode,
      durationMs: Date.now() - startAt,
    });
  });

  next();
}
