"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { api, ApiError, type Reception, qs } from "@/lib/api";
import { dateTime } from "@/lib/format";
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Drawer,
  Loader,
  PageTitle,
  Panel,
  SearchInput,
} from "@/components/ui";

function TriagePageInner() {
  const [rows, setRows] = useState<Reception[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [attendants, setAttendants] = useState<
    Array<{ label: string; code: string; utalk_id?: string | null }>
  >([]);
  const [utalkEnabled, setUtalkEnabled] = useState(false);
  const [utalkBulkBusy, setUtalkBulkBusy] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [chatIdDraft, setChatIdDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Reception | null>(null);

  const load = useCallback(async (term: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = qs({
        limit: 50,
        sort: "-id",
        search: term || undefined,
        status: status || undefined,
      });
      const res = await api.listReception(query);
      let data = Array.isArray(res.data) ? res.data : [];
      if (status) data = data.filter((r) => r.status === status);
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar triagem");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(search.trim(), statusFilter), 280);
    return () => clearTimeout(t);
  }, [search, statusFilter, load]);

  useEffect(() => {
    void (async () => {
      try {
        const [counts, att] = await Promise.all([
          api.receptionStatusCounts(),
          api.receptionAttendants(),
        ]);
        setStatusCounts(counts.data || {});
        setAttendants(
          (att.data || []).map((a) => ({
            label: [a.name, a.last_name].filter(Boolean).join(" ") || a.email || a.code || "—",
            code: a.code || a.email || "",
            utalk_id: a.utalk_id,
          })),
        );
        const ut = await api.getUtalkStatus().catch(() => null);
        setUtalkEnabled(Boolean(ut?.data?.enabled && ut?.data?.has_api_token));
      } catch {
        /* optional */
      }
    })();
  }, []);

  useEffect(() => {
    if (selected) {
      setChatIdDraft(selected.chat_id || "");
      setLinkQuery(selected.associate_code || "");
    }
  }, [selected]);

  async function setStatus(id: number, status: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.updateReceptionStatus(id, status);
      await load(search.trim(), statusFilter);
      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível atualizar");
    } finally {
      setBusyId(null);
    }
  }

  async function assignAttendant(id: number, attendant: string) {
    setBusyId(id);
    try {
      const res = await api.updateReceptionAttendant(id, attendant || null);
      setSelected(res.data);
      await load(search.trim(), statusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao atribuir atendente");
    } finally {
      setBusyId(null);
    }
  }

  async function linkAssociate(id: number, code: string) {
    if (!code.trim()) return;
    setBusyId(id);
    try {
      const res = await api.linkReceptionAssociate(id, code.trim());
      setSelected(res.data);
      await load(search.trim(), statusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao vincular associado");
    } finally {
      setBusyId(null);
    }
  }

  async function unlinkAssociate(id: number) {
    setBusyId(id);
    try {
      const res = await api.unlinkReceptionAssociate(id);
      setSelected(res.data);
      setLinkQuery("");
      await load(search.trim(), statusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao desvincular");
    } finally {
      setBusyId(null);
    }
  }

  async function saveChatId(id: number) {
    setBusyId(id);
    try {
      const res = await api.updateReceptionChat(id, chatIdDraft.trim() || null);
      setSelected(res.data);
      await load(search.trim(), statusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar chat");
    } finally {
      setBusyId(null);
    }
  }

  async function syncUtalk(id: number) {
    setBusyId(id);
    try {
      const res = await api.syncReceptionUtalk(id);
      setSelected(res.data);
      setChatIdDraft(res.data.chat_id || "");
      await load(search.trim(), statusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha sync Utalk");
    } finally {
      setBusyId(null);
    }
  }

  async function syncUtalkWaitingAll() {
    setUtalkBulkBusy(true);
    setError(null);
    try {
      await api.syncUtalkWaiting();
      await load(search.trim(), statusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha na sincronização em lote");
    } finally {
      setUtalkBulkBusy(false);
    }
  }

  function openUtalkChat(chatId: string) {
    window.open(
      `https://app-utalk.umbler.com/chats/${encodeURIComponent(chatId)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function complete(id: number) {
    setBusyId(id);
    try {
      await api.completeReception(id);
      setSelected(null);
      await load(search.trim(), statusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao concluir");
    } finally {
      setBusyId(null);
    }
  }

  const statusKeys = Object.keys(statusCounts).length
    ? Object.keys(statusCounts)
    : ["Aguardando", "Em atendimento", "Concluído"];

  return (
    <>
      <PageTitle>Triagem</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <SearchInput
            placeholder="Buscar contato…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {utalkEnabled ? (
            <Button
              type="button"
              variant="ghost"
              disabled={utalkBulkBusy}
              onClick={() => void syncUtalkWaitingAll()}
            >
              {utalkBulkBusy ? "Sincronizando Utalk…" : "Sync Utalk (fila)"}
            </Button>
          ) : null}
        </div>

        <div className="facet-chips" style={{ marginBottom: "0.85rem" }}>
          <button
            type="button"
            className={`facet-chips__chip${!statusFilter ? " is-active" : ""}`}
            onClick={() => setStatusFilter("")}
          >
            Todos
          </button>
          {statusKeys.map((status) => (
            <button
              key={status}
              type="button"
              className={`facet-chips__chip${statusFilter === status ? " is-active" : ""}`}
              onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
            >
              {status}
              {statusCounts[status] != null ? ` (${statusCounts[status]})` : ""}
            </button>
          ))}
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {loading ? (
          <Loader label="Carregando fila…" />
        ) : (
          <DataTable
            rows={rows}
            empty="Fila de triagem vazia."
            onRowClick={setSelected}
            columns={[
              {
                key: "created",
                header: "Entrada",
                render: (row) => dateTime(row.date_created),
              },
              {
                key: "name",
                header: "Nome",
                render: (row) =>
                  [row.name, row.last_name].filter(Boolean).join(" ") || row.full_name || "—",
              },
              {
                key: "phone",
                header: "Telefone",
                render: (row) => row.phone || "—",
              },
              {
                key: "associate",
                header: "Associado",
                render: (row) => row.associate_code || "—",
              },
              {
                key: "attendant",
                header: "Atendente",
                render: (row) => row.attendant || "—",
              },
              {
                key: "utalk",
                header: "Utalk",
                render: (row) => (row.chat_id ? "chat" : "—"),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={row.status === "Concluído" ? "muted" : "accent"}>
                    {row.status || "—"}
                  </Badge>
                ),
              },
            ]}
          />
        )}
      </Panel>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `Triagem · ${[selected.name, selected.last_name].filter(Boolean).join(" ") || selected.id}`
            : "Triagem"
        }
        footer={
          <>
            {selected && selected.status !== "Concluído" ? (
              <Button
                type="button"
                variant="accent"
                disabled={busyId === selected.id}
                onClick={() => void complete(selected.id)}
              >
                Concluir
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
              Fechar
            </Button>
          </>
        }
      >
        {selected ? (
          <>
            <dl className="detail-list">
              <div>
                <dt>E-mail</dt>
                <dd>{selected.email || "—"}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{selected.phone || "—"}</dd>
              </div>
              <div>
                <dt>Assunto</dt>
                <dd>{selected.help_topic || "—"}</dd>
              </div>
              <div>
                <dt>Mensagem</dt>
                <dd>{selected.message || "—"}</dd>
              </div>
            </dl>

            <div className="field" style={{ marginTop: "0.75rem" }}>
              <label htmlFor="tri-link">Vincular associado (user_code)</label>
              <div className="page__toolbar">
                <input
                  id="tri-link"
                  value={linkQuery}
                  onChange={(e) => setLinkQuery(e.target.value)}
                  placeholder="Código do associado"
                />
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busyId === selected.id}
                  onClick={() => void linkAssociate(selected.id, linkQuery)}
                >
                  Vincular
                </Button>
                {selected.associate_code ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busyId === selected.id}
                    onClick={() => void unlinkAssociate(selected.id)}
                  >
                    Desvincular
                  </Button>
                ) : null}
              </div>
              {selected.associate_code ? (
                <small style={{ color: "var(--dharma-muted)" }}>
                  Vinculado: {selected.associate_code}
                  {selected.associate_name ? ` · ${selected.associate_name}` : ""}
                </small>
              ) : null}
            </div>

            {utalkEnabled ? (
              <div className="field">
                <label htmlFor="tri-chat">Chat Utalk (ID)</label>
                <div className="page__toolbar">
                  <input
                    id="tri-chat"
                    value={chatIdDraft}
                    onChange={(e) => setChatIdDraft(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busyId === selected.id}
                    onClick={() => void saveChatId(selected.id)}
                  >
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busyId === selected.id}
                    onClick={() => void syncUtalk(selected.id)}
                  >
                    Sync
                  </Button>
                  {selected.chat_id ? (
                    <Button
                      type="button"
                      variant="accent"
                      onClick={() => openUtalkChat(selected.chat_id!)}
                    >
                      Abrir Utalk
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="field" style={{ marginTop: "0.75rem" }}>
              <label htmlFor="tri-status">Status</label>
              <select
                id="tri-status"
                value={selected.status || ""}
                disabled={busyId === selected.id}
                onChange={(e) => void setStatus(selected.id, e.target.value)}
              >
                {statusKeys.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="tri-att">Atendente</label>
              <select
                id="tri-att"
                value={selected.attendant || ""}
                disabled={busyId === selected.id}
                onChange={(e) => void assignAttendant(selected.id, e.target.value)}
              >
                <option value="">—</option>
                {attendants.map((att) => (
                  <option key={att.code || att.label} value={att.code || att.label}>
                    {att.label}
                    {!att.utalk_id ? " (sem utalk_id)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </Drawer>
    </>
  );
}

export default function TriagePage() {
  return (
    <Suspense fallback={<Loader label="Carregando triagem…" />}>
      <TriagePageInner />
    </Suspense>
  );
}
