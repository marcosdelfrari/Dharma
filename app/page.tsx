import type { Metadata } from "next";
import { DharmaLandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Dharma — Gestão associativa",
  description:
    "Painel operacional para acolhimento, loja, profissionais e relatórios — com método e continuidade.",
};

export default function Home() {
  return <DharmaLandingPage />;
}
