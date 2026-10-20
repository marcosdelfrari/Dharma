"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError, type ConfigItem } from "@/lib/api";
import { Alert, Button, Loader, PageTitle, Panel } from "@/components/ui";

const KEYS = [
  { key: "VITE_ASSOCIATION_NAME", label: "Nome curto" },
  { key: "VITE_ASSOCIATION_FULL_NAME", label: "Nome completo" },
  { key: "VITE_ASSOCIATION_EMAIL", label: "E-mail" },
  { key: "VITE_ASSOCIATION_PHONE", label: "Telefone" },
  { key: "VITE_ASSOCIATION_SITE", label: "Site" },
  { key: "VITE_ASSOCIATION_CNPJ", label: "CNPJ" },
  { key: "VITE_ASSOCIATION_CITY", label: "Cidade" },
  { key: "VITE_ASSOCIATION_STATE", label: "UF" },
] as const;

export default function AdminAssociationPage() {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listConfig("registration");
      const list = res.data.items || [];
      setItems(list);
      const next: Record<string, string> = {};
      for (const field of KEYS) {
        const found = list.find((i) => i.key === field.key);
        next[field.key] = found?.value != null ? String(found.value) : "";
      }
      setValues(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar configs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      for (const field of KEYS) {
        const existing = items.find((i) => i.key === field.key);
        const value = values[field.key] ?? "";
        if (existing) {
          await api.updateConfig(existing.id, { value });
        } else if (value) {
          await api.createConfig({
            system: "registration",
            key: field.key,
            value,
            description: field.label,
          });
        }
      }
      setOk("Dados da associação salvos.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle>Associação</PageTitle>
      <Panel>
        {error ? <Alert>{error}</Alert> : null}
        {ok ? <Alert tone="ok">{ok}</Alert> : null}
        {loading ? (
          <Loader label="Carregando…" />
        ) : (
          <form className="form-grid form-grid--2" onSubmit={onSave}>
            {KEYS.map((field) => (
              <div className="field" key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>
                <input
                  id={field.key}
                  value={values[field.key] || ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="page__actions">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        )}
      </Panel>
    </>
  );
}
