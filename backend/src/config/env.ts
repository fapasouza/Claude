import "dotenv/config";
import { z } from "zod";

const esquema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  DB_PROVIDER: z.enum(["mysql", "sqlserver"]).default("mysql"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  /** Pasta com o build do frontend. Se existir, a API também serve o site (usado no Azure). */
  FRONTEND_DIST: z.string().default("../frontend/dist"),
});

const resultado = esquema.safeParse(process.env);

if (!resultado.success) {
  console.error("Variáveis de ambiente inválidas:", z.flattenError(resultado.error).fieldErrors);
  throw new Error("Configuração de ambiente inválida. Veja backend/.env.example.");
}

export const env = resultado.data;
