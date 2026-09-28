import "dotenv/config";

// Garante que nenhum teste toque o banco de desenvolvimento.
process.env.NODE_ENV = "test";
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}
