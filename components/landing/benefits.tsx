import { RevealGroup, RevealItem } from "@/components/landing/motion";
import { SectionShell } from "@/components/landing/section-shell";

const modules = [
  {
    title: "Triagem e recepção",
    text: "Formulário de contato e fila de triagem para receber novas solicitações, qualificar o atendimento e converter ou vincular direto ao cadastro de associado.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Ficha completa do associado",
    text: "Dados cadastrais, pacientes vinculados, prescritor, anotações da equipe, documentos anexados e histórico de pedidos reunidos no mesmo painel lateral.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
      </svg>
    ),
  },
  {
    title: "Loja, pedidos e produção",
    text: "Catálogo de produtos, emissão de pedidos para associados ou clientes institucionais, relatório para a produção e ações em massa de status e tags.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    title: "Frete, etiquetas e cobrança",
    text: "Cotação de entrega no pedido, geração de etiquetas pela Loggi ou Melhor Envio e link de pagamento via Pagar.me direto na tela do pedido.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <line x1="3" x2="21" y1="9" y2="9" />
        <line x1="9" x2="9" y1="21" y2="9" />
      </svg>
    ),
  },
  {
    title: "Atendimentos e profissionais",
    text: "Cadastro de profissionais e prescritores, agendamento e registro de atendimentos com status, valor e área restrita para o profissional acompanhar sua fila.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M11 2v2" />
        <path d="M5 2v2" />
        <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 6 6 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2h-1" />
        <path d="M8 15a6 6 0 0 0 12 0v-3" />
        <circle cx="20" cy="10" r="2" />
      </svg>
    ),
  },
  {
    title: "Dashboard e histórico",
    text: "Indicadores mensais de associados, pedidos, atendimentos e recepção, além do registro de atividades dos usuários e controle de permissões por setor.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
];

export function LandingBenefits() {
  return (
    <SectionShell
      id="plataforma"
      title="O que o painel Dharma entrega"
      subtitle="Uma operação associativa centralizada — da chegada na triagem à emissão da etiqueta de envio, com histórico em cada cadastro."
    >
      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((item) => (
          <RevealItem
            key={item.title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-8 transition-all hover:border-accent/20 hover:bg-surface-elevated"
          >
            <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-accent/5 blur-3xl transition-colors group-hover:bg-accent/10" />

            <div className="relative z-10">
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-background text-muted-foreground transition-colors group-hover:border-accent/30 group-hover:text-accent">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground group-hover:text-foreground/80">
                {item.text}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}
