"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, qs } from "@/lib/api";
import { PATHS } from "@/lib/menu";
import { Button, Loader, SearchInput } from "@/components/ui";

type Entity = "users" | "orders" | "services" | "reception";

const TABS: { key: Entity; label: string }[] = [
  { key: "users", label: "Associados" },
  { key: "orders", label: "Pedidos" },
  { key: "services", label: "Atendimentos" },
  { key: "reception", label: "Triagem" },
];

function rowLabel(entity: Entity, row: Record<string, unknown>) {
  if (entity === "users") {
    return (
      String(row.fullname || "").trim() ||
      [row.associate_name, row.associate_last_name].filter(Boolean).join(" ")
    );
  }
  if (entity === "orders") {
    return `#${row.id ?? row.order_code ?? "—"} · ${row.associate_name ?? ""}`;
  }
  if (entity === "services") {
    return `${row.associate_name ?? row.patient_name ?? "—"} · ${row.professional_name ?? ""}`;
  }
  return `${row.name ?? ""} ${row.last_name ?? ""}`.trim() || String(row.email ?? "—");
}

function rowHref(entity: Entity, row: Record<string, unknown>) {
  if (entity === "users" && row.user_code) {
    return `${PATHS.associates}?q=${encodeURIComponent(String(row.user_code))}`;
  }
  if (entity === "orders" && row.id) {
    return `${PATHS.orders}?open=${row.id}`;
  }
  if (entity === "services") return PATHS.services;
  if (entity === "reception") return PATHS.triage;
  return PATHS.associates;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [entity, setEntity] = useState<Entity>("users");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (term: string, ent: Entity) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.globalSearch(
        qs({ q: trimmed, entity: ent, limit: 12, page: 1 }),
      );
      setRows(Array.isArray(res.data) ? (res.data as Record<string, unknown>[]) : []);
    } catch (err) {
      setRows([]);
      setError(err instanceof ApiError ? err.message : "Busca indisponível");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void runSearch(q, entity), 300);
    return () => clearTimeout(t);
  }, [q, entity, open, runSearch]);

  return (
    <>
      <button
        type="button"
        className="global-search__trigger"
        onClick={() => setOpen(true)}
      >
        Buscar…
      </button>

      {open ? (
        <div className="global-search" role="dialog" aria-label="Busca global">
          <button
            type="button"
            className="global-search__backdrop"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
          />
          <div className="global-search__panel">
            <div className="global-search__head">
              <SearchInput
                placeholder="Digite nome, e-mail, código…"
                value={q}
                autoFocus
                onChange={(e) => setQ(e.target.value)}
              />
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>

            <div className="global-search__tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`global-search__tab${entity === tab.key ? " is-active" : ""}`}
                  onClick={() => setEntity(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {error ? <p className="global-search__error">{error}</p> : null}
            {loading ? <Loader label="Buscando…" /> : null}

            {!loading && q.trim().length >= 2 ? (
              <ul className="global-search__list">
                {rows.length === 0 ? (
                  <li className="global-search__empty">Nenhum resultado.</li>
                ) : (
                  rows.map((row, idx) => (
                    <li key={String(row.id ?? idx)}>
                      <Link
                        href={rowHref(entity, row)}
                        className="global-search__row"
                        onClick={() => setOpen(false)}
                      >
                        {rowLabel(entity, row)}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <p className="global-search__hint">Mínimo 2 caracteres.</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
