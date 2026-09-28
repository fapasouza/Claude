# Arquitetura

## Visão geral

```
Navegador (React SPA)
      │  HTTPS  /api/*  (JWT no header Authorization)
      ▼
Node.js + Express  ──  serve também os arquivos do frontend (produção)
      │  Prisma ORM + driver adapter
      ▼
MySQL 8 (local)  |  SQL Server / Azure SQL (homologação e produção)
```

- **Um repositório, dois pacotes** (npm workspaces): `backend/` e `frontend/`.
- **Em desenvolvimento**, o Vite (porta 5173) encaminha `/api` para a API (porta 3333).
- **Em produção**, `npm run build` gera `frontend/dist`, e a própria API entrega esses arquivos. Assim fica um único processo e uma única porta na VM, sem CORS.

## Backend

| Camada | Onde | Observações |
|---|---|---|
| Configuração | `src/config/env.ts` | Variáveis validadas com zod. A aplicação não sobe com configuração inválida. |
| Banco | `src/lib/prisma.ts` | Escolhe o driver pelo `DB_PROVIDER`: `@prisma/adapter-mariadb` ou `@prisma/adapter-mssql`. |
| Autenticação | `src/middlewares/autenticacao.ts` | JWT (Bearer), senhas com bcrypt, perfis `ADMIN`, `GESTOR` e `COLABORADOR`. |
| Erros | `src/middlewares/tratarErros.ts` | Resposta padrão `{ erro, detalhes }`. |
| Módulos | `src/modules/*` | `auth`, `usuarios`, `categorias`, `boas-praticas`. |

### Endpoints

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/auth/login` | público |
| GET | `/api/auth/me` | autenticado |
| GET/POST/PUT | `/api/usuarios` | ADMIN |
| GET | `/api/categorias` | autenticado |
| POST/PUT | `/api/categorias` | ADMIN, GESTOR |
| GET | `/api/boas-praticas?busca=&categoriaId=&status=&minhas=&pagina=` | autenticado (vê publicadas + as próprias; moderadores veem todas) |
| GET/POST/PUT/DELETE | `/api/boas-praticas/:id` | conforme o fluxo |
| POST | `/api/boas-praticas/:id/enviar-revisao` | autor |
| POST | `/api/boas-praticas/:id/aprovar` \| `devolver` \| `arquivar` | ADMIN, GESTOR |
| GET | `/api/health` | público (usado pelo monitoramento) |

## Portabilidade MySQL → SQL Server

O mesmo código roda nos dois bancos. Na migração, só mudam as variáveis `DB_PROVIDER` e `DATABASE_URL`. Para isso:

1. **Um schema de verdade**, `prisma/schema.prisma` (MySQL). O `prisma/sqlserver/schema.prisma` é gerado por script e um teste falha se ficar desatualizado.
2. **Migrações separadas por banco**, porque o SQL de cada um é diferente: `prisma/migrations` e `prisma/sqlserver/migrations`. O `prisma.config.ts` escolhe a pasta pelo `DB_PROVIDER`.
3. **Restrições do schema** para funcionar nos dois: sem `enum` (status e perfis são texto validado na API), apenas `VarChar`/`Text` (viram `NVARCHAR` no SQL Server) e relações com `NoAction`, porque o SQL Server rejeita múltiplos caminhos de cascade.
4. **Busca sem diferenciar maiúsculas** fica a cargo da collation padrão dos dois bancos. Não há SQL específico de nenhum deles.
5. O **CI roda os testes nos dois bancos** (MySQL 8.4 e SQL Server 2022) a cada push.

## Evoluções previstas

- **Login com a conta Microsoft (Entra ID/Azure AD):** trocar o `POST /auth/login` por OAuth/OIDC, mantendo os perfis na tabela `usuarios`.
- **Anexos:** Azure Blob Storage, com uma tabela `anexos` referenciando a boa prática.
- **Integração ao Sistema PJ:** se os dois compartilharem login e menu, basta apontar o frontend para o mesmo provedor de identidade.
