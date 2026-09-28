# Boas Práticas

Módulo para registrar, revisar e publicar as boas práticas da empresa. Colaboradores cadastram práticas, gestores revisam e aprovam, e tudo fica com histórico.

- **Backend:** Node.js 22, Express 5, Prisma 7, TypeScript, autenticação JWT
- **Frontend:** React 19, Vite, React Router 7
- **Banco:** MySQL 8 no desenvolvimento local e SQL Server (Azure) em homologação e produção, com o mesmo código
- **Hospedagem:** VM no Azure. A API também serve o frontend, então é um único processo Node.

Veja [docs/ARQUITETURA.md](docs/ARQUITETURA.md) e [docs/DEPLOY_AZURE.md](docs/DEPLOY_AZURE.md).

## Rodando localmente

Pré-requisitos: Node.js 22+ e Docker (ou um MySQL 8 instalado).

```bash
# 1. Banco MySQL (já cria também o banco de testes)
docker compose up -d mysql

# 2. Dependências (gera o Prisma Client automaticamente)
npm install

# 3. Configuração
cp backend/.env.example backend/.env      # ajuste se necessário

# 4. Tabelas e dados iniciais
npm run db:migrate -w backend
npm run db:seed -w backend

# 5. Subir a API (porta 3333) e o frontend (porta 5173), em dois terminais
npm run dev:api
npm run dev:web
```

Acesse http://localhost:5173. Usuários criados pelo seed (senha `Mudar@123`):

| E-mail | Perfil |
|---|---|
| admin@boaspraticas.local | ADMIN: tudo, inclusive usuários |
| gestor@boaspraticas.local | GESTOR: revisa, aprova, arquiva e gerencia categorias |
| colaborador@boaspraticas.local | COLABORADOR: cria e envia práticas para revisão |

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run lint` | Typecheck do backend e lint do frontend |
| `npm test` | Testes unitários e de integração (usa `DATABASE_URL_TEST`) |
| `npm run build` | Build do frontend e do backend |
| `npm start` | Sobe a API em produção servindo o frontend (`backend/dist`) |
| `npm run db:studio -w backend` | Abre o Prisma Studio para ver os dados |
| `npm run schema:sqlserver -w backend` | Regenera o schema SQL Server a partir do MySQL |

## Fluxo das boas práticas

```
RASCUNHO ──enviar──▶ EM_REVISAO ──aprovar──▶ PUBLICADA ──arquivar──▶ ARQUIVADA
    ▲                    │
    │                 devolver (com comentário obrigatório)
DEVOLVIDA ◀──────────────┘
```

- Publicadas ficam visíveis para todos. As demais, só para o autor e os gestores/admins.
- O autor edita em RASCUNHO ou DEVOLVIDA e pode excluir rascunhos.
- Cada ação fica registrada no histórico, com usuário, data e comentário.

## Estrutura

```
backend/
  prisma/schema.prisma          schema principal (MySQL). É o único que deve ser editado
  prisma/migrations/            migrações MySQL
  prisma/sqlserver/             schema e migrações SQL Server (gerados)
  src/modules/<módulo>/         rotas + validação de cada módulo
  src/modules/boas-praticas/fluxo.ts   regras do fluxo de aprovação
  tests/                        testes (vitest + supertest)
frontend/
  src/pages/                    telas
  src/api.ts                    cliente HTTP e tipos
docs/                           arquitetura e deploy
```
