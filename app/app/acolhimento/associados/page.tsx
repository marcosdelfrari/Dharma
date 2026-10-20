"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError, type Associate, qs } from "@/lib/api";
import { fullAssociateName } from "@/lib/format";
import {
  AssociateDrawerBody,
  type AssociateDrawerTab,
} from "@/components/AssociateDrawerBody";
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

const emptyForm = {
  associate_name: "",
  associate_last_name: "",
  email_account: "",
  mobile_number: "",
  associate_cpf: "",
  city: "",
  state: "",
  street: "",
  street_number: "",
  neighborhood: "",
  cep: "",
  status: "Associado",
};

function AssociatesPageInner() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Associate[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [selected, setSelected] = useState<Associate | null>(null);
  const [creating, setCreating] = useState(false);
  const [drawerTab, setDrawerTab] = useState<AssociateDrawerTab>("dados");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = qs({
        limit: 50,
        sort: "-id",
        search: term || undefined,
        meta: "filter_count",
      });
      const res = await api.listUsers(query);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar associados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => void load(search.trim()), 280);
    return () => clearTimeout(t);
  }, [search, load]);

  function openCreate() {
    setSelected(null);
    setForm(emptyForm);
    setCreating(true);
    setDrawerTab("dados");
  }

  function openEdit(row: Associate) {
    setCreating(false);
    setSelected(row);
    setDrawerTab("dados");
    setForm({
      associate_name: row.associate_name || "",
      associate_last_name: row.associate_last_name || "",
      email_account: row.email_account || "",
      mobile_number: row.mobile_number || "",
      associate_cpf: row.associate_cpf || "",
      city: row.city || "",
      state: row.state || "",
      street: row.street || "",
      street_number: row.street_number || "",
      neighborhood: row.neighborhood || "",
      cep: row.cep || "",
      status: row.status || "Associado",
    });
  }

  function closeDrawer() {
    setSelected(null);
    setCreating(false);
  }

  const reloadSelected = useCallback(async () => {
    if (!selected?.id) return;
    try {
      const query = qs({
        filter: JSON.stringify({ id: { _eq: selected.id } }),
        limit: 1,
      });
      const res = await api.listUsers(query);
      const row = Array.isArray(res.data) ? res.data[0] : null;
      if (row) setSelected(row);
    } catch {
      /* ignore */
    }
  }, [selected?.id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    const payload: Partial<Associate> = {
      associate_name: form.associate_name.trim(),
      associate_last_name: form.associate_last_name.trim() || undefined,
      email_account: form.email_account.trim() || undefined,
      mobile_number: form.mobile_number.trim() || undefined,
      associate_cpf: form.associate_cpf.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      street: form.street.trim() || undefined,
      street_number: form.street_number.trim() || undefined,
      neighborhood: form.neighborhood.trim() || undefined,
      cep: form.cep.trim() || undefined,
      status: form.status,
    };
    try {
      if (creating) {
        await api.createUser(payload);
        setOk("Associado criado.");
      } else if (selected) {
        await api.updateUser(selected.id, payload);
        setOk("Associado atualizado.");
      }
      closeDrawer();
      await load(search.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  async function onMakeAssociate() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await api.makeAssociate(selected.id);
      setOk("Marcado como associado.");
      closeDrawer();
      await load(search.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha na operação");
    } finally {
      setSaving(false);
    }
  }

  const drawerOpen = creating || Boolean(selected);

  return (
    <>
      <PageTitle>Associados</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <SearchInput
            placeholder="Buscar por nome, código, e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="page__actions">
            <Button variant="accent" onClick={openCreate}>
              Novo associado
            </Button>
          </div>
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {ok ? <Alert tone="ok">{ok}</Alert> : null}
        {loading ? (
          <Loader label="Carregando associados…" />
        ) : (
          <DataTable
            rows={rows}
            empty="Nenhum associado encontrado."
            onRowClick={openEdit}
            columns={[
              {
                key: "code",
                header: "Código",
                render: (row) => row.user_code || "—",
              },
              {
                key: "name",
                header: "Nome",
                render: (row) => fullAssociateName(row),
              },
              {
                key: "email",
                header: "E-mail",
                render: (row) => row.email_account || "—",
              },
              {
                key: "phone",
                header: "Telefone",
                render: (row) => row.mobile_number || "—",
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
                  <Badge tone={row.status === "Associado" ? "default" : "warn"}>
                    {row.associate_status || row.status || "—"}
                  </Badge>
                ),
              },
            ]}
          />
        )}
      </Panel>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={creating ? "Novo associado" : `Editar · ${fullAssociateName(selected || {})}`}
        footer={
          drawerTab === "dados" || creating ? (
            <>
              <Button type="submit" form="associate-form" disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
              {!creating && selected?.status !== "Associado" ? (
                <Button
                  type="button"
                  variant="accent"
                  disabled={saving}
                  onClick={() => void onMakeAssociate()}
                >
                  Tornar associado
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={closeDrawer}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button type="button" variant="ghost" onClick={closeDrawer}>
              Fechar
            </Button>
          )
        }
      >
        <AssociateDrawerBody
          tab={drawerTab}
          onTabChange={setDrawerTab}
          creating={creating}
          selected={selected}
          form={form}
          setForm={setForm}
          onSave={onSave}
          saving={saving}
          onReloadAssociate={reloadSelected}
        />
      </Drawer>
    </>
  );
}

export default function AssociatesPage() {
  return (
    <Suspense fallback={<Loader label="Carregando associados…" />}>
      <AssociatesPageInner />
    </Suspense>
  );
}
