"use client";

import { FormEvent, useCallback, useState } from "react";
import { api, ApiError, qs, type InstitutionalClient } from "@/lib/api";
import { institutionalStatusLabel } from "@/lib/institutional";
import { useRemoteList } from "@/lib/useRemoteList";
import { InstitutionalClientDrawer } from "@/components/InstitutionalClientDrawer";
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Loader,
  PageTitle,
  Panel,
  SearchInput,
} from "@/components/ui";

const emptyForm = {
  company_name: "",
  company_trade_name: "",
  company_cnpj: "",
  company_email: "",
  representative_name: "",
  city: "",
  state: "",
  status: "active",
};

export default function InstitutionalClientsPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [selected, setSelected] = useState<InstitutionalClient | null>(null);

  const loader = useCallback(async (term: string) => {
    const res = await api.listInstitutionalClients(
      qs({ limit: 50, sort: "-id", search: term || undefined }),
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
      await api.createInstitutionalClient({
        company_name: form.company_name.trim(),
        company_trade_name: form.company_trade_name.trim() || undefined,
        company_cnpj: form.company_cnpj.trim() || undefined,
        company_email: form.company_email.trim() || undefined,
        representative_name: form.representative_name.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        status: form.status,
        is_company: true,
      });
      setForm(emptyForm);
      setShowForm(false);
      setOk("Cliente institucional criado.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle>Clientes institucionais</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <SearchInput
            placeholder="Buscar empresa, CNPJ, representante…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="page__actions">
            <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Fechar" : "Novo cliente"}
            </Button>
          </div>
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {ok ? <Alert tone="ok">{ok}</Alert> : null}

        {showForm ? (
          <form
            className="form-grid form-grid--2"
            onSubmit={onCreate}
            style={{ marginBottom: "1rem" }}
          >
            <div className="field">
              <label htmlFor="ic-name">Razão social</label>
              <input
                id="ic-name"
                required
                value={form.company_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, company_name: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="ic-trade">Nome fantasia</label>
              <input
                id="ic-trade"
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
              <label htmlFor="ic-email">E-mail</label>
              <input
                id="ic-email"
                type="email"
                value={form.company_email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, company_email: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="ic-rep">Representante</label>
              <input
                id="ic-rep"
                value={form.representative_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, representative_name: e.target.value }))
                }
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
              <label htmlFor="ic-state">UF</label>
              <input
                id="ic-state"
                maxLength={2}
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="page__actions">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <Loader label="Carregando clientes…" />
        ) : (
          <DataTable
            rows={rows}
            empty="Nenhum cliente institucional."
            onRowClick={(row) => setSelected(row)}
            columns={[
              {
                key: "code",
                header: "Código",
                render: (row) => row.client_code || "—",
              },
              {
                key: "company",
                header: "Empresa",
                render: (row) =>
                  row.company_trade_name || row.company_name || "—",
              },
              {
                key: "cnpj",
                header: "CNPJ",
                render: (row) => row.company_cnpj || "—",
              },
              {
                key: "rep",
                header: "Representante",
                render: (row) =>
                  [row.representative_name, row.representative_last_name]
                    .filter(Boolean)
                    .join(" ") || "—",
              },
              {
                key: "city",
                header: "Cidade",
                render: (row) =>
                  [row.city, row.state].filter(Boolean).join("/") || "—",
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={row.status === "active" ? "default" : "muted"}>
                    {institutionalStatusLabel(row.status)}
                  </Badge>
                ),
              },
            ]}
          />
        )}
      </Panel>

      <InstitutionalClientDrawer
        initial={selected}
        onClose={() => setSelected(null)}
        onChanged={() => void reload()}
      />
    </>
  );
}
