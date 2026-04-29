import mongoose from "mongoose";
import { env } from "./env.js";
import { logInfo } from "../utils/logger.js";

export async function connectToMongo() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logInfo("mongo.connected");
}
