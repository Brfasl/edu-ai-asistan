import "dotenv/config";
import { buildApp } from "./app";
import { prisma } from "./core/db";
import { loadEnv } from "./core/env";

async function main() {
  const env = loadEnv();
  const app = await buildApp(env);

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`Listening on http://${env.HOST}:${env.PORT}`);

  const shutdown = async () => {
    try {
      await app.close();
    } finally {
      await prisma.$disconnect();
    }
  };
  process.once("SIGINT", () => {
    void shutdown().then(() => process.exit(0));
  });
  process.once("SIGTERM", () => {
    void shutdown().then(() => process.exit(0));
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
