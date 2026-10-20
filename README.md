# Dharma (Next.js + Sass)

Front operacional **Dharma** em Next.js, UI em Sass, consumindo a API local (`dharma-api`) via proxy same-origin (`/api/v1`).

## Pré-requisitos

- Node 20+
- API rodando (default `http://localhost:8056`)

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Login local

- E-mail: `afk.marcos@gmail.com`
- Senha: `Dharma`
- Papel: Administrador

### Variáveis

| Var | Default | Descrição |
|-----|---------|-----------|
| `DHARMA_API_ORIGIN` | `http://localhost:8056` | Origem da API (sem `/api/v1`) |

O Next faz rewrite de `/api/v1/*` → essa origem. O header de sessão da API permanece `X-Kunk-App: kunk` (contrato do backend).

## Telas

| Rota | Função |
|------|--------|
| `/login` | Login operador |
| `/app/acolhimento/associados` | Associados |
| `/app/acolhimento/servicos` | Atendimentos |
| `/app/acolhimento/triagem` | Fila de triagem |
| `/app/acolhimento/clientesinstitucionais` | Clientes institucionais |
| `/app/loja/pedidos` | Pedidos |
| `/app/loja/novo-pedido` | Criar pedido (carrinho staff) |
| `/app/loja/produtos` | Catálogo / estoque |
| `/app/profissionais` | Profissionais / prescritores |
| `/app/relatorios/dashboard` | Analytics (KPIs + barras) |
| `/app/relatorios/servicos` | Relatório de atendimentos |
| `/app/historico` | Activity log |
| `/app/tags` | Tags |
| `/app/admin/associacao` | Dados da associação (admin) |
| `/app/admin/usuarios` | Usuários do sistema (admin) |
| `/app/admin/aparencia` | Aparência (admin) |
| `/nova-senha` | Esqueci / redefinir senha |
| `/contato` | Fila pública de triagem |
| `/unauthorized` | Sem permissão |
| `/not-connected` | API indisponível |
