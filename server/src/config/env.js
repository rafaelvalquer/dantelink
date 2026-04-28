import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri:
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/my-page-app",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
  authSecret:
    process.env.AUTH_SECRET || "dandelink-dev-secret-change-me",
  authTokenTtl: process.env.AUTH_TOKEN_TTL || "7d",
};
