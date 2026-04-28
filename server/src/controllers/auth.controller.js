import { env } from "../config/env.js";
import {
  getAuthUserById,
  loginUser,
  registerUser,
} from "../services/auth.service.js";
import { signJwt } from "../utils/jwt.js";

function createAuthPayload(userResult) {
  const token = signJwt(
    {
      sub: userResult.user.id,
      email: userResult.user.email,
    },
    env.authSecret,
    { expiresIn: env.authTokenTtl },
  );

  return {
    ok: true,
    token,
    user: userResult.user,
    pageSummary: userResult.pageSummary,
  };
}

export async function registerHandler(req, res, next) {
  try {
    const result = await registerUser(req.body);
    res.status(201).json({
      ...createAuthPayload(result),
      message: "Conta criada com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const result = await loginUser(req.body);
    res.json({
      ...createAuthPayload(result),
      message: "Login realizado com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

export async function meHandler(req, res, next) {
  try {
    const result = await getAuthUserById(req.auth.userId);
    res.json({
      ok: true,
      user: result.user,
      pageSummary: result.pageSummary,
    });
  } catch (error) {
    next(error);
  }
}
