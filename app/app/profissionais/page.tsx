"use client";

import { FormEvent, useCallback, useState } from "react";
import { api, ApiError, qs } from "@/lib/api";
import { money } from "@/lib/format";
import { useRemoteList } from "@/lib/useRemoteList";
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
  name: "",
  last_name: "",
  email: "",
  phone: "",
  specialty: "",
  type: "",
  consultation_price: "",
  is_prescriber: false,
};

export default function ProfessionalsPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  const loader = useCallback(async (term: string) => {
    const res = await api.listProfessionals(
      qs({ limit: 50, sort: "name", search: term || undefined }),
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
      await api.createProfessional({
        name: form.name.trim(),
        last_name: form.last_name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        specialty: form.specialty.trim() || undefined,
        type: form.type.trim() || undefined,
        consultation_price: Number(form.consultation_price) || undefined,
        is_prescriber: form.is_prescriber,
        active: true,
      });
      setForm(emptyForm);
      setShowForm(false);
      setOk("Profissional criado.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle>Profissionais</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <SearchInput
            placeholder="Buscar nome, e-mail, especialidade…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="page__actions">
            <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Fechar" : "Novo profissional"}
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
              <label htmlFor="pro-name">Nome</label>
              <input
                id="pro-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pro-last">Sobrenome</label>
              <input
                id="pro-last"
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="pro-email">E-mail</label>
              <input
                id="pro-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pro-phone">Telefone</label>
              <input
                id="pro-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pro-spec">Especialidade</label>
              <input
                id="pro-spec"
                value={form.specialty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, specialty: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="pro-type">Tipo</label>
              <input
                id="pro-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="pro-price">Consulta</label>
              <input
                id="pro-price"
                type="number"
                min="0"
                step="0.01"
                value={form.consultation_price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, consultation_price: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="pro-prescriber">
                <input
                  id="pro-prescriber"
                  type="checkbox"
                  checked={form.is_prescriber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_prescriber: e.target.checked }))
                  }
                  style={{ marginRight: "0.45rem" }}
                />
                Prescritor
              </label>
            </div>
            <div className="page__actions">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <Loader label="Carregando profissionais…" />
        ) : (
          <DataTable
            rows={rows}
            empty="Nenhum profissional cadastrado."
            columns={[
              {
                key: "code",
                header: "Código",
                render: (row) => row.professional_code || "—",
              },
              {
                key: "name",
                header: "Nome",
                render: (row) =>
                  [row.name, row.last_name].filter(Boolean).join(" ") || "—",
              },
              {
                key: "specialty",
                header: "Especialidade",
                render: (row) => row.specialty || row.type || "—",
              },
              {
                key: "email",
                header: "E-mail",
                render: (row) => row.email || "—",
              },
              {
                key: "price",
                header: "Consulta",
                render: (row) => money(row.consultation_price),
              },
              {
                key: "flags",
                header: "Flags",
                render: (row) => (
                  <>
                    <Badge tone={row.active === false ? "muted" : "default"}>
                      {row.active === false ? "Inativo" : "Ativo"}
                    </Badge>{" "}
                    {row.is_prescriber ? <Badge tone="accent">Prescritor</Badge> : null}
                  </>
                ),
              },
            ]}
          />
        )}
      </Panel>
    </>
  );
}
