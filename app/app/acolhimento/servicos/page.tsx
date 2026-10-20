"use client";

import { FormEvent, useCallback, useState } from "react";
import { api, ApiError, type Service, qs } from "@/lib/api";
import { dateTime, money } from "@/lib/format";
import { ServiceDetailDrawer } from "@/components/ServiceDetailDrawer";
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
  associate_name: "",
  associate_user_code: "",
  professional_name: "",
  price: "",
  status: "Agendado",
};

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [selected, setSelected] = useState<Service | null>(null);

  const loader = useCallback(async (term: string) => {
    const res = await api.listServices(
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
      await api.createService({
        name: form.name.trim(),
        associate_name: form.associate_name.trim() || undefined,
        associate_user_code: form.associate_user_code.trim() || undefined,
        professional_name: form.professional_name.trim() || undefined,
        price: Number(form.price) || 0,
        status: form.status,
      });
      setForm(emptyForm);
      setShowForm(false);
      setOk("Atendimento criado.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle>Atendimentos</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <SearchInput
            placeholder="Buscar atendimento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="page__actions">
            <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Fechar" : "Novo atendimento"}
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
              <label htmlFor="svc-name">Nome / tipo</label>
              <input
                id="svc-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-status">Status</label>
              <select
                id="svc-status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option>Agendado</option>
                <option>Realizado</option>
                <option>Cancelado</option>
                <option>Aguardando pagamento</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="svc-assoc">Associado</label>
              <input
                id="svc-assoc"
                value={form.associate_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, associate_name: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="svc-code">Código associado</label>
              <input
                id="svc-code"
                value={form.associate_user_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, associate_user_code: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="svc-pro">Profissional</label>
              <input
                id="svc-pro"
                value={form.professional_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, professional_name: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="svc-price">Preço</label>
              <input
                id="svc-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
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
          <Loader label="Carregando atendimentos…" />
        ) : (
          <DataTable<Service>
            rows={rows}
            empty="Nenhum atendimento encontrado."
            onRowClick={setSelected}
            columns={[
              {
                key: "created",
                header: "Criado",
                render: (row) => dateTime(row.date_created),
              },
              {
                key: "name",
                header: "Serviço",
                render: (row) => row.name || "—",
              },
              {
                key: "associate",
                header: "Associado",
                render: (row) => row.associate_name || row.associate_user_code || "—",
              },
              {
                key: "pro",
                header: "Profissional",
                render: (row) => row.professional_name || "—",
              },
              {
                key: "price",
                header: "Preço",
                render: (row) => money(row.price),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge
                    tone={
                      /realiz|pago|conclu/i.test(row.status || "")
                        ? "default"
                        : /cancel/i.test(row.status || "")
                          ? "muted"
                          : "warn"
                    }
                  >
                    {row.status || "—"}
                  </Badge>
                ),
              },
            ]}
          />
        )}
      </Panel>

      <ServiceDetailDrawer
        service={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setOk("Atendimento atualizado.");
          void reload();
        }}
      />
    </>
  );
}
