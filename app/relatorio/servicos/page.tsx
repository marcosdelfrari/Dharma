"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ServicesReportPanel } from "@/components/ServicesReportPanel";
import { Button, Loader } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { PATHS } from "@/lib/menu";
import { isProfessionalOnly } from "@/lib/role-redirect";
import { dharmaSymbol } from "@/lib/brand";
import { useDharmaConfig } from "@/lib/dharma-config";

export default function ProfessionalServicesReportPage() {
  const { user, loading, logout, permissions } = useAuth();
  const router = useRouter();
  const { config, themeMode } = useDharmaConfig();
  const brandTitle = config.title || "Dharma";
  const brandLogo = dharmaSymbol(themeMode);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!permissions.includes("Profissional")) {
      router.replace(PATHS.servicesReport);
      return;
    }
    if (!isProfessionalOnly(permissions)) {
      router.replace(PATHS.servicesReport);
    }
  }, [loading, user, permissions, router]);

  if (loading || !user) {
    return (
      <div className="portal-report">
        <Loader label="Carregando…" />
      </div>
    );
  }

  if (!isProfessionalOnly(permissions)) {
    return (
      <div className="portal-report">
        <Loader label="Redirecionando…" />
      </div>
    );
  }

  return (
    <div className="portal-report">
      <header className="portal-report__head">
        <div className="portal-report__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogo} alt={brandTitle} width={28} height={28} />
          <div>
            <span>Relatório de atendimentos</span>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={() => void logout()}>
          Sair
        </Button>
      </header>
      <main className="portal-report__body">
        <ServicesReportPanel showTitle={false} />
      </main>
    </div>
  );
}
