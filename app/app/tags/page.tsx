"use client";

import { FormEvent, useCallback, useState } from "react";
import { api, ApiError, type Tag, qs } from "@/lib/api";
import { useRemoteList } from "@/lib/useRemoteList";
import {
  Alert,
  Button,
  DataTable,
  Loader,
  PageTitle,
  Panel,
  SearchInput,
} from "@/components/ui";

function contextsLabel(value?: Tag["contexts"]) {
  if (!value) return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join(", ") || "—";
  } catch {
    /* plain */
  }
  return String(value);
}

export default function TagsPage() {
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [contexts, setContexts] = useState("orders,users");
  const [color, setColor] = useState("#c3d800");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loader = useCallback(async (term: string) => {
    const res = await api.listTags(
      qs({ limit: 100, sort: "tag", search: term || undefined }),
    );
    return res.data;
  }, []);

  const { rows, loading, error, setError, reload } = useRemoteList(loader, search);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await api.createTag({
        tag: tag.trim(),
        contexts: contexts
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        color,
      });
      setTag("");
      setOk("Tag criada.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await api.deleteTag(id);
      setOk("Tag removida.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageTitle>Tags</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <SearchInput
            placeholder="Buscar tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {ok ? <Alert tone="ok">{ok}</Alert> : null}

        <form
          className="form-grid form-grid--2"
          onSubmit={onCreate}
          style={{ marginBottom: "1rem" }}
        >
          <div className="field">
            <label htmlFor="tag-name">Tag</label>
            <input
              id="tag-name"
              required
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tag-ctx">Contextos (CSV)</label>
            <input
              id="tag-ctx"
              value={contexts}
              onChange={(e) => setContexts(e.target.value)}
              placeholder="orders,users,reception"
            />
          </div>
          <div className="field">
            <label htmlFor="tag-color">Cor</label>
            <input
              id="tag-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="page__actions" style={{ alignItems: "end" }}>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Adicionar tag"}
            </Button>
          </div>
        </form>

        {loading ? (
          <Loader label="Carregando tags…" />
        ) : (
          <DataTable
            rows={rows}
            empty="Nenhuma tag cadastrada."
            columns={[
              {
                key: "tag",
                header: "Tag",
                render: (row) => (
                  <>
                    <span
                      className="tag-swatch"
                      style={{ background: row.color || "#c3d800" }}
                    />
                    {row.tag || "—"}
                  </>
                ),
              },
              {
                key: "contexts",
                header: "Contextos",
                render: (row) => contextsLabel(row.contexts),
              },
              {
                key: "actions",
                header: "",
                render: (row) => (
                  <Button
                    variant="ghost"
                    disabled={busyId === row.id}
                    onClick={() => void onDelete(row.id)}
                  >
                    Remover
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Panel>
    </>
  );
}
