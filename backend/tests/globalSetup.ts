import "dotenv/config";
import { execSync } from "node:child_process";

// Os testes de integração usam um banco separado (DATABASE_URL_TEST) e aplicam as migrations nele.
export default function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    console.warn("\n⚠ DATABASE_URL_TEST não definida: testes de integração serão ignorados.\n");
    return;
  }
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "inherit" });
}
