"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type InstitutionalClient,
  type InstitutionalClientAnnotation,
  type Order,
} from "@/lib/api";
import {
  institutionalDisplayName,
  institutionalStatusLabel,
  isInstitutionalCompany,
  parseInstitutionalAnnotations,
} from "@/lib/institutional";
import { dateTime, money } from "@/lib/format";
import { PATHS } from "@/lib/menu";
import { Alert, Button, Drawer, Loader } from "@/components/ui";

const TABS = [
  { id: "dados", label: "Dados" },
  { id: "endereco", label: "Endereço" },
  { id: "anotacoes", label: "Anotações" },
  { id: "historico", label: "Histórico" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type FormState = {
  status: string;
  is_company: boolean;
  company_name: string;
  company_trade_name: string;
  company_cnpj: string;
  company_email: string;
  company_phone: string;
  representative_name: string;
  representative_last_name: string;
  representative_cpf: string;
  representative_email: string;
  representative_mobile: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  cep: string;
  city: string;
  state: string;
};

function formFromClient(c: InstitutionalClient): FormState {
  return {
    status: c.status === "inactive" ? "inactive" : "active",
    is_company: isInstitutionalCompany(c),
    company_name: c.company_name || "",
    company_trade_name: c.company_trade_name || "",
    company_cnpj: c.company_cnpj || "",
    company_email: c.company_email || "",
    company_phone: c.company_phone || "",
    representative_name: c.representative_name || "",
    representative_last_name: c.representative_last_name || "",
    representative_cpf: c.representative_cpf || "",
    representative_email: c.representative_email || "",
    representative_mobile: c.representative_mobile || "",
    street: c.street || "",
    street_number: c.street_number || "",
    complement: c.complement || "",
    neighborhood: c.neighborhood || "",
    cep: c.cep || "",
    city: c.city || "",
    state: c.state || "",
  };
}

type Props = {
  initial: InstitutionalClient | null;
  onClose: () => void;
  onChanged: () => void;
};

export function InstitutionalClientDrawer({ initial, onClose, onChanged }: Props) {
  const [tab, setTab] = useState<TabId>("dados");
  const [client, setClient] = useState<InstitutionalClient | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    initial ? formFromClient(initial) : formFromClient({ id: 0 }),
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [annotations, setAnnotations] = useState<InstitutionalClientAnnotation[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reload = useCallback(async () => {
    if (!initial?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getInstitutionalClient(initial.id);
      const c = res.data;
      setClient(c);
      setForm(formFromClient(c));
      setAnnotations(parseInstitutionalAnnotations(c.annotations));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar cliente");
      setClient(initial);
      setForm(formFromClient(initial));
    } finally {
      setLoading(false);
    }
  }, [initial]);

  const loadHistory = useCallback(async (id: number) => {
    setHistoryLoading(true);
    try {
      const res = await api.getInstitutionalClientHistory(id);
      setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
    } catch {
      setOrders([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initial) return;
    setTab("dados");
    setConfirmDelete(false);
    void reload();
  }, [initial, reload]);

  useEffect(() => {
    if (tab === "historico" && client?.id) void loadHistory(client.id);
  }, [tab, client?.id, loadHistory]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!client?.id) return;
    setBusy(true);
    setError(null);
    setOk(null);
    const payload: Partial<InstitutionalClient> = {
      status: form.status,
      is_company: form.is_company,
      representative_name: form.representative_name.trim() || undefined,
      representative_last_name: form.representative_last_name.trim() || undefined,
      representative_cpf: form.representative_cpf.trim() || undefined,
      representative_email: form.representative_email.trim() || undefined,
      representative_mobile: form.representative_mobile.trim() || undefined,
      street: form.street.trim() || undefined,
      street_number: form.street_number.trim() || undefined,
      complement: form.complement.trim() || undefined,
      neighborhood: form.neighborhood.trim() || undefined,
      cep: form.cep.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
    };
    if (form.is_company) {
      payload.company_name = form.company_name.trim() || undefined;
      payload.company_trade_name = form.company_trade_name.trim() || undefined;
      payload.company_cnpj = form.company_cnpj.trim() || undefined;
      payload.company_email = form.company_email.trim() || undefined;
      payload.company_phone = form.company_phone.trim() || undefined;
    } else {
      payload.company_name = null;
      payload.company_trade_name = null;
      payload.company_cnpj = null;
      payload.company_email = null;
      payload.company_phone = null;
    }
    try {
      const res = await api.updateInstitutionalClient(client.id, payload);
      setClient(res.data);
      setForm(formFromClient(res.data));
      setOk("Salvo.");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function saveAnnotations(next: InstitutionalClientAnnotation[]) {
    if (!client?.id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.updateInstitutionalClient(client.id, { annotations: next });
      setClient(res.data);
      setAnnotations(parseInstitutionalAnnotations(res.data.annotations));
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar anotações");
    } finally {
      setBusy(false);
    }
  }

  async function removeClient() {
    if (!client?.id) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteInstitutionalClient(client.id);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao excluir");
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  const showSaveFooter = tab === "dados" || tab === "endereco";
  const open = Boolean(initial);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        client || initial
          ? `${institutionalDisplayName(client || initial)} · ${(client || initial)?.client_code || "—"}`
          : "Cliente institucional"
      }
      footer={
        showSaveFooter ? (
          <>
            <Button type="submit" form="ic-drawer-form" disabled={busy || loading}>
              {busy ? "Salvando…" : "Salvar"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </>
        ) : (
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        )
      }
    >
      {loading ? (
        <Loader label="Carregando…" />
      ) : (
        <>
          {error ? <Alert>{error}</Alert> : null}
          {ok ? <Alert tone="ok">{ok}</Alert> : null}

          <div className="page__toolbar" style={{ marginBottom: "0.75rem" }}>
            {client?.client_code ? (
              <>
                <Link
                  href={`${PATHS.newOrder}?ic=${encodeURIComponent(client.client_code)}`}
                >
                  <Button type="button" variant="accent">
                    Novo pedido
                  </Button>
                </Link>
                <Link href={`${PATHS.orders}?search=${encodeURIComponent(client.client_code)}`}>
                  <Button type="button" variant="ghost">
                    Ver pedidos
                  </Button>
                </Link>
              </>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
              Excluir
            </Button>
          </div>

          {confirmDelete ? (
            <div className="tracking-box" style={{ marginBottom: "0.75rem" }}>
              <p style={{ margin: "0 0 0.5rem" }}>
                Excluir este cliente? Só é permitido se não houver pedidos vinculados.
              </p>
              <Button type="button" variant="accent" disabled={busy} onClick={() => void removeClient()}>
                Confirmar exclusão
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
            </div>
          ) : null}

          <div className="drawer-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`drawer-tabs__tab${tab === t.id ? " is-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form id="ic-drawer-form" className="form-grid" onSubmit={onSave}>
            {tab === "dados" ? (
              <>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={form.is_company}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, is_company: e.target.checked }))
                      }
                    />
                    É uma empresa
                  </label>
                </div>
                <div className="field">
                  <label htmlFor="ic-st">Status</label>
                  <select
                    id="ic-st"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
                {form.is_company ? (
                  <>
                    <div className="field">
                      <label htmlFor="ic-cn">Razão social</label>
                      <input
                        id="ic-cn"
                        value={form.company_name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, company_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="ic-ct">Nome fantasia</label>
                      <input
                        id="ic-ct"
                        value={form.company_trade_name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, company_trade_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="ic-cnpj">CNPJ</label>
                      <input
                        id="ic-cnpj"
                        value={form.company_cnpj}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, company_cnpj: e.target.value }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="ic-ce">E-mail empresa</label>
                      <input
                        id="ic-ce"
                        type="email"
                        value={form.company_email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, company_email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="ic-cp">Telefone empresa</label>
                      <input
                        id="ic-cp"
                        value={form.company_phone}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, company_phone: e.target.value }))
                        }
                      />
                    </div>
                  </>
                ) : null}
                <h3 style={{ gridColumn: "1 / -1", fontSize: "0.9rem", margin: "0.25rem 0 0" }}>
                  Representante
                </h3>
                <div className="field">
                  <label htmlFor="ic-rn">Nome</label>
                  <input
                    id="ic-rn"
                    value={form.representative_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, representative_name: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-rln">Sobrenome</label>
                  <input
                    id="ic-rln"
                    value={form.representative_last_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, representative_last_name: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-rcpf">CPF</label>
                  <input
                    id="ic-rcpf"
                    value={form.representative_cpf}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, representative_cpf: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-re">E-mail</label>
                  <input
                    id="ic-re"
                    type="email"
                    value={form.representative_email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, representative_email: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-rm">Celular</label>
                  <input
                    id="ic-rm"
                    value={form.representative_mobile}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, representative_mobile: e.target.value }))
                    }
                  />
                </div>
              </>
            ) : null}

            {tab === "endereco" ? (
              <>
                <div className="field">
                  <label htmlFor="ic-street">Rua</label>
                  <input
                    id="ic-street"
                    value={form.street}
                    onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-num">Número</label>
                  <input
                    id="ic-num"
                    value={form.street_number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, street_number: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-comp">Complemento</label>
                  <input
                    id="ic-comp"
                    value={form.complement}
                    onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-neigh">Bairro</label>
                  <input
                    id="ic-neigh"
                    value={form.neighborhood}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, neighborhood: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-cep">CEP</label>
                  <input
                    id="ic-cep"
                    value={form.cep}
                    onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-city">Cidade</label>
                  <input
                    id="ic-city"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ic-uf">UF</label>
                  <input
                    id="ic-uf"
                    maxLength={2}
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))
                    }
                  />
                </div>
              </>
            ) : null}
          </form>

          {tab === "anotacoes" ? (
            <>
              <div className="field" style={{ marginTop: "0.5rem" }}>
                <label htmlFor="ic-note">Nova anotação</label>
                <textarea
                  id="ic-note"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={!noteText.trim() || busy}
                onClick={() => {
                  const next = [
                    {
                      id: String(Date.now()),
                      text: noteText.trim(),
                      date_created: new Date().toISOString(),
                    },
                    ...annotations,
                  ];
                  setNoteText("");
                  void saveAnnotations(next);
                }}
              >
                Adicionar
              </Button>
              {annotations.map((a) => (
                <div key={a.id} className="tracking-box" style={{ marginTop: "0.5rem" }}>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{a.text}</p>
                  <small style={{ color: "var(--dharma-muted)" }}>
                    {a.date_created ? dateTime(a.date_created) : ""}
                  </small>
                </div>
              ))}
            </>
          ) : null}

          {tab === "historico" ? (
            historyLoading ? (
              <Loader label="Carregando pedidos…" />
            ) : orders.length === 0 ? (
              <p style={{ color: "var(--dharma-muted)" }}>Nenhum pedido.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Associado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`${PATHS.orders}?open=${o.id}`}>#{o.id}</Link>
                        </td>
                        <td>{o.status || "—"}</td>
                        <td>{money(o.total)}</td>
                        <td>{o.associate_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : null}

          {client?.status ? (
            <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--dharma-muted)" }}>
              Status: {institutionalStatusLabel(client.status)}
            </p>
          ) : null}
        </>
      )}
    </Drawer>
  );
}
