import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

async function start() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
