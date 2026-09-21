import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise = null;

export async function connectDb() {
  mongoose.set("strictQuery", true);
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;
  connectionPromise = mongoose.connect(env.mongoUri).catch((error) => {
    connectionPromise = null;
    throw error;
  });
  await connectionPromise;
  return mongoose.connection;
}

export async function disconnectDb() {
  connectionPromise = null;
  await mongoose.disconnect();
}
