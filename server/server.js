import { createApp } from "./src/app.js";
import { env } from "./src/config/env.js";
import { connectToMongo } from "./src/config/mongo.js";

async function startServer() {
  await connectToMongo();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Servidor iniciado em http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Falha ao iniciar o servidor", error);
  process.exit(1);
});
