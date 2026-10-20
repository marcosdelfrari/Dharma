# Dharma API

API REST do Dharma (PostgreSQL).

Documentação do contrato: [https://kunksoucannabis.ong.br/](https://kunksoucannabis.ong.br/) (código em [kunk-soucannabis-docs](https://github.com/soucannabis/kunk-soucannabis-docs)).

## Desenvolvimento

```bash
cp .env.example .env
# Postgres: DATABASE_URL (Prisma Postgres) ou PG_URL / PGHOST+PG*
npm install
npm run db:generate   # após alterar prisma/schema.prisma
npm run dev
```

### Prisma (schema + client)

O banco remoto (ex. `db.prisma.io`) usa `DATABASE_URL` no `.env` (também aceitos `PG_URL`, `POSTGRES_URL`, `PRISMA_DATABASE_URL`).

```bash
npm run db:pull      # introspect → prisma/schema.prisma
npm run db:generate  # @prisma/client
npm run db:studio    # UI local
```

A API continua usando SQL nativo (`pg`); o client Prisma fica em `src/db/prisma.js` para código novo ou scripts.

Base URL local (npm): `http://localhost:8056/api/v1` 
Base URL Docker: `http://localhost:4250/api/v1`

Swagger UI (spec gerado das rotas): `http://localhost:8056/docs` — regenere após novas rotas com `npm run docs:openapi`.

## Docker (hot reload)

Sobe a API na porta **4250** com volume do código local e reinício automático via nodemon:

```bash
cp .env.example .env   # se ainda não tiver
# PG_URL (ou PGHOST/PG*) no .env
docker compose up --build -d
curl http://localhost:4250/api/v1/health
```

Alterações em `src/` reiniciam o processo automaticamente.

```bash
docker compose logs -f dharma-api
docker compose down
```

## Sample data

```bash
npm run seed:sample            # truncate + popula o banco
npm run seed:sample:generate   # só gera fixtures/*.json
```

Detalhes e login demo: [`sample-data/README.md`](./sample-data/README.md).

## Insomnia (testes manuais)

Importe [`insomnia/dharma-api.insomnia.json`](./insomnia/dharma-api.insomnia.json) — ver [`insomnia/README.md`](./insomnia/README.md).

## Testes

```bash
npm test
npm run test:unit
npm run test:integration
```

Toda feature nova deve incluir testes. `npm test` deve passar antes de considerar a entrega pronta.

### Suites live de frete (Loggi / Melhor Envio)

Arquivos `tests/integration/modules/*.live.test.js` **não** rodam no `npm test` padrão.
Só executam quando **ambas** as flags estiverem `true`:

```bash
RUN_LIVE_FREIGHT_TESTS=true npm test -- tests/integration/modules/loggi.live.test.js
RUN_LIVE_FREIGHT_TESTS=true npm test -- tests/integration/modules/melhorenvio.live.test.js
```

Também é necessário ter o módulo ativo no Admin, credenciais (`system_api_credentials` ou env) e configs de Loja
(`store.ship_from`, `store.freight.package`, `store.freight.content_declaration`) preenchidas.
Módulos permanecem **desabilitados** por default (só Admin ativa via `system_configs`).

