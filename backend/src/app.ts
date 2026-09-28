import { existsSync } from "node:fs";
import { resolve } from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { tratarErros } from "./middlewares/tratarErros.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usuariosRoutes } from "./modules/usuarios/usuarios.routes.js";
import { categoriasRoutes } from "./modules/categorias/categorias.routes.js";
import { boasPraticasRoutes } from "./modules/boas-praticas/boas-praticas.routes.js";

export function criarApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", banco: env.DB_PROVIDER });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/usuarios", usuariosRoutes);
  app.use("/api/categorias", categoriasRoutes);
  app.use("/api/boas-praticas", boasPraticasRoutes);

  app.use("/api", (_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada." });
  });

  // Em produção o mesmo processo entrega o frontend (SPA): arquivos estáticos + fallback para index.html.
  const frontend = resolve(env.FRONTEND_DIST);
  if (existsSync(resolve(frontend, "index.html"))) {
    app.use(express.static(frontend, { index: false, maxAge: "1h" }));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(resolve(frontend, "index.html")));
  }

  app.use(tratarErros);
  return app;
}
