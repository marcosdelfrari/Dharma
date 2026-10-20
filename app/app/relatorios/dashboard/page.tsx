"use client";

import { useCallback, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type AnalyticsPayload,
  qs,
} from "@/lib/api";
import { money } from "@/lib/format";
import {
  Alert,
  BarList,
  Loader,
  PageTitle,
  Panel,
  StatCard,
} from "@/components/ui";

type Bundle = {
  associates: AnalyticsPayload | null;
  orders: AnalyticsPayload | null;
  services: AnalyticsPayload | null;
  reception: AnalyticsPayload | null;
};

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<Bundle>({
    associates: null,
    orders: null,
    services: null,
    reception: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = qs({ group_by: "month" });
      const [associates, orders, services, reception] = await Promise.all([
        api.getAnalyticsAssociates(query),
        api.getAnalyticsOrders(query),
        api.getAnalyticsServices(query),
        api.getAnalyticsReception(query),
      ]);
      setData({
        associates: associates.data,
        orders: orders.data,
        services: services.data,
        reception: reception.data,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Falha ao carregar analytics (verifique permissão de relatórios)",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const period =
    data.orders?.period ||
    data.associates?.period ||
    data.services?.period ||
    data.reception?.period;

  return (
    <>
      <PageTitle>Dashboard</PageTitle>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <Panel>
          <Loader label="Carregando indicadores…" />
        </Panel>
      ) : (
        <>
          {period ? (
            <p style={{ color: "var(--text-secondary)", margin: "0 0 1rem" }}>
              Período {period.start} → {period.end} · agrupado por{" "}
              {period.group_by}
            </p>
          ) : null}

          <div className="stats">
            <StatCard
              label="Associados"
              value={data.associates?.kpis?.total ?? "—"}
            />
            <StatCard label="Pedidos" value={data.orders?.kpis?.total ?? "—"} />
            <StatCard
              label="Atendimentos"
              value={data.services?.kpis?.total ?? "—"}
            />
            <StatCard
              label="Triagem"
              value={data.reception?.kpis?.total ?? "—"}
            />
          </div>

          <div className="stats">
            <StatCard
              label="Doações (pedidos)"
              value={money(data.orders?.kpis?.donations_sum)}
            />
            <StatCard
              label="Descontos"
              value={money(data.orders?.kpis?.discounts_sum)}
            />
            <StatCard
              label="Frete médio"
              value={money(data.orders?.kpis?.freight_avg)}
            />
            <StatCard
              label="Triagem → pedidos"
              value={data.reception?.kpis?.to_orders ?? "—"}
            />
          </div>

          <div className="stack-panels">
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>
                Pedidos por período
              </h2>
              <BarList items={data.orders?.series?.by_date || []} />
            </Panel>
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>
                Associados por UF
              </h2>
              <BarList items={data.associates?.series?.by_state || []} />
            </Panel>
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>
                Top produtos
              </h2>
              <BarList items={data.orders?.rankings?.top_products || []} />
            </Panel>
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>
                Atendimentos por profissional
              </h2>
              <BarList items={data.services?.series?.by_professional || []} />
            </Panel>
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>
                Triagem por atendente
              </h2>
              <BarList items={data.reception?.series?.by_attendant || []} />
            </Panel>
            <Panel>
              <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>
                Associados por gênero
              </h2>
              <BarList items={data.associates?.series?.by_gender || []} />
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
