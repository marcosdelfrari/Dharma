"use client";

import { useCallback, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type AnalyticsPayload,
  type AnalyticsSeriesPoint,
  qs,
} from "@/lib/api";
import { money } from "@/lib/format";
import {
  Alert,
  BarList,
  Button,
  Loader,
  PageTitle,
  Panel,
  StatCard,
} from "@/components/ui";

function asList(value: unknown): AnalyticsSeriesPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? row.key ?? row.label ?? "—");
      const num = Number(row.value ?? row.total ?? row.count ?? 0);
      return { name, value: Number.isFinite(num) ? num : 0 };
    })
    .filter(Boolean) as AnalyticsSeriesPoint[];
}

export function ServicesReportPanel({ showTitle = true }: { showTitle?: boolean }) {
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [reportRows, setReportRows] = useState<AnalyticsSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = qs({ group_by: "month" });
      const [services, report] = await Promise.all([
        api.getAnalyticsServices(query),
        api.getServicesReport(query).catch(() => null),
      ]);
      setAnalytics(services.data);

      const reportData = report?.data;
      if (Array.isArray(reportData)) {
        setReportRows(asList(reportData));
      } else if (reportData && typeof reportData === "object") {
        const obj = reportData as Record<string, unknown>;
        setReportRows(
          asList(obj.rows) ||
            asList(obj.items) ||
            asList(obj.by_professional) ||
            [],
        );
      } else {
        setReportRows([]);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Falha ao carregar relatório de atendimentos",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <>
      {showTitle ? <PageTitle>Relatório de atendimentos</PageTitle> : null}

      <div className="page__toolbar" style={{ marginBottom: "1rem" }}>
        <span style={{ color: "var(--dharma-muted)" }}>
          Visão consolidada de serviços no período padrão da API
        </span>
        <Button variant="ghost" onClick={() => void load()} disabled={loading}>
          Atualizar
        </Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <Panel>
          <Loader label="Carregando relatório…" />
        </Panel>
      ) : (
        <>
          <div className="stats">
            <StatCard label="Total" value={analytics?.kpis?.total ?? "—"} />
            <StatCard label="Doações" value={money(analytics?.kpis?.donations_sum)} />
            <StatCard label="A pagar" value={money(analytics?.kpis?.payable_sum)} />
            <StatCard label="Tipos" value={analytics?.series?.by_type?.length ?? 0} />
          </div>

          <div className="stack-panels">
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>Por período</h2>
              <BarList items={analytics?.series?.by_date || []} />
            </Panel>
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>Por tipo</h2>
              <BarList items={analytics?.series?.by_type || []} />
            </Panel>
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>Por profissional</h2>
              <BarList items={analytics?.series?.by_professional || []} />
            </Panel>
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>
                Relatório de serviços
              </h2>
              <BarList
                items={
                  reportRows.length
                    ? reportRows
                    : analytics?.rankings?.top_associates || []
                }
                empty="Sem linhas adicionais no endpoint /services/reports."
              />
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
