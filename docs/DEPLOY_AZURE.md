# Homologação e produção no Azure (VM + SQL Server)

Roteiro para publicar o módulo numa máquina virtual do Azure usando SQL Server. O código é o mesmo do desenvolvimento; só mudam as variáveis de ambiente.

## 1. Banco de dados

Há duas opções:

- **Azure SQL Database** (recomendado): gerenciado, com backup automático.
- **SQL Server instalado na VM** ou numa VM separada.

Crie um banco vazio (ex.: `boaspraticas`) e um usuário próprio para a aplicação, sem usar o `sa`:

```sql
CREATE LOGIN boaspraticas_app WITH PASSWORD = '<senha forte>';
-- dentro do banco boaspraticas:
CREATE USER boaspraticas_app FOR LOGIN boaspraticas_app;
ALTER ROLE db_ddladmin ADD MEMBER boaspraticas_app;   -- necessário para rodar as migrações
ALTER ROLE db_datareader ADD MEMBER boaspraticas_app;
ALTER ROLE db_datawriter ADD MEMBER boaspraticas_app;
```

No Azure SQL, libere o acesso da VM: no firewall do servidor, ou melhor ainda, por Private Endpoint ou VNet.

## 2. Máquina virtual

Recomendado: **Ubuntu 24.04 LTS** com Node.js 22, Nginx e systemd. Se a TI preferir Windows Server, veja a seção 6.

```bash
# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# Usuário de serviço e código
sudo useradd --system --create-home --shell /usr/sbin/nologin boaspraticas
sudo git clone https://github.com/fapasouza/Claude.git /opt/boaspraticas
sudo chown -R boaspraticas: /opt/boaspraticas
```

## 3. Configuração (`/opt/boaspraticas/backend/.env`)

```ini
NODE_ENV=production
PORT=3333
DB_PROVIDER=sqlserver
DATABASE_URL="sqlserver://<servidor>.database.windows.net:1433;database=boaspraticas;user=boaspraticas_app;password=<senha>;encrypt=true;trustServerCertificate=false"
JWT_SECRET=<gere com: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
JWT_EXPIRES_IN=8h
CORS_ORIGIN=https://boaspraticas.npegroup.com.br
FRONTEND_DIST=../frontend/dist
```

> `DB_PROVIDER=sqlserver` precisa estar definido **antes** do `npm ci`/`npm run build`, porque o Prisma Client é gerado para o banco escolhido.
>
> Senhas com `;`, `=` ou `{` precisam ficar entre chaves na URL: `password={minha;senha}`.

## 4. Build, migrações e primeiro administrador

```bash
cd /opt/boaspraticas
sudo -u boaspraticas bash -c '
  set -a; source backend/.env; set +a
  npm ci
  npm run build
  npm run db:deploy -w backend
  npm run criar-admin -w backend -- "Nome do Admin" admin@npegroup.com.br "<senha inicial>"
'
```

Não rode o `db:seed` em produção: ele cria usuários de exemplo com senha padrão.

## 5. Serviço e proxy reverso

`/etc/systemd/system/boaspraticas.service`:

```ini
[Unit]
Description=Boas Praticas
After=network.target

[Service]
User=boaspraticas
WorkingDirectory=/opt/boaspraticas/backend
EnvironmentFile=/opt/boaspraticas/backend/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now boaspraticas
curl http://localhost:3333/api/health   # {"status":"ok","banco":"sqlserver"}
```

`/etc/nginx/sites-available/boaspraticas` (depois, ative HTTPS com `certbot --nginx`):

```nginx
server {
    listen 80;
    server_name boaspraticas.npegroup.com.br;
    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

No grupo de segurança de rede (NSG) da VM, libere apenas as portas 80/443, e 22 somente a partir da rede da empresa.

## 6. Alternativa: Windows Server

- Instale o Node.js 22 LTS e rode a aplicação como serviço com o [NSSM](https://nssm.cc/): `nssm install BoasPraticas "C:\Program Files\nodejs\node.exe" dist\server.js`, com diretório `...\backend` e as mesmas variáveis do `.env`.
- Use o IIS com **URL Rewrite + ARR** como proxy reverso para `http://localhost:3333` e configure o certificado HTTPS no IIS.

## 7. Atualizações

```bash
cd /opt/boaspraticas && sudo -u boaspraticas git pull
sudo -u boaspraticas bash -c 'set -a; source backend/.env; set +a; npm ci && npm run build && npm run db:deploy -w backend'
sudo systemctl restart boaspraticas
```

## 8. Levar dados do MySQL para o SQL Server (se necessário)

As tabelas e colunas têm os mesmos nomes nos dois bancos. Se houver dados de homologação no MySQL que precisem ir para o SQL Server:

1. Rode `npm run db:deploy` no SQL Server para criar as tabelas vazias.
2. Exporte do MySQL e importe no SQL Server, na ordem `usuarios` → `categorias` → `boas_praticas` → `historico_boas_praticas`. Use o *SQL Server Import and Export Wizard*, o Azure Data Studio ou o SSMA for MySQL. Nas colunas `id`, ative `SET IDENTITY_INSERT <tabela> ON`.
