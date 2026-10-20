"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError, type Product, qs } from "@/lib/api";
import { money } from "@/lib/format";
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
  sku: "",
  category: "",
  price: "",
  amount: "",
  status: "published",
};

export default function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = qs({
        limit: 50,
        sort: "name",
        search: term || undefined,
      });
      const res = await api.listProducts(query);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(search.trim()), 280);
    return () => clearTimeout(t);
  }, [search, load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await api.createProduct({
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        category: form.category.trim() || undefined,
        price: Number(form.price) || 0,
        amount: Number(form.amount) || 0,
        status: form.status,
      });
      setForm(emptyForm);
      setShowForm(false);
      setOk("Produto criado.");
      await load(search.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle>Produtos</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <SearchInput
            placeholder="Buscar SKU, nome, lote…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="page__actions">
            <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Fechar" : "Novo produto"}
            </Button>
          </div>
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {ok ? <Alert tone="ok">{ok}</Alert> : null}

        {showForm ? (
          <form className="form-grid form-grid--2" onSubmit={onCreate} style={{ marginBottom: "1rem" }}>
            <div className="field">
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="sku">SKU</label>
              <input
                id="sku"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="category">Categoria</label>
              <input
                id="category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="price">Preço</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="amount">Estoque</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
            <div className="page__actions">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Salvar produto"}
              </Button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <Loader label="Carregando produtos…" />
        ) : (
          <DataTable
            rows={rows}
            empty="Nenhum produto cadastrado."
            columns={[
              {
                key: "sku",
                header: "SKU",
                render: (row) => row.sku || "—",
              },
              {
                key: "name",
                header: "Nome",
                render: (row) => row.name || "—",
              },
              {
                key: "category",
                header: "Categoria",
                render: (row) => row.category || "—",
              },
              {
                key: "price",
                header: "Preço",
                render: (row) => money(row.price),
              },
              {
                key: "stock",
                header: "Estoque",
                render: (row) => row.amount ?? 0,
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge
                    tone={
                      row.status === "published"
                        ? "default"
                        : row.status === "draft"
                          ? "warn"
                          : "muted"
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
    </>
  );
}
