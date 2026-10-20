"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type Order, type PagarmeStatus } from "@/lib/api";
import { money } from "@/lib/format";
import { Alert, Button } from "@/components/ui";

type Props = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function OrderPaymentModal({ order, open, onClose, onSuccess }: Props) {
  const [status, setStatus] = useState<PagarmeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultLink, setResultLink] = useState<string | null>(null);
  const [partial, setPartial] = useState("");

  const total = Number(order?.total || 0);
  const splitMode = Boolean(status?.split_mode);
  const splitReady = Boolean(status?.split_mode && status?.payment_percentage_ok);
  const pagarmeOn = Boolean(status?.enabled && status?.use_for_orders && status?.credentials_complete);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setResultLink(order?.payment_link || null);
    setPartial("");
    void (async () => {
      try {
        const res = await api.getPagarmeStatus();
        setStatus(res.data);
      } catch (err) {
        setStatus(null);
        setError(err instanceof ApiError ? err.message : "Pagar.me indisponível");
      }
    })();
  }, [open, order?.payment_link]);

  if (!open || !order) return null;

  async function checkout(methods: string[], amountOverride?: number) {
    setLoading(true);
    setError(null);
    try {
      if (splitMode && !splitReady) {
        throw new Error("Configure Pedidos SouCannabis no Admin (split incompleto).");
      }
      const body: {
        context: "order";
        entity_id: number;
        methods: string[];
        amount_override?: number;
      } = {
        context: "order",
        entity_id: order!.id,
        methods,
      };
      if (amountOverride != null && amountOverride > 0) {
        body.amount_override = amountOverride;
      }
      const res = await api.createPagarmeCheckout(body);
      const link = res.data?.payment_link || null;
      setResultLink(link);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao gerar link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal" role="dialog" aria-label="Pagamento Pagar.me">
      <button type="button" className="modal__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="modal__panel">
        <h2 style={{ marginBottom: "0.75rem" }}>Pagamento Pagar.me — pedido #{order.id}</h2>
        <p style={{ color: "var(--dharma-muted)", marginBottom: "0.75rem" }}>
          Total: {money(total)}
        </p>

        {splitMode ? (
          <Alert tone={splitReady ? "ok" : "error"}>
            {splitReady
              ? `Split SouCannabis ativo (${status?.payment_percentage ?? "—"}%). Cartão parcial desabilitado.`
              : "Split incompleto — configure recipients e percentual no Admin."}
          </Alert>
        ) : null}

        {!pagarmeOn ? (
          <Alert>Pagar.me não está habilitado para pedidos neste ambiente.</Alert>
        ) : null}

        {error ? <Alert>{error}</Alert> : null}

        {resultLink ? (
          <p style={{ margin: "0.75rem 0", wordBreak: "break-all" }}>
            Link:{" "}
            <a href={resultLink} target="_blank" rel="noreferrer">
              {resultLink}
            </a>
          </p>
        ) : null}

        <div className="page__actions" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
          <Button
            type="button"
            variant="accent"
            disabled={loading || !pagarmeOn}
            onClick={() => void checkout(["credit_card"])}
          >
            {loading ? "Gerando…" : "Link cartão"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={loading || !pagarmeOn}
            onClick={() => void checkout(["boleto"])}
          >
            Link boleto
          </Button>
          {!splitMode ? (
            <>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor parcial"
                value={partial}
                style={{ width: "7rem" }}
                onChange={(e) => setPartial(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                disabled={loading || !pagarmeOn || !partial}
                onClick={() => void checkout(["credit_card"], Number(partial))}
              >
                Cartão parcial
              </Button>
            </>
          ) : null}
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
