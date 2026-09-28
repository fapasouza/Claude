/**
 * Gera prisma/sqlserver/schema.prisma a partir de prisma/schema.prisma (MySQL).
 *
 * Uso: npm run schema:sqlserver
 *      npm run schema:sqlserver -- --check   (falha se o arquivo estiver desatualizado)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origem = resolve(raiz, "prisma/schema.prisma");
const destino = resolve(raiz, "prisma/sqlserver/schema.prisma");

export function converterParaSqlServer(schemaMysql: string): string {
  const convertido = schemaMysql
    .replace(/provider\s*=\s*"mysql"/, 'provider = "sqlserver"')
    // O arquivo gerado fica um nível abaixo, então o caminho de saída do client muda.
    .replace(/output\s*=\s*"\.\.\/src\/generated\/prisma"/, 'output   = "../../src/generated/prisma"')
    .replace(/@db\.VarChar\(/g, "@db.NVarChar(")
    .replace(/@db\.Text\b/g, "@db.NVarChar(Max)");

  const tiposNaoSuportados = convertido.match(/@db\.(?!NVarChar\()\w+/g);
  if (tiposNaoSuportados) {
    throw new Error(
      `Tipos nativos sem conversão para SQL Server: ${[...new Set(tiposNaoSuportados)].join(", ")}. ` +
        "Adicione a regra em scripts/gerar-schema-sqlserver.ts.",
    );
  }
  if (/^\s*enum\s+\w+/m.test(convertido)) {
    throw new Error("SQL Server não suporta enum no Prisma. Use String e valide na API.");
  }

  return (
    "// ARQUIVO GERADO por scripts/gerar-schema-sqlserver.ts - NÃO EDITE.\n" +
    "// Edite prisma/schema.prisma e rode `npm run schema:sqlserver`.\n\n" +
    convertido
  );
}

const executadoDiretamente = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executadoDiretamente) {
  const gerado = converterParaSqlServer(readFileSync(origem, "utf8"));
  if (process.argv.includes("--check")) {
    const atual = existsSync(destino) ? readFileSync(destino, "utf8") : "";
    if (atual !== gerado) {
      console.error("prisma/sqlserver/schema.prisma está desatualizado. Rode `npm run schema:sqlserver`.");
      process.exit(1);
    }
    console.log("Schema SQL Server em dia.");
  } else {
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, gerado);
    console.log(`Gerado: ${destino}`);
  }
}
