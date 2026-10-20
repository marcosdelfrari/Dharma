"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError, type ConfigItem } from "@/lib/api";
import { Alert, Button, Loader, PageTitle, Panel } from "@/components/ui";

const KEYS = [
  { key: "VITE_KUNK_TITLE", label: "Título do painel", defaultValue: "Dharma" },
  { key: "VITE_KUNK_DARK_BG", label: "Fundo (hex)", defaultValue: "#0d0d0d" },
  { key: "VITE_KUNK_MENU_BG", label: "Menu (hex)", defaultValue: "#171717" },
  { key: "VITE_KUNK_ACCENT", label: "Accent (hex)", defaultValue: "#c3d800" },
] as const;

export default function AdminAppearancePage() {
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
      const res = await api.listConfig("kunk");
      const list = res.data.items || [];
      setItems(list);
      const next: Record<string, string> = {};
      for (const field of KEYS) {
        const found = list.find((i) => i.key === field.key);
        next[field.key] =
          found?.value != null ? String(found.value) : field.defaultValue;
      }
      setValues(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar");
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
        } else {
          await api.createConfig({
            system: "kunk",
            key: field.key,
            value,
            description: field.label,
          });
        }
      }
      // Cores de marca seguem o design system Conciliadora (tokens CSS).
      // Esta tela persiste título/opções legadas sem sobrescrever --primary.
      setOk("Aparência salva.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle>Aparência</PageTitle>
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
                  type={field.key.includes("TITLE") ? "text" : "color"}
                  value={values[field.key] || field.defaultValue}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                />
                {!field.key.includes("TITLE") ? (
                  <input
                    type="text"
                    value={values[field.key] || ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    style={{ marginTop: "0.35rem" }}
                  />
                ) : null}
              </div>
            ))}
            <div className="page__actions">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Salvar aparência"}
              </Button>
            </div>
          </form>
        )}
      </Panel>
    </>
  );
}
