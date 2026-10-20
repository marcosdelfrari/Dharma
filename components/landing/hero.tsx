"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { DHARMA_LOGO } from "@/lib/brand";
import { fadeDown, fadeUp, MotionCtaLink } from "@/components/landing/motion";

const links = [
  { href: "#plataforma", label: "O que fazemos" },
  { href: "#painel", label: "Indicadores" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#contato", label: "Contato" },
];

export function LandingHero() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }, []);

  return (
    <section className="relative isolate h-dvh overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/screenplant.webp"
        aria-hidden
      >
        <source src="/screenplant.mp4" type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black via-black/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: "url(/pattern.webp)",
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
        aria-hidden
      />

      <motion.header
        className="relative z-20 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-14"
        initial="hidden"
        animate="show"
        variants={fadeDown}
      >
        <Link href="/" className="inline-flex" aria-label="Dharma">
          <Image
            src={DHARMA_LOGO}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full"
          />
        </Link>
        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span
            className={`h-px w-6 bg-white transition ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-6 bg-white transition ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>
      </motion.header>

      <AnimatePresence>
        {open ? (
          <motion.nav
            className="absolute inset-x-0 top-20 z-20 px-6 sm:px-10 lg:px-14"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.ul
              className="w-fit space-y-3 rounded-md bg-black/55 px-5 py-4 backdrop-blur-sm"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
              }}
            >
              {links.map((link) => (
                <motion.li key={link.href} variants={fadeUp}>
                  <a
                    href={link.href}
                    className="text-sm tracking-wide text-white/90 hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.nav>
        ) : null}
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 z-10 flex flex-col justify-end px-6 pb-10 pt-24 sm:px-10 sm:pb-12 lg:px-14 lg:pb-14"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
        }}
      >
        <motion.h1
          className="max-w-[14rem] text-[1.7rem] leading-[1.12] tracking-tight text-white sm:max-w-none sm:text-4xl lg:text-[2.35rem]"
          variants={fadeUp}
        >
          <span className="block font-light sm:whitespace-nowrap">
            Transformando a{" "}
            <span className="whitespace-nowrap">rotina associativa</span>
          </span>
          <span className="mt-1 block font-semibold whitespace-nowrap">
            em operação organizada
          </span>
        </motion.h1>
        <motion.p
          className="mt-4 max-w-md text-[13px] leading-6 text-white/85 sm:text-sm"
          variants={fadeUp}
        >
          Gestão de acolhimento, associados, atendimentos e pedidos para
          associações que buscam clareza e controle no dia a dia.
        </motion.p>
        <motion.div className="mt-6 flex flex-wrap items-center gap-6" variants={fadeUp}>
          {["Acolhimento", "Pedidos & Frete", "Atendimentos"].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 text-[11px] text-white/90"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-dharma-lime" aria-hidden />
              {label}
            </span>
          ))}
        </motion.div>
        <motion.div className="mt-6" variants={fadeUp}>
          <MotionCtaLink
            href="/login"
            className="inline-flex border border-white/35 bg-white/10 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white transition hover:bg-white/20"
          >
            Entrar no painel
          </MotionCtaLink>
        </motion.div>
      </motion.div>
    </section>
  );
}
