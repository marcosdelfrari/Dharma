import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "@/app/landing.css";
import { DHARMA_LOGO } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Obrigado — Dharma",
  description: "Recebemos seu contato. A conversa continua no WhatsApp.",
};

export default function ObrigadoPage() {
  return (
    <div className="landing-root flex min-h-dvh flex-col px-6 py-8 sm:px-10">
      <Link href="/" className="inline-flex w-fit" aria-label="Dharma">
        <Image
          src={DHARMA_LOGO}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-full"
        />
      </Link>
      <div className="flex flex-1 flex-col justify-center py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted">
          Obrigado
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-5xl">
          Recebemos seu contato.
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
          A conversa no WhatsApp é o começo. Em breve a equipe de acolhimento segue o
          atendimento com o histórico registrado no painel.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex w-fit rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition hover:bg-surface-elevated"
        >
          Voltar ao site
        </Link>
      </div>
    </div>
  );
}
