"use client";

import Link from "next/link";
import {
  motion,
  MotionConfig,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useRef, type ComponentProps } from "react";

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: easeOut },
  },
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

const viewport = { once: true, margin: "0px 0px -80px 0px" } as const;

export function LandingMotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function Reveal({
  children,
  className,
  delay = 0,
  variants = fadeUp,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variants?: Variants;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const showState = variants.show;
  const showProps =
    typeof showState === "object" && showState !== null ? { ...showState } : {};
  const baseTransition =
    typeof showProps === "object" &&
    "transition" in showProps &&
    typeof showProps.transition === "object"
      ? showProps.transition
      : {};

  delete (showProps as { transition?: unknown }).transition;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: variants.hidden,
        show: {
          ...showProps,
          transition: { duration: 0.55, ease: easeOut, ...baseTransition, delay },
        },
      }}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  hoverLift = true,
}: {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.article
      className={className}
      variants={fadeUp}
      whileHover={
        reduced || !hoverLift ? undefined : { y: -4, transition: { duration: 0.22, ease: easeOut } }
      }
    >
      {children}
    </motion.article>
  );
}

export function RevealBlock({
  children,
  className,
  variants = fadeUp,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}) {
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

/** Entrada suave de cada bloco principal ao rolar a página */
export function ScrollSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -48px 0px" }}
      transition={{ duration: 0.65, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

export const MotionLink = motion.create(Link);

type MotionLinkProps = ComponentProps<typeof MotionLink>;

export function MotionCtaLink({
  className,
  children,
  ...rest
}: MotionLinkProps) {
  const reduced = useReducedMotion();

  return (
    <MotionLink
      className={className}
      whileHover={reduced ? undefined : { scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.18, ease: easeOut }}
      {...rest}
    >
      {children}
    </MotionLink>
  );
}

/** Anima linhas do gráfico quando entram na viewport */
export function useChartInView() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  return { ref, inView };
}

export { motion, viewport, easeOut as landingEase };
