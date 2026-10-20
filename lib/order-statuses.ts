export type OrderStatusOption = {
  id?: string;
  value?: string;
  label?: string;
  order?: number;
  system?: boolean;
  is_awaiting?: boolean;
  is_paid?: boolean;
  color?: string;
};

/** Extrai valores de status (campo `value`) a partir do payload de GET /orders/status-config. */
export function orderStatusValuesFromConfig(data: unknown): string[] {
  if (data == null) return [];

  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (typeof data === "object" && Array.isArray((data as { statuses?: unknown[] }).statuses)) {
    list = (data as { statuses: unknown[] }).statuses;
  }

  const values = list
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const row = item as OrderStatusOption;
        return String(row.value || row.label || "").trim();
      }
      return "";
    })
    .filter(Boolean);

  return values;
}
