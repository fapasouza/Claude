import { criarApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const servidor = criarApp().listen(env.PORT, () => {
  console.log(`API Boas Práticas rodando em http://localhost:${env.PORT} (banco: ${env.DB_PROVIDER})`);
});

async function encerrar() {
  servidor.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
