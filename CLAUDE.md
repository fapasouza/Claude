# Boas Práticas — guia para o Claude

Módulo "Boas Práticas": monorepo npm com `backend/` (Node 22, Express 5, Prisma 7, TypeScript) e `frontend/` (React 19, Vite, React Router 7).

## Comandos
- `npm run lint` (typecheck do backend + oxlint no frontend), `npm run build`, `npm test` — rode todos antes de commitar.
- Banco local: `docker compose up -d mysql`; migrações: `npm run db:migrate -w backend`; seed: `npm run db:seed -w backend`.

## Regras do banco (MySQL local → SQL Server no Azure)
- Edite só `backend/prisma/schema.prisma`. Depois rode `npm run schema:sqlserver -w backend` para regenerar `prisma/sqlserver/schema.prisma` (o teste `schema-sqlserver.test.ts` falha se esquecer).
- Toda mudança de schema precisa de migração nas DUAS pastas: `prisma/migrations` (MySQL, via `prisma migrate dev`) e `prisma/sqlserver/migrations` (via `DB_PROVIDER=sqlserver prisma migrate dev --create-only` contra um SQL Server local — `docker compose --profile sqlserver up -d`).
- Não use `enum`, listas escalares nem tipos nativos além de `@db.VarChar(n)`/`@db.Text`. Relações sempre com `onDelete: NoAction, onUpdate: NoAction`.
- Não use `mode: "insensitive"` nem SQL cru específico de um banco; as collations padrão dos dois já são case-insensitive.

## Convenções
- Código, rotas, mensagens e nomes de domínio em português; tabelas/colunas em snake_case via `@@map`/`@map`.
- Cada módulo em `backend/src/modules/<modulo>/` com rotas + validação zod; regras de permissão/fluxo em funções puras testáveis (ex.: `boas-praticas/fluxo.ts`).
- Erros: lance `ErroApp` (ou helpers de `lib/erros.ts`); o middleware `tratarErros` formata a resposta `{ erro, detalhes }`.
