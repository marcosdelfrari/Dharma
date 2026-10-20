"use client";

import { MotionCtaLink, Reveal, RevealGroup, RevealItem } from "@/components/landing/motion";
import { SectionShell } from "@/components/landing/section-shell";

const steps = [
  {
    step: "01",
    title: "Triagem",
    text: "A solicitação chega pelo formulário de contato, entra na fila de triagem e é vinculada a um associado novo ou existente.",
  },
  {
    step: "02",
    title: "Cadastro e documentos",
    text: "A equipe preenche dados, endereço, pacientes vinculados, prescritor e anexa os documentos direto na ficha do associado.",
  },
  {
    step: "03",
    title: "Atendimentos e pedidos",
    text: "Os atendimentos são registrados com profissional e status, e os pedidos são montados na loja com cálculo de frete.",
  },
  {
    step: "04",
    title: "Produção e envio",
    text: "A equipe acompanha o status do pedido, emite relatório de produção, gera etiquetas de envio e consulta tudo no dashboard.",
  },
];

export function LandingHowItWorks() {
  return (
    <SectionShell
      id="como-funciona"
      title="Rotina clara, da triagem ao envio."
      subtitle="Quatro etapas diretas no mesmo painel — com histórico salvo em cada cadastro e pedido."
    >
      <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
        {steps.map((item) => (
          <RevealItem
            key={item.step}
            className="group relative rounded-2xl border border-border bg-surface p-8 transition-colors hover:bg-surface-elevated"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-bold text-muted/30 transition-colors group-hover:text-accent/20">
                {item.step}
              </span>
              <div className="h-2 w-2 rounded-full bg-border-subtle group-hover:bg-accent/40" />
            </div>
            <h3 className="mt-6 min-h-[3.5rem] text-balance text-xl font-semibold leading-snug tracking-tight">
              {item.title}
            </h3>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground group-hover:text-foreground/80">
              {item.text}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
      <Reveal className="mt-14 text-center">
        <MotionCtaLink
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-8 py-4 text-sm font-semibold text-background"
        >
          Entrar no painel
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </MotionCtaLink>
      </Reveal>
    </SectionShell>
  );
}
