# Boas Práticas

Módulo para registrar, revisar e publicar as boas práticas da empresa. Colaboradores cadastram práticas, gestores revisam e aprovam, e tudo fica com histórico.

- **Backend:** Node.js 22, Express 5, Prisma 7, TypeScript, autenticação JWT
- **Frontend:** React 19, Vite, React Router 7
- **Banco:** MySQL 8 no desenvolvimento local e SQL Server (Azure) em homologação e produção, com o mesmo código
- **Hospedagem:** VM no Azure. A API também serve o frontend, então é um único processo Node.

Veja [docs/ARQUITETURA.md](docs/ARQUITETURA.md) e [docs/DEPLOY_AZURE.md](docs/DEPLOY_AZURE.md).

## Rodando localmente

Pré-requisitos: [Git](https://git-scm.com/), [Node.js 22 LTS](https://nodejs.org/) (22.12 ou superior) e [Docker Desktop](https://www.docker.com/products/docker-desktop/) ou um MySQL 8 instalado.

```bash
# 1. Baixar o código
git clone -b claude/boas-praticas-module-l805vv https://github.com/fapasouza/Claude.git boas-praticas
cd boas-praticas

# 2. Subir o MySQL (já cria os bancos boaspraticas e boaspraticas_test)
docker compose up -d mysql

# 3. Instalar dependências
npm install

# 4. Criar a configuração local (no PowerShell/CMD do Windows: copy backend\.env.example backend\.env)
cp backend/.env.example backend/.env

# 5. Criar as tabelas e os dados de exemplo
npm run setup

# 6. Subir a API (porta 3333) e as telas (porta 5173)
npm run dev
```

Acesse http://localhost:5173. Para parar, use `Ctrl+C`. O banco continua no Docker; para desligar, rode `docker compose stop`.

**Sem Docker (MySQL já instalado na máquina):** pule o passo 2, crie o banco com `CREATE DATABASE boaspraticas;` e, no `backend/.env`, troque `root:root` em `DATABASE_URL` pelo seu usuário e senha do MySQL.

**Problemas comuns**
- *Porta 3306 em uso* ao subir o Docker: já existe um MySQL rodando na máquina. Pare esse serviço ou use a opção "Sem Docker".
- *`npm run setup` não conecta no banco* logo após o `docker compose up`: o MySQL leva uns 20 segundos para iniciar na primeira vez. Espere e rode de novo.

Usuários criados pelo seed (senha `Mudar@123`):

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
