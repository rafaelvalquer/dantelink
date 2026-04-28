import crypto from "crypto";

const KEY_LENGTH = 64;

function createHttpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  if (code) {
    error.code = code;
  }
  return error;
}

export async function hashPassword(password = "") {
  const normalized = String(password || "");

  if (normalized.length < 8) {
    throw createHttpError(
      400,
      "A senha deve ter pelo menos 8 caracteres.",
      "AUTH_PASSWORD_TOO_SHORT",
    );
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(normalized, salt, KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key.toString("hex"));
    });
  });

  return `${salt}:${derived}`;
}

export async function verifyPassword(password = "", storedHash = "") {
  const [salt, expectedHex] = String(storedHash || "").split(":");

  if (!salt || !expectedHex) {
    return false;
  }

  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(String(password || ""), salt, KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key);
    });
  });

  const expected = Buffer.from(expectedHex, "hex");

  if (derived.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(derived, expected);
}
