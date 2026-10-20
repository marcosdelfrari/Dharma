"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="page__title">{children}</h1>;
}

export function Panel({ children }: { children: ReactNode }) {
  return <section className="panel">{children}</section>;
}

export function Alert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "ok";
}) {
  return <div className={`alert alert--${tone}`}>{children}</div>;
}

export function Loader({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="loader">
      <div className="loader__spinner" />
      <span>{label}</span>
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "ghost" | "danger";
}) {
  return (
    <button
      className={`btn btn--${variant}${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="search">
      <span aria-hidden>⌕</span>
      <input type="search" {...props} />
    </label>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "warn" | "muted" | "accent";
}) {
  const cls = tone === "default" ? "badge" : `badge badge--${tone}`;
  return <span className={cls}>{children}</span>;
}

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  empty = "Nenhum registro encontrado.",
  onRowClick,
  selection,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  onRowClick?: (row: T) => void;
  selection?: {
    ids: number[];
    onChange: (ids: number[]) => void;
  };
}) {
  if (!rows.length) {
    return (
      <div className="table-wrap">
        <div className="table__empty">{empty}</div>
      </div>
    );
  }

  const selected = new Set(selection?.ids || []);
  const allChecked =
    selection && rows.length > 0 && rows.every((r) => selected.has(Number(r.id)));

  function toggleOne(id: number) {
    if (!selection) return;
    if (selected.has(id)) {
      selection.onChange(selection.ids.filter((x) => x !== id));
    } else {
      selection.onChange([...selection.ids, id]);
    }
  }

  function toggleAll() {
    if (!selection) return;
    if (allChecked) selection.onChange([]);
    else selection.onChange(rows.map((r) => Number(r.id)));
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {selection ? (
              <th style={{ width: "2.5rem" }}>
                <input
                  type="checkbox"
                  aria-label="Selecionar todos"
                  checked={Boolean(allChecked)}
                  onChange={toggleAll}
                />
              </th>
            ) : null}
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={onRowClick ? "is-clickable" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {selection ? (
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar pedido ${row.id}`}
                    checked={selected.has(Number(row.id))}
                    onChange={() => toggleOne(Number(row.id))}
                  />
                </td>
              ) : null}
              {columns.map((col) => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <strong className="stat__value">{value}</strong>
    </div>
  );
}

export function Drawer({
  title,
  open,
  onClose,
  children,
  footer,
}: {
  title: ReactNode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <button
        type="button"
        className="drawer-backdrop"
        aria-label="Fechar"
        onClick={onClose}
      />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer__header">
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h2>
          <Button variant="ghost" type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer ? <div className="drawer__footer">{footer}</div> : null}
      </aside>
    </>
  );
}

export function BarList({
  items,
  empty = "Sem dados no período.",
}: {
  items: Array<{ name: string; value: number }>;
  empty?: string;
}) {
  if (!items.length) {
    return <p style={{ color: "var(--dharma-muted)", margin: 0 }}>{empty}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bars">
      {items.slice(0, 10).map((item) => (
        <div className="bars__row" key={`${item.name}-${item.value}`}>
          <span title={item.name}>{item.name}</span>
          <div className="bars__track">
            <div
              className="bars__fill"
              style={{ width: `${Math.round((item.value / max) * 100)}%` }}
            />
          </div>
          <span className="bars__value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
