"use client";

import { RevealBlock, RevealGroup } from "@/components/landing/motion";

type SectionShellProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionShell({
  id,
  title,
  subtitle,
  children,
  className = "",
}: SectionShellProps) {
  return (
    <section id={id} className={`px-4 py-16 sm:px-6 lg:px-8 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(title || subtitle) && (
          <RevealGroup className="mb-10 text-center md:mb-14" stagger={0.1}>
            {title ? (
              <RevealBlock>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
              </RevealBlock>
            ) : null}
            {subtitle ? (
              <RevealBlock>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              </RevealBlock>
            ) : null}
          </RevealGroup>
        )}
        {children}
      </div>
    </section>
  );
}
