import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

// O driver é escolhido pela variável DB_PROVIDER. O client precisa ter sido
// gerado com o mesmo provider (npm run prisma:generate com o .env correto).
function criarAdapter() {
  return env.DB_PROVIDER === "sqlserver"
    ? new PrismaMssql(env.DATABASE_URL)
    : new PrismaMariaDb(env.DATABASE_URL);
}

export const prisma = new PrismaClient({ adapter: criarAdapter() });
