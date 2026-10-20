export function money(value?: number | null) {
  const n = Number(value ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fullAssociateName(row: {
  associate_name?: string | null;
  associate_last_name?: string | null;
}) {
  return [row.associate_name, row.associate_last_name].filter(Boolean).join(" ") || "—";
}
