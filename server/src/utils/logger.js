function omitUndefinedEntries(input = {}) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

export function getRequestLogContext(req) {
  return omitUndefinedEntries({
    requestId: req?.requestId,
    method: req?.method,
    route: req?.originalUrl,
    userId: req?.auth?.userId,
  });
}

function writeLog(level, event, meta = {}) {
  const entry = omitUndefinedEntries({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...meta,
  });

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function logInfo(event, meta = {}) {
  writeLog("info", event, meta);
}

export function logWarn(event, meta = {}) {
  writeLog("warn", event, meta);
}

export function logError(event, meta = {}) {
  writeLog("error", event, meta);
}

export function serializeError(error) {
  return omitUndefinedEntries({
    name: error?.name,
    message: error?.message,
    code: error?.code,
    status: error?.status || error?.statusCode,
    stack: error?.stack,
    details: error?.details,
  });
}
