"use client";

import { LandingContactButton } from "@/components/landing/landing-contact-flow";
import {
  MotionCtaLink,
  Reveal,
  RevealBlock,
  RevealGroup,
  scaleIn,
} from "@/components/landing/motion";

export function LandingFinalCta() {
  return (
    <section id="contato" className="px-4 py-8 sm:px-6 lg:px-8 lg:pt-4 lg:pb-20">
      <Reveal className="mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101010]" variants={scaleIn}>
        <div className="grid lg:grid-cols-12 lg:min-h-[22rem]">
          <RevealGroup className="relative flex flex-col justify-between px-7 py-12 sm:px-12 sm:py-14 lg:col-span-7 lg:py-16">
            <RevealBlock>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/40">
                Próximo passo
              </p>
            </RevealBlock>
            <RevealBlock>
              <h2 className="mt-10 max-w-[12ch] text-[2.5rem] font-semibold leading-[0.96] tracking-[-0.035em] text-white sm:text-6xl lg:mt-16">
                Acesse o painel ou fale com a associação.
              </h2>
            </RevealBlock>
          </RevealGroup>
          <div className="flex flex-col justify-end border-t border-white/10 bg-white/[0.02] px-7 py-10 sm:px-12 lg:col-span-5 lg:border-t-0 lg:border-l lg:px-12 lg:py-16">
            <Reveal delay={0.12}>
              <p className="max-w-sm text-sm leading-7 text-white/60 sm:text-[15px]">
                Acesso exclusivo para operadores e profissionais cadastrados, ou
                contato rápido com nome e WhatsApp — direto para a fila de acolhimento.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <MotionCtaLink
                  href="/login"
                  className="group inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  Entrar no painel
                  <span
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </MotionCtaLink>
                <LandingContactButton className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-white/20">
                  Entrar em contato
                </LandingContactButton>
              </div>
            </Reveal>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
