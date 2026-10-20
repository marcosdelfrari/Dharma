"use client";

import { useEffect, useMemo, useState } from "react";
import { api, displayName, type Order } from "@/lib/api";
import {
  exportProductionReport,
  openProductionReportPdf,
} from "@/lib/production-report";
import { Alert, Button } from "@/components/ui";

function hasProductionOwner(order: Order) {
  const owner = String(order.production_owner || "").trim();
  if (!owner) return false;
  return owner.toLowerCase() !== "não atribuído";
}

type Props = {
  open: boolean;
  orders: Order[];
  onClose: () => void;
  onComplete?: (payload: { markedIds: number[] }) => void;
};

export function ProductionReportModal({ open, orders, onClose, onComplete }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const count = orders.length;
  const doneCount = useMemo(
    () => Object.values(progress).filter((m) => m !== "Processando receita…").length,
    [progress],
  );

  useEffect(() => {
    if (open) {
      setBusy(false);
      setProgress({});
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function generate() {
    if (!count) return;
    setBusy(true);
    setError(null);
    try {
      const { pdfUrl, filename } = await exportProductionReport(orders, (orderId, message) => {
        setProgress((prev) => ({ ...prev, [orderId]: message }));
      });
      let owner = "Produção";
      try {
        const me = await api.me();
        owner = displayName(me.data.user).split(/\s+/)[0] || owner;
      } catch {
        /* ok */
      }
      const newlyMarked = orders.filter((o) => !hasProductionOwner(o));
      await Promise.all(
        newlyMarked.map((o) => api.updateOrderProduction(o.id, { production_owner: owner })),
      );
      onComplete?.({ markedIds: newlyMarked.map((o) => o.id) });
      openProductionReportPdf(pdfUrl, filename);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal" role="dialog">
      <button
        type="button"
        className="modal__backdrop"
        aria-label="Fechar"
        onClick={busy ? undefined : onClose}
      />
      <div className="modal__panel">
        <h2>Relatório de produção</h2>
        <p style={{ color: "var(--dharma-muted)", margin: "0.5rem 0 1rem" }}>
          PDF com {count} pedido{count === 1 ? "" : "s"}: itens agregados, dispensação e receitas
          quando disponíveis.
        </p>
        {error ? <Alert>{error}</Alert> : null}
        {busy ? (
          <p style={{ fontSize: "0.88rem" }}>
            Progresso: {doneCount}/{count}
          </p>
        ) : null}
        <ul className="bulk-bar__results" style={{ maxHeight: "140px", overflow: "auto" }}>
          {orders.map((o) => (
            <li key={o.id}>
              #{o.id}: {progress[o.id] || "Aguardando…"}
            </li>
          ))}
        </ul>
        <div className="page__actions" style={{ marginTop: "1rem" }}>
          <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="accent" disabled={busy || !count} onClick={() => void generate()}>
            {busy ? "Gerando…" : "Gerar PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
