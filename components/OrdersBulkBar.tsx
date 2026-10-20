"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type LabelFlags = { loggi?: boolean; melhorenvio?: boolean };

type Props = {
  selectedCount: number;
  statuses: string[];
  labelFlags: LabelFlags;
  onBulkStatus: (status: string) => void;
  onBulkTags: (mode: "add" | "remove", tags: string[]) => void;
  onBulkLabel: (provider: "loggi" | "melhorenvio", action: "create" | "cancel") => void;
  onProductionReport?: () => void;
};

export function OrdersBulkBar({
  selectedCount,
  statuses,
  labelFlags,
  onBulkStatus,
  onBulkTags,
  onBulkLabel,
  onProductionReport,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagMode, setTagMode] = useState<"add" | "remove">("add");
  const [tagText, setTagText] = useState("");

  if (!selectedCount) return null;

  return (
    <div className="bulk-bar">
      <Button type="button" variant="accent" onClick={() => setMenuOpen((v) => !v)}>
        Ação em massa ({selectedCount})
      </Button>
      {onProductionReport ? (
        <Button type="button" variant="ghost" onClick={onProductionReport}>
          Relatório de produção ({selectedCount})
        </Button>
      ) : null}

      {menuOpen ? (
        <div className="bulk-bar__menu">
          <button type="button" onClick={() => { setMenuOpen(false); setStatusOpen(true); }}>
            Alterar status…
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setTagMode("add");
              setTagsOpen(true);
            }}
          >
            Adicionar tags…
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setTagMode("remove");
              setTagsOpen(true);
            }}
          >
            Remover tags…
          </button>
          {labelFlags.loggi ? (
            <>
              <button type="button" onClick={() => { setMenuOpen(false); onBulkLabel("loggi", "create"); }}>
                Gerar etiquetas Loggi
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onBulkLabel("loggi", "cancel"); }}>
                Cancelar etiquetas Loggi
              </button>
            </>
          ) : null}
          {labelFlags.melhorenvio ? (
            <>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onBulkLabel("melhorenvio", "create"); }}
              >
                Gerar etiquetas Melhor Envio
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onBulkLabel("melhorenvio", "cancel"); }}
              >
                Cancelar etiquetas ME
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {statusOpen ? (
        <div className="modal" role="dialog">
          <button
            type="button"
            className="modal__backdrop"
            onClick={() => setStatusOpen(false)}
          />
          <div className="modal__panel modal__panel--sm">
            <h3>Alterar status</h3>
            <div className="bulk-bar__status-list">
              {statuses.map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStatusOpen(false);
                    onBulkStatus(s);
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
            <Button type="button" variant="ghost" onClick={() => setStatusOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      ) : null}

      {tagsOpen ? (
        <div className="modal" role="dialog">
          <button type="button" className="modal__backdrop" onClick={() => setTagsOpen(false)} />
          <div className="modal__panel modal__panel--sm">
            <h3>{tagMode === "add" ? "Adicionar tags" : "Remover tags"}</h3>
            <div className="field">
              <label htmlFor="bulk-tags">Tags (vírgula)</label>
              <input
                id="bulk-tags"
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
              />
            </div>
            <div className="page__actions">
              <Button type="button" variant="ghost" onClick={() => setTagsOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={() => {
                  const tags = tagText
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  setTagsOpen(false);
                  setTagText("");
                  onBulkTags(tagMode, tags);
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BulkResultModal({
  open,
  title,
  results,
  onClose,
}: {
  open: boolean;
  title: string;
  results: Array<{ order_id: number; ok: boolean; error?: string }>;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal" role="dialog">
      <button type="button" className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel modal__panel--sm">
        <h3>{title}</h3>
        <ul className="bulk-bar__results">
          {results.map((r) => (
            <li key={r.order_id}>
              #{r.order_id}: {r.ok ? "OK" : r.error || "falha"}
            </li>
          ))}
        </ul>
        <Button type="button" variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
