"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type Associate,
  type AssociateAnnotation,
  type Order,
  type UserHistory,
} from "@/lib/api";
import { useAuthLabel } from "@/lib/auth-context";
import { dateTime, fullAssociateName, money } from "@/lib/format";
import { PATHS } from "@/lib/menu";
import { AssociateDocumentsPanel } from "@/components/AssociateDocumentsPanel";
import { AssociatePrescriberPanel } from "@/components/AssociatePrescriberPanel";
import { Alert, Button, Loader } from "@/components/ui";

const TABS = [
  { id: "dados", label: "Dados" },
  { id: "pedidos", label: "Pedidos" },
  { id: "pacientes", label: "Pacientes" },
  { id: "prescritor", label: "Prescritor" },
  { id: "anotacoes", label: "Anotações" },
  { id: "documentos", label: "Documentos" },
  { id: "historico", label: "Histórico" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export type AssociateFormState = {
  associate_name: string;
  associate_last_name: string;
  email_account: string;
  mobile_number: string;
  associate_cpf: string;
  city: string;
  state: string;
  street: string;
  street_number: string;
  neighborhood: string;
  cep: string;
  status: string;
};

function parseAnnotations(raw: Associate["annotations"]): AssociateAnnotation[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as AssociateAnnotation[];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type Props = {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  creating: boolean;
  selected: Associate | null;
  form: AssociateFormState;
  setForm: React.Dispatch<React.SetStateAction<AssociateFormState>>;
  onSave: (event: FormEvent) => void;
  saving: boolean;
  onReloadAssociate?: () => Promise<void>;
};

export function AssociateDrawerBody({
  tab,
  onTabChange,
  creating,
  selected,
  form,
  setForm,
  onSave,
  saving,
  onReloadAssociate,
}: Props) {
  const label = useAuthLabel();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [patients, setPatients] = useState<Associate[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientDraft, setPatientDraft] = useState({ associate_name: "", associate_last_name: "" });
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [annotations, setAnnotations] = useState<AssociateAnnotation[]>([]);
  const [noteText, setNoteText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnnotations(parseAnnotations(selected?.annotations));
  }, [selected?.annotations, selected?.id]);

  const loadOrders = useCallback(async () => {
    const code = selected?.user_code;
    if (!code) return;
    setOrdersLoading(true);
    try {
      const res = await api.listOrdersByUser(code);
      setUserOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setUserOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [selected?.user_code]);

  const loadPatients = useCallback(async () => {
    if (!selected?.id) return;
    setPatientsLoading(true);
    try {
      const res = await api.listUserPatients(selected.id);
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }, [selected?.id]);

  const loadHistory = useCallback(async () => {
    if (!selected?.id) return;
    setHistoryLoading(true);
    try {
      const res = await api.getUserHistory(selected.id);
      setHistory(res.data);
    } catch {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [selected?.id]);

  useEffect(() => {
    if (!selected || creating) return;
    if (tab === "pedidos") void loadOrders();
    if (tab === "pacientes") void loadPatients();
    if (tab === "historico") void loadHistory();
  }, [tab, selected, creating, loadOrders, loadPatients, loadHistory]);

  async function saveAnnotations(next: AssociateAnnotation[]) {
    if (!selected) return;
    setError(null);
    try {
      await api.updateUser(selected.id, { annotations: JSON.stringify(next) });
      setAnnotations(next);
      await onReloadAssociate?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar anotações");
    }
  }

  async function addPatient() {
    if (!selected?.id || !patientDraft.associate_name.trim()) return;
    setError(null);
    try {
      await api.createUserPatient(selected.id, {
        associate_name: patientDraft.associate_name.trim(),
        associate_last_name: patientDraft.associate_last_name.trim() || undefined,
      });
      setPatientDraft({ associate_name: "", associate_last_name: "" });
      await loadPatients();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao criar paciente");
    }
  }

  async function removePatient(patientId: number) {
    if (!selected?.id || !window.confirm("Excluir este paciente?")) return;
    try {
      await api.deleteUserPatient(selected.id, patientId);
      await loadPatients();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao excluir paciente");
    }
  }

  const visibleTabs = creating ? TABS.filter((t) => t.id === "dados") : TABS;

  return (
    <>
      {!creating ? (
        <div className="drawer-tabs">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`drawer-tabs__tab${tab === t.id ? " is-active" : ""}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <Alert>{error}</Alert> : null}

      {selected && !creating ? (
        <dl className="detail-list">
          <div>
            <dt>Código</dt>
            <dd>{selected.user_code || "—"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{selected.associate_status || selected.status || "—"}</dd>
          </div>
        </dl>
      ) : null}

      {tab === "dados" || creating ? (
        <form id="associate-form" className="form-grid" onSubmit={onSave}>
          <div className="field">
            <label htmlFor="an">Nome</label>
            <input
              id="an"
              required
              value={form.associate_name}
              onChange={(e) => setForm((f) => ({ ...f, associate_name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="aln">Sobrenome</label>
            <input
              id="aln"
              value={form.associate_last_name}
              onChange={(e) => setForm((f) => ({ ...f, associate_last_name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="ae">E-mail</label>
            <input
              id="ae"
              type="email"
              value={form.email_account}
              onChange={(e) => setForm((f) => ({ ...f, email_account: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="ap">Telefone</label>
            <input
              id="ap"
              value={form.mobile_number}
              onChange={(e) => setForm((f) => ({ ...f, mobile_number: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="acpf">CPF</label>
            <input
              id="acpf"
              value={form.associate_cpf}
              onChange={(e) => setForm((f) => ({ ...f, associate_cpf: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="astatus">Status</label>
            <select
              id="astatus"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option>Associado</option>
              <option>cadastro_criado</option>
              <option>dados_pessoais</option>
              <option>documentos</option>
              <option>assinatura_termo</option>
              <option>concluido</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="astreet">Rua</label>
            <input
              id="astreet"
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="anum">Número</label>
            <input
              id="anum"
              value={form.street_number}
              onChange={(e) => setForm((f) => ({ ...f, street_number: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="aneigh">Bairro</label>
            <input
              id="aneigh"
              value={form.neighborhood}
              onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="acep">CEP</label>
            <input
              id="acep"
              value={form.cep}
              onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="acity">Cidade</label>
            <input
              id="acity"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="astate">UF</label>
            <input
              id="astate"
              maxLength={2}
              value={form.state}
              onChange={(e) =>
                setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))
              }
            />
          </div>
        </form>
      ) : null}

      {tab === "pedidos" && selected && !creating ? (
        <>
          <div className="page__toolbar" style={{ margin: "0.75rem 0" }}>
            <Link href={`${PATHS.newOrder}?user_code=${encodeURIComponent(selected.user_code || "")}`}>
              <Button type="button" variant="accent">
                Novo pedido
              </Button>
            </Link>
            <Link href={`${PATHS.services}?associate=${encodeURIComponent(selected.user_code || "")}`}>
              <Button type="button" variant="ghost">
                Atendimentos
              </Button>
            </Link>
          </div>
          {ordersLoading ? (
            <Loader label="Carregando pedidos…" />
          ) : userOrders.length === 0 ? (
            <p style={{ color: "var(--dharma-muted)" }}>Nenhum pedido.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userOrders.slice(0, 15).map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`${PATHS.orders}?open=${o.id}`}>#{o.id}</Link>
                      </td>
                      <td>{dateTime(o.date_created)}</td>
                      <td>{money(o.total)}</td>
                      <td>{o.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      {tab === "pacientes" && selected && !creating ? (
        <>
          <div className="form-grid form-grid--2" style={{ marginTop: "0.75rem" }}>
            <div className="field">
              <label htmlFor="pn">Nome paciente</label>
              <input
                id="pn"
                value={patientDraft.associate_name}
                onChange={(e) =>
                  setPatientDraft((d) => ({ ...d, associate_name: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="pln">Sobrenome</label>
              <input
                id="pln"
                value={patientDraft.associate_last_name}
                onChange={(e) =>
                  setPatientDraft((d) => ({ ...d, associate_last_name: e.target.value }))
                }
              />
            </div>
          </div>
          <Button type="button" variant="ghost" disabled={saving} onClick={() => void addPatient()}>
            Adicionar paciente
          </Button>
          {patientsLoading ? (
            <Loader label="Carregando pacientes…" />
          ) : patients.length === 0 ? (
            <p style={{ color: "var(--dharma-muted)" }}>Nenhum paciente vinculado.</p>
          ) : (
            <ul className="file-list">
              {patients.map((p) => (
                <li key={p.id}>
                  {fullAssociateName(p)} · {p.user_code || p.id}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => void removePatient(p.id)}
                  >
                    excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {tab === "prescritor" && selected && !creating ? (
        <AssociatePrescriberPanel
          associate={selected}
          onReloadAssociate={onReloadAssociate}
        />
      ) : null}

      {tab === "anotacoes" && selected && !creating ? (
        <>
          <div className="field" style={{ marginTop: "0.75rem" }}>
            <label htmlFor="note">Nova anotação</label>
            <textarea
              id="note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={!noteText.trim() || saving}
            onClick={() => {
              const next = [
                ...annotations,
                {
                  id: String(Date.now()),
                  text: noteText.trim(),
                  date_created: new Date().toISOString(),
                  userName: label.name,
                },
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
                {a.userName} · {a.date_created ? dateTime(a.date_created) : ""}
              </small>
              <button
                type="button"
                className="link-btn"
                onClick={() => void saveAnnotations(annotations.filter((x) => x.id !== a.id))}
              >
                remover
              </button>
            </div>
          ))}
        </>
      ) : null}

      {tab === "documentos" && selected && !creating ? (
        <AssociateDocumentsPanel associate={selected} />
      ) : null}

      {tab === "historico" && selected && !creating ? (
        historyLoading ? (
          <Loader label="Carregando histórico…" />
        ) : (
          <>
            <h3 style={{ fontSize: "0.95rem", marginTop: "0.75rem" }}>Pedidos</h3>
            {(history?.orders || []).length === 0 ? (
              <p style={{ color: "var(--dharma-muted)" }}>Nenhum.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {(history?.orders || []).slice(0, 20).map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`${PATHS.orders}?open=${o.id}`}>#{o.id}</Link>
                        </td>
                        <td>{o.status}</td>
                        <td>{money(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <h3 style={{ fontSize: "0.95rem", marginTop: "1rem" }}>Atendimentos</h3>
            {(history?.services || []).length === 0 ? (
              <p style={{ color: "var(--dharma-muted)" }}>Nenhum.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {(history?.services || []).slice(0, 20).map((s) => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td>{s.status}</td>
                        <td>{s.professional_name || "—"}</td>
                        <td>{money(s.price_paid ?? s.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      ) : null}
    </>
  );
}

export type { TabId as AssociateDrawerTab };
