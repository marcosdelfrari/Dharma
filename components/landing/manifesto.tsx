"use client";

import {
  MotionCtaLink,
  RevealBlock,
  RevealGroup,
  slideFromLeft,
  slideFromRight,
} from "@/components/landing/motion";

export function LandingManifesto() {
  return (
    <section className="border-y border-border px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <RevealGroup className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-end">
        <RevealBlock variants={slideFromLeft}>
          <p className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Não existe acolhimento
            <br />
            sem organização.
          </p>
        </RevealBlock>
        <RevealBlock variants={slideFromRight}>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            Quando o cadastro fica em uma planilha, os documentos no WhatsApp e os
            pedidos em outra ferramenta, a equipe perde tempo reconstruindo o
            histórico de cada associado. O Dharma reúne triagem, ficha completa,
            atendimentos, loja e etiquetas de envio em um único lugar — para a
            operação rodar com método.
          </p>
          <MotionCtaLink
            href="/contato"
            className="mt-8 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Entrar em contato
          </MotionCtaLink>
        </RevealBlock>
      </RevealGroup>
    </section>
  );
}
