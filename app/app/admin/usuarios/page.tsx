"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError, type SystemUser } from "@/lib/api";
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Loader,
  PageTitle,
  Panel,
} from "@/components/ui";

const ROLES = ["Administrador", "Acolhimento", "Produção", "Financeiro", "Profissional"];

function parseRoles(value?: SystemUser["permissions"]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* csv */
  }
  return String(value)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    last_name: "",
    permissions: ["Acolhimento"] as string[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listSystemUsers();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function onInvite(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await api.createSystemUser({
        email: form.email.trim(),
        name: form.name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        permissions: form.permissions,
      });
      setOk("Convite enviado (ou usuário criado).");
      setShowForm(false);
      setForm({
        email: "",
        name: "",
        last_name: "",
        permissions: ["Acolhimento"],
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao convidar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRole(user: SystemUser, role: string) {
    const current = parseRoles(user.permissions);
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    if (!next.length) {
      setError("Usuário precisa de ao menos um papel.");
      return;
    }
    setError(null);
    try {
      await api.updateSystemUser(user.id, { permissions: next });
      setOk(`Papéis de ${user.email} atualizados.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao atualizar");
    }
  }

  return (
    <>
      <PageTitle>Usuários do sistema</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <span style={{ color: "var(--dharma-muted)" }}>
            Operadores com acesso ao painel
          </span>
          <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Fechar" : "Convidar usuário"}
          </Button>
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {ok ? <Alert tone="ok">{ok}</Alert> : null}

        {showForm ? (
          <form
            className="form-grid form-grid--2"
            onSubmit={onInvite}
            style={{ marginBottom: "1rem" }}
          >
            <div className="field">
              <label htmlFor="su-email">E-mail</label>
              <input
                id="su-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="su-name">Nome</label>
              <input
                id="su-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="su-last">Sobrenome</label>
              <input
                id="su-last"
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>Papéis</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {ROLES.map((role) => (
                  <label key={role} style={{ display: "inline-flex", gap: "0.3rem" }}>
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(role)}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          permissions: f.permissions.includes(role)
                            ? f.permissions.filter((r) => r !== role)
                            : [...f.permissions, role],
                        }))
                      }
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <div className="page__actions">
              <Button type="submit" disabled={saving}>
                {saving ? "Enviando…" : "Convidar"}
              </Button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <Loader label="Carregando usuários…" />
        ) : (
          <DataTable
            rows={rows}
            empty="Nenhum usuário do sistema."
            columns={[
              {
                key: "email",
                header: "E-mail",
                render: (row) => row.email || "—",
              },
              {
                key: "name",
                header: "Nome",
                render: (row) =>
                  [row.name, row.last_name].filter(Boolean).join(" ") || "—",
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={row.status === "active" ? "default" : "warn"}>
                    {row.status || "—"}
                  </Badge>
                ),
              },
              {
                key: "roles",
                header: "Papéis",
                render: (row) => (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {ROLES.map((role) => {
                      const active = parseRoles(row.permissions).includes(role);
                      return (
                        <Button
                          key={role}
                          type="button"
                          variant={active ? "primary" : "ghost"}
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleRole(row, role);
                          }}
                        >
                          {role}
                        </Button>
                      );
                    })}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Panel>
    </>
  );
}
