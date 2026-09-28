import "dotenv/config";
import { defineConfig } from "prisma/config";

// DB_PROVIDER=mysql (padrão, desenvolvimento local) ou sqlserver (homologação/produção Azure).
const sqlserver = process.env.DB_PROVIDER === "sqlserver";

export default defineConfig({
  schema: sqlserver ? "prisma/sqlserver/schema.prisma" : "prisma/schema.prisma",
  migrations: {
    path: sqlserver ? "prisma/sqlserver/migrations" : "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
