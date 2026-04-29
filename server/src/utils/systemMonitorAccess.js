import { env } from "../config/env.js";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function getAllowedEmails() {
  return String(env.systemMonitorEmails || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
}

export function canAccessSystemMonitor(email = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  return getAllowedEmails().includes(normalizedEmail);
}
