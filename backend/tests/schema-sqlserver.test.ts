import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { converterParaSqlServer } from "../scripts/gerar-schema-sqlserver.js";

describe("schema SQL Server", () => {
  it("está sincronizado com o schema MySQL (rode npm run schema:sqlserver)", () => {
    const mysql = readFileSync("prisma/schema.prisma", "utf8");
    const sqlserver = readFileSync("prisma/sqlserver/schema.prisma", "utf8");
    expect(sqlserver).toBe(converterParaSqlServer(mysql));
  });

  it("converte tipos nativos e rejeita enums", () => {
    const saida = converterParaSqlServer('provider = "mysql"\nx String @db.VarChar(10)\ny String @db.Text');
    expect(saida).toContain('provider = "sqlserver"');
    expect(saida).toContain("@db.NVarChar(10)");
    expect(saida).toContain("@db.NVarChar(Max)");
    expect(() => converterParaSqlServer("enum Perfil {\n A\n}")).toThrow(/enum/);
  });
});
