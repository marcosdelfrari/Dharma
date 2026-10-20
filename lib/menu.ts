export const PATHS = {
  associates: "/app/acolhimento/associados",
  services: "/app/acolhimento/servicos",
  triage: "/app/acolhimento/triagem",
  institutional: "/app/acolhimento/clientesinstitucionais",
  orders: "/app/loja/pedidos",
  products: "/app/loja/produtos",
  newOrder: "/app/loja/novo-pedido",
  professionals: "/app/profissionais",
  analytics: "/app/relatorios/dashboard",
  servicesReport: "/app/relatorios/servicos",
  professionalServicesReport: "/relatorio/servicos",
  prescribers: "/app/prescritores",
  history: "/app/historico",
  tags: "/app/tags",
  adminAssociation: "/app/admin/associacao",
  adminUsers: "/app/admin/usuarios",
  adminAppearance: "/app/admin/aparencia",
  contact: "/contato",
  newPassword: "/nova-senha",
} as const;

export const MENU_SECTIONS = [
  {
    id: "acolhimento",
    label: "Acolhimento",
    items: [
      { id: "associados", label: "Associados", path: PATHS.associates },
      { id: "servicos", label: "Atendimentos", path: PATHS.services },
      { id: "triagem", label: "Triagem", path: PATHS.triage },
      {
        id: "institutional-clients",
        label: "Clientes institucionais",
        path: PATHS.institutional,
      },
    ],
  },
  {
    id: "loja",
    label: "Loja",
    items: [
      { id: "pedidos", label: "Pedidos", path: PATHS.orders },
      { id: "novo-pedido", label: "Novo pedido", path: PATHS.newOrder },
      { id: "produtos", label: "Produtos", path: PATHS.products },
    ],
  },
  {
    id: "profissionais",
    label: "Profissionais",
    items: [
      { id: "profissionais", label: "Profissionais", path: PATHS.professionals },
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    items: [
      { id: "relatorios-dashboard", label: "Dashboard", path: PATHS.analytics },
      { id: "relatorios-servicos", label: "Atendimentos", path: PATHS.servicesReport },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    adminOnly: true,
    items: [
      { id: "associacao", label: "Associação", path: PATHS.adminAssociation },
      { id: "usuarios", label: "Usuários do sistema", path: PATHS.adminUsers },
      { id: "aparencia", label: "Aparência", path: PATHS.adminAppearance },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    items: [
      { id: "historico", label: "Histórico", path: PATHS.history },
      { id: "tags", label: "Tags", path: PATHS.tags },
    ],
  },
] as const;

export const STAFF_ROLES = ["Administrador", "Acolhimento", "Produção"];
