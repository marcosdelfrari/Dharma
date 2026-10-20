"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type FreightAddress, type Order } from "@/lib/api";
import { money } from "@/lib/format";
import {
  computeOrderTotal,
  formatCepDisplay,
  freightLabel,
  pickMatchingFreightOption,
  roundMoney,
} from "@/lib/freight-recalc";
import { Alert, Button } from "@/components/ui";

type Props = {
  open: boolean;
  order: Order | null;
  previousAddress: FreightAddress | null;
  newAddress: FreightAddress;
  onClose: () => void;
  onUpdated: (order: Order) => void;
};

export function FreightRecalcModal({
  open,
  order,
  previousAddress,
  newAddress,
  onClose,
  onUpdated,
}: Props) {
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [applyToTotal, setApplyToTotal] = useState(true);
  const [newOption, setNewOption] = useState<{ price?: number; provider?: string; option_key?: string; label?: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const oldPrice = roundMoney(
    order?.delivery_price ?? order?.freight_option?.price ?? 0,
  );
  const newPrice = roundMoney(newOption?.price ?? 0);
  const priceChanged = Math.abs(newPrice - oldPrice) > 0.009;

  useEffect(() => {
    if (!open || !order || !newAddress.cep) return;
    let cancelled = false;
    void (async () => {
      setQuoting(true);
      setQuoteError(null);
      setNewOption(null);
      try {
        const res = await api.freightQuote({ address: newAddress });
        if (cancelled) return;
        const options = res.data?.options || [];
        setApplyToTotal(res.data?.apply_to_total !== false);
        const matched = pickMatchingFreightOption(
          options,
          order.freight_option,
          res.data?.selected_option_key,
        );
        if (!matched) {
          const errs = (res.data?.errors || []).map((e) => e.message).filter(Boolean);
          setQuoteError(errs.join(" · ") || "Nenhuma cotação para o novo CEP");
          return;
        }
        setNewOption(matched);
      } catch (err) {
        if (!cancelled) {
          setQuoteError(err instanceof ApiError ? err.message : "Falha ao cotar frete");
        }
      } finally {
        if (!cancelled) setQuoting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, order, newAddress]);

  if (!open || !order) return null;

  async function confirm() {
    if (!newOption || !priceChanged) {
      onClose();
      return;
    }
    setConfirming(true);
    try {
      const delivery_price = roundMoney(newOption.price ?? 0);
      const total = computeOrderTotal({
        items: order!.items as never,
        delivery_price,
        apply_to_total: applyToTotal,
        discount: order!.discount ?? 0,
        donation: order!.donation ?? 0,
        custom_payment: order!.custom_payment,
      });
      const res = await api.updateOrder(order!.id, {
        address: newAddress,
        delivery_price,
        freight_carrier: newOption.provider || null,
        freight_option: newOption,
        total,
      });
      onUpdated(res.data);
      onClose();
    } catch (err) {
      setQuoteError(err instanceof ApiError ? err.message : "Falha ao atualizar pedido");
    } finally {
      setConfirming(false);
    }
  }

  const currentTotal = computeOrderTotal({
    items: order.items as never,
    delivery_price: oldPrice,
    apply_to_total: applyToTotal,
    discount: order.discount ?? 0,
    donation: order.donation ?? 0,
    custom_payment: order.custom_payment,
  });
  const nextTotal = newOption
    ? computeOrderTotal({
        items: order.items as never,
        delivery_price: newPrice,
        apply_to_total: applyToTotal,
        discount: order.discount ?? 0,
        donation: order.donation ?? 0,
        custom_payment: order.custom_payment,
      })
    : currentTotal;

  return (
    <div className="modal" role="dialog">
      <button
        type="button"
        className="modal__backdrop"
        aria-label="Fechar"
        onClick={confirming || quoting ? undefined : onClose}
      />
      <div className="modal__panel">
        <h2>Recálculo de frete</h2>
        <p style={{ color: "var(--dharma-muted)", marginBottom: "0.75rem" }}>
          CEP {formatCepDisplay(previousAddress?.cep)} → {formatCepDisplay(newAddress.cep)} (pedido #
          {order.id})
        </p>
        {quoting ? <p>Cotando frete…</p> : null}
        {quoteError ? <Alert>{quoteError}</Alert> : null}
        {newOption && !quoting ? (
          <>
            <p>
              Antes: {freightLabel(order.freight_option)} — {money(oldPrice)}
            </p>
            <p>
              Novo: {freightLabel(newOption)} — {money(newPrice)}
            </p>
            <p>
              Total: {money(currentTotal)} → {money(nextTotal)}
            </p>
          </>
        ) : null}
        <div className="page__actions" style={{ marginTop: "1rem" }}>
          <Button type="button" variant="ghost" disabled={confirming || quoting} onClick={onClose}>
            {priceChanged ? "Ignorar" : "Fechar"}
          </Button>
          <Button
            type="button"
            variant="accent"
            disabled={confirming || quoting || !newOption || !priceChanged}
            onClick={() => void confirm()}
          >
            {confirming ? "Salvando…" : "Atualizar frete e total"}
          </Button>
        </div>
      </div>
    </div>
  );
}
