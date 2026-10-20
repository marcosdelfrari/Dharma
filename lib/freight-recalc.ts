import type { FreightOption, Order, OrderItemLine } from "@/lib/api";

export function cepDigits(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

export function formatCepDisplay(value: unknown) {
  const d = cepDigits(value);
  if (d.length !== 8) return d || "—";
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function roundMoney(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function orderHasQuotedFreight(order?: Order | null) {
  if (!order) return false;
  const opt = order.freight_option;
  if (opt && typeof opt === "object" && (opt.provider || opt.option_key)) return true;
  const carrier = String(order.freight_carrier || "").toLowerCase();
  return carrier === "loggi" || carrier === "melhorenvio";
}

export function cepChanged(
  previousAddress?: { cep?: string } | null,
  nextAddress?: { cep?: string } | null,
) {
  const a = cepDigits(previousAddress?.cep);
  const b = cepDigits(nextAddress?.cep);
  if (!a || !b || a.length < 8 || b.length < 8) return false;
  return a !== b;
}

export function pickMatchingFreightOption(
  options: FreightOption[],
  previousOption?: FreightOption | null,
  selectedKey?: string | null,
) {
  const list = Array.isArray(options) ? options : [];
  if (!list.length) return null;
  const prev = previousOption && typeof previousOption === "object" ? previousOption : null;

  if (prev?.option_key) {
    const byKey = list.find((o) => o.option_key === prev.option_key);
    if (byKey) return byKey;
  }

  if (prev?.provider) {
    const provider = String(prev.provider).toLowerCase();
    const sameProvider = list.filter(
      (o) => String(o.provider || "").toLowerCase() === provider,
    );
    if (sameProvider.length) return sameProvider[0];
  }

  if (selectedKey) {
    const bySel = list.find((o) => o.option_key === selectedKey);
    if (bySel) return bySel;
  }
  return list[0];
}

export function freightLabel(option?: FreightOption | null) {
  if (!option || typeof option !== "object") return "Frete";
  return option.label || option.option_key || option.provider || "Frete";
}

function productsSubtotal(items: OrderItemLine[] = []) {
  return roundMoney(
    items.reduce((sum, item) => {
      const amount = Number(item?.amount) || 0;
      const qty = Number(item?.quantity) || 0;
      return sum + amount * qty;
    }, 0),
  );
}

function customPaymentSum(customPayment: unknown) {
  const rows = Array.isArray(customPayment) ? customPayment : [];
  return roundMoney(
    rows.reduce(
      (sum, row) => sum + (Number((row as { value?: number })?.value) || 0),
      0,
    ),
  );
}

export function computeOrderTotal(args: {
  items?: OrderItemLine[] | unknown;
  delivery_price?: number;
  apply_to_total?: boolean;
  discount?: number;
  donation?: number;
  custom_payment?: unknown;
}) {
  const items = Array.isArray(args.items) ? args.items : [];
  const products = productsSubtotal(items);
  const freight = args.apply_to_total === false ? 0 : roundMoney(args.delivery_price || 0);
  const discountEffective =
    roundMoney(Number(args.discount) || 0) + customPaymentSum(args.custom_payment);
  return roundMoney(
    Math.max(0, products + freight - discountEffective - (Number(args.donation) || 0)),
  );
}

export function shouldOfferFreightRecalc(
  order: Order | null | undefined,
  previousAddress: { cep?: string } | null | undefined,
  nextAddress: { cep?: string } | null | undefined,
) {
  return orderHasQuotedFreight(order) && cepChanged(previousAddress, nextAddress);
}
