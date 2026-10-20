"use client";

import { LandingBenefits } from "@/components/landing/benefits";
import { LandingDashboardShowcase } from "@/components/landing/dashboard-showcase";
import { LandingFinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingManifesto } from "@/components/landing/manifesto";
import { ScrollSection } from "@/components/landing/motion";
import { LandingOperation } from "@/components/landing/operation";

export function LandingMain() {
  return (
    <>
      <LandingHero />
      <main>
        <ScrollSection>
          <LandingManifesto />
        </ScrollSection>
        <ScrollSection>
          <LandingBenefits />
        </ScrollSection>
        <ScrollSection>
          <LandingDashboardShowcase />
        </ScrollSection>
        <ScrollSection>
          <LandingOperation />
        </ScrollSection>
        <ScrollSection>
          <LandingHowItWorks />
        </ScrollSection>
        <ScrollSection>
          <LandingFinalCta />
        </ScrollSection>
      </main>
      <ScrollSection>
        <LandingFooter />
      </ScrollSection>
    </>
  );
}
