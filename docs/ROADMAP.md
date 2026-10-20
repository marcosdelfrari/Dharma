# Dharma — roadmap vs kunksoucannabis-open

Checklist orientado a sprints. Itens **feitos neste ciclo** estão marcados com `[x]`.

## Sprint A — Fundação operacional (paridade mínima)

- [x] Config runtime (`/config/public` kunk + registration → CSS `--dharma-*`)
- [x] `role_pages` no menu (`/auth/me`)
- [x] Landing por papel (Produção, Acolhimento, Profissional)
- [x] `/cadastro?token=` convite de operador/profissional
- [x] `/relatorio/servicos` portal profissional
- [x] Redirect `/app/prescritores` → profissionais
- [x] Busca global (`/search`)
- [x] Pedidos: facets por status
- [x] Novo pedido: endereço + cotação `/freight/quote`

## Sprint B — Loja e pedidos (profundidade)

- [x] Pagar.me (link cartão/boleto/parcial) + comprovante + mensagem `PAYMENT_LOCK`
- [x] Etiquetas em massa (Loggi / Melhor Envio) + rastreio no detalhe
- [x] Bulk de pedidos (status, tags, etiquetas)
- [x] Anexos de pedido (upload + lista)
- [x] Carrinho: doação, pagamento personalizado, editar pedido (`?edit=id`)
- [x] Relatório de produção em PDF (bulk + receitas)
- [x] Recálculo de frete ao editar endereço (assistant)
- [x] Tags no carrinho / histórico de pedidos do associado (`?user_code=`)

## Sprint C — Acolhimento

- [x] Associado: pedidos recentes + link novo pedido + busca `?q=`
- [x] Triagem: drawer, status, atendente, contadores
- [x] Associado: upload/lista de documentos + receita cadastrada
- [x] Triagem: uTalk sync, chat_id, vínculo associado, sync fila
- [x] Serviços: drawer detalhe (valores, pagamento, marcar pago)
- [x] Associado: abas completas (dados, pedidos, pacientes, anotações, documentos, histórico)
- [x] Serviços: comprovantes, tags, grupo de booking
- [x] Associado: aba Prescritor (prescritor, data e receita)
- [x] Clientes institucionais: drawer (dados, endereço, anotações, histórico)
- [x] Novo pedido: cliente institucional (`?ic=`, busca e payload API)

## Sprint D — Admin e integrações

- [ ] Admin: integrações, storage, webhooks, instalação
- [ ] Triagem config, erros, cache
- [ ] Apps `registration` e `doc-sign` (ou rotas equivalentes no Next)

## Sprint E — Packages / DX

- [ ] `@kunk/api-client` tipado no monorepo ou client gerado
- [ ] Toast, error boundary, cache de listagens
- [ ] `@kunk/forms` ou formulários compartilhados
- [ ] E2E críticos (login, pedido, convite)

## Como priorizar

1. Sprint B se a loja for o gargalo operacional.
2. Sprint C se acolhimento/triagem for o volume diário.
3. Sprint D antes de multi-tenant ou deploys sem o Admin legado.
