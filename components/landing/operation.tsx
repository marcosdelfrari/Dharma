"use client";

import {
  MotionCtaLink,
  Reveal,
  slideFromLeft,
  slideFromRight,
} from "@/components/landing/motion";

const points = [
  "Associados e dependentes",
  "Documentos e prescritor",
  "Triagem e atendimentos",
  "Loja e clientes institucionais",
  "Etiquetas e frete",
  "Histórico de alterações",
];

export function LandingOperation() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-center">
        <Reveal variants={slideFromLeft}>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Atendimento sem registro vira retrabalho no pedido seguinte.
          </h2>
          <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
            O Dharma conecta quem atende na recepção a quem separa o pedido na
            produção. Quando o operador abre um associado ou um pedido, já
            encontra endereço, documentos anexados, prescritor vinculado,
            anotações internas e tudo o que já foi solicitado antes.
          </p>
        </Reveal>

        <Reveal delay={0.1} variants={slideFromRight}>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 sm:p-10">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-accent/5 blur-[100px]" />

            <p className="relative z-10 text-xl font-semibold tracking-tight">
              Sua operação associativa, pronta para usar.
            </p>
            <p className="relative z-10 mt-4 text-sm leading-relaxed text-muted-foreground">
              Evite dividir a rotina entre várias abas desconectadas. O painel
              reúne acolhimento, loja, profissionais e relatórios em um ambiente
              único para toda a equipe.
            </p>

            <ul className="relative z-10 mt-8 grid gap-3 sm:grid-cols-2">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 rounded-xl border border-border-subtle bg-background/50 px-4 py-3 text-[13px] font-medium transition-colors hover:border-accent/20"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-accent/40" />
                  {point}
                </li>
              ))}
            </ul>

            <MotionCtaLink
              href="/login"
              className="relative z-10 mt-10 inline-flex w-full items-center justify-center rounded-xl bg-foreground px-6 py-4 text-sm font-bold text-background"
            >
              Entrar no painel
            </MotionCtaLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
