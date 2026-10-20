"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BulkResultModal, OrdersBulkBar } from "@/components/OrdersBulkBar";
import { OrderDetailDrawer } from "@/components/OrderDetailDrawer";
import { ProductionReportModal } from "@/components/ProductionReportModal";
import {
  api,
  ApiError,
  type BulkActionResult,
  type Order,
  qs,
} from "@/lib/api";
import { dateTime, money } from "@/lib/format";
import { PATHS } from "@/lib/menu";
import { orderStatusValuesFromConfig } from "@/lib/order-statuses";
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Loader,
  PageTitle,
  Panel,
  SearchInput,
} from "@/components/ui";

const DEFAULT_STATUSES = [
  "Aguardando pagamento",
  "Pagamento concluído",
  "Aguardando aprovação",
  "Em produção",
  "Enviado",
  "Entregue",
  "Cancelado",
];

function statusTone(status?: string | null) {
  if (!status) return "muted" as const;
  if (/pagamento conclu|aprov|enviad|entreg/i.test(status)) return "default" as const;
  if (/aguard|produ/i.test(status)) return "warn" as const;
  if (/cancel/i.test(status)) return "muted" as const;
  return "accent" as const;
}

function OrdersPageInner() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Order[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statuses, setStatuses] = useState<string[]>(DEFAULT_STATUSES);
  const [statusFilter, setStatusFilter] = useState("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [labelFlags, setLabelFlags] = useState<{ loggi?: boolean; melhorenvio?: boolean }>({});
  const [pagarmeEnabled, setPagarmeEnabled] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    title: string;
    results: BulkActionResult[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [productionOrders, setProductionOrders] = useState<Order[] | null>(null);

  const load = useCallback(async (term: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = qs({
        limit: 50,
        sort: "-id",
        search: term || undefined,
        status: status || undefined,
      });
      const res = await api.listOrders(query);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(search.trim(), statusFilter), 280);
    return () => clearTimeout(t);
  }, [search, statusFilter, load]);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await api.ordersStatusConfig();
          const normalized = orderStatusValuesFromConfig(res.data);
          if (normalized.length) setStatuses(normalized);
        } catch {
          /* defaults */
        }
      })();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await api.ordersFacets(qs({ search: search.trim() || undefined }));
          setStatusCounts(res.data?.statusCounts || {});
        } catch {
          /* optional */
        }
      })();
    }, 0);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void (async () => {
      try {
        const [labels, pagarme] = await Promise.all([
          api.freightLabelAvailability(),
          api.getPagarmeStatus().catch(() => null),
        ]);
        setLabelFlags(labels.data || {});
        const pg = pagarme?.data;
        setPagarmeEnabled(Boolean(pg?.enabled && pg?.use_for_orders && pg?.credentials_complete));
      } catch {
        setLabelFlags({});
      }
    })();
  }, []);

  const openOrderById = useCallback(async (id: number) => {
    setDetailLoading(true);
    setError(null);
    try {
      const res = await api.getOrder(id);
      setSelected(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao abrir pedido");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    const open = searchParams.get("open");
    if (!open) return;
    const id = Number(open);
    if (!Number.isFinite(id)) return;
    void openOrderById(id);
  }, [searchParams, openOrderById]);

  async function refreshSelected() {
    if (!selected) return;
    await openOrderById(selected.id);
    await load(search.trim(), statusFilter);
  }

  async function changeStatus(status: string) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await api.updateOrderStatus(selected.id, status);
      setSelected(res.data);
      setOk(`Status atualizado para “${status}”.`);
      await load(search.trim(), statusFilter);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.code === "PAYMENT_LOCK"
            ? `${err.message} Use Pagar.me ou anexe comprovante.`
            : err.message
          : "Falha ao atualizar status";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function removeOrder() {
    if (!selected) return;
    if (!window.confirm(`Excluir pedido #${selected.id}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteOrder(selected.id);
      setOk(`Pedido #${selected.id} excluído.`);
      setSelected(null);
      await load(search.trim(), statusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao excluir");
    } finally {
      setBusy(false);
    }
  }

  async function openProductionReport() {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      const fromRows = rows.filter((r) => selectedIds.includes(r.id));
      const missing = selectedIds.filter((id) => !fromRows.some((r) => r.id === id));
      const fetched = await Promise.all(missing.map((id) => api.getOrder(id).then((r) => r.data)));
      setProductionOrders([...fromRows, ...fetched]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao preparar relatório");
    } finally {
      setBusy(false);
    }
  }

  async function runBulk(body: Parameters<typeof api.ordersBulk>[0]) {
    setBusy(true);
    setError(null);
    try {
      const res = await api.ordersBulk(body);
      const results = res.data?.results || [];
      setBulkResult({
        title: "Resultado da ação em massa",
        results,
      });
      setSelectedIds([]);
      await load(search.trim(), statusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha na ação em massa");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle>Pedidos</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <SearchInput
            placeholder="Buscar pedido, associado…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="page__actions">
            <Link href={PATHS.newOrder}>
              <Button variant="accent" type="button">
                Novo pedido
              </Button>
            </Link>
          </div>
        </div>

        <OrdersBulkBar
          selectedCount={selectedIds.length}
          statuses={statuses}
          labelFlags={labelFlags}
          onBulkStatus={(status) =>
            void runBulk({ ids: selectedIds, action: "status", status })
          }
          onBulkTags={(mode, tags) =>
            void runBulk({
              ids: selectedIds,
              action: mode === "add" ? "tags_add" : "tags_remove",
              tags,
            })
          }
          onBulkLabel={(provider, kind) =>
            void runBulk({
              ids: selectedIds,
              action: kind === "create" ? "label_create" : "label_cancel",
              provider,
            })
          }
          onProductionReport={() => void openProductionReport()}
        />

        <div className="facet-chips" style={{ marginBottom: "0.85rem" }}>
          <button
            type="button"
            className={`facet-chips__chip${!statusFilter ? " is-active" : ""}`}
            onClick={() => setStatusFilter("")}
          >
            Todos
          </button>
          {(Object.keys(statusCounts).length ? Object.keys(statusCounts) : statuses).map(
            (status) => (
              <button
                key={status}
                type="button"
                className={`facet-chips__chip${statusFilter === status ? " is-active" : ""}`}
                onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
              >
                {status}
                {statusCounts[status] != null ? ` (${statusCounts[status]})` : ""}
              </button>
            ),
          )}
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {ok ? <Alert tone="ok">{ok}</Alert> : null}
        {loading ? (
          <Loader label="Carregando pedidos…" />
        ) : (
          <DataTable
            rows={rows}
            selection={{ ids: selectedIds, onChange: setSelectedIds }}
            empty="Nenhum pedido encontrado."
            onRowClick={(row) => void openOrderById(row.id)}
            columns={[
              {
                key: "id",
                header: "ID",
                render: (row) => `#${row.id}`,
              },
              {
                key: "created",
                header: "Criado",
                render: (row) => dateTime(row.date_created),
              },
              {
                key: "associate",
                header: "Associado",
                render: (row) =>
                  row.associate_name || row.receiver_name || row.user_code || "—",
              },
              {
                key: "total",
                header: "Total",
                render: (row) => money(row.total),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={statusTone(row.status)}>{row.status || "—"}</Badge>
                ),
              },
            ]}
          />
        )}
      </Panel>

      <OrderDetailDrawer
        order={selected}
        loading={detailLoading}
        statuses={statuses}
        pagarmeEnabled={pagarmeEnabled}
        busy={busy}
        onClose={() => setSelected(null)}
        onChangeStatus={changeStatus}
        onDelete={removeOrder}
        onRefresh={refreshSelected}
        onOrderUpdated={setSelected}
      />

      <ProductionReportModal
        open={Boolean(productionOrders?.length)}
        orders={productionOrders || []}
        onClose={() => setProductionOrders(null)}
        onComplete={() => {
          setProductionOrders(null);
          void load(search.trim(), statusFilter);
        }}
      />

      <BulkResultModal
        open={Boolean(bulkResult)}
        title={bulkResult?.title || "Resultado"}
        results={bulkResult?.results || []}
        onClose={() => setBulkResult(null)}
      />
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loader label="Carregando pedidos…" />}>
      <OrdersPageInner />
    </Suspense>
  );
}
