"use client";

import Image from "next/image";
import Link from "next/link";
import { DHARMA_LOGO } from "@/lib/brand";
import { Reveal, RevealBlock, RevealGroup } from "@/components/landing/motion";

const footerLinks: { href: string; label: string; internal?: boolean }[] = [
  { href: "#plataforma", label: "O que fazemos" },
  { href: "#painel", label: "Indicadores" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "/login", label: "Entrar no painel", internal: true },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <Reveal>
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src={DHARMA_LOGO}
              alt="Dharma"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
            <span className="text-base font-light tracking-wide">Dharma</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Gestão operacional para associações — acolhimento, associados,
            atendimentos, loja e relatórios em um só painel. Uma tecnologia{" "}
            <a
              href="https://marcosdelfrari.com"
              className="text-foreground underline-offset-2 hover:underline"
            >
              marcosdelfrari.com
            </a>
            .
          </p>
        </Reveal>
        <RevealGroup className="flex flex-col gap-2 text-sm text-muted-foreground" stagger={0.06}>
          {footerLinks.map((item) => (
            <RevealBlock key={item.href}>
              {item.internal ? (
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <a href={item.href} className="hover:text-foreground">
                  {item.label}
                </a>
              )}
            </RevealBlock>
          ))}
        </RevealGroup>
      </div>
      <Reveal delay={0.08}>
        <div className="border-t border-border-subtle">
          <p className="mx-auto max-w-6xl px-4 py-6 text-[12px] text-muted sm:px-6 lg:px-8">
            © 2026 Dharma. Todos os direitos reservados.
          </p>
        </div>
      </Reveal>
    </footer>
  );
}
