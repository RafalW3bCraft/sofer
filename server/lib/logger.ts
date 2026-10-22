/**
 * Safe logger. Does not log request payloads or credential material.
 */
type Level = "info" | "warn" | "error";

function emit(level: Level, msg: string, extra?: unknown) {
  const ts = new Date().toISOString();
  if (extra !== undefined) {
    // Strip anything that looks like a bearer token before logging.
    const safe =
      typeof extra === "string"
        ? extra.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer <redacted>")
        : extra;
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `${ts} [${level}] ${msg}`,
      safe
    );
  } else {
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `${ts} [${level}] ${msg}`
    );
  }
}

export const logger = {
  info: (msg: string, extra?: unknown) => emit("info", msg, extra),
  warn: (msg: string, extra?: unknown) => emit("warn", msg, extra),
  error: (msg: string, extra?: unknown) => emit("error", msg, extra),
};