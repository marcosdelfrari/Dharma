"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type ReceptionFormField,
  type ReceptionFormSchema,
} from "@/lib/api";
import { Alert, Button, Loader } from "@/components/ui";

const FALLBACK_FIELDS: ReceptionFormField[] = [
  { id: "name", label: "Nome", type: "text", required: true },
  { id: "email", label: "E-mail", type: "email", required: true },
  { id: "phone", label: "Telefone / WhatsApp", type: "tel", required: true },
  {
    id: "help_topic",
    label: "Assunto",
    type: "select",
    required: true,
    options: ["Cadastro", "Pedido", "Atendimento", "Outro"],
  },
  { id: "message", label: "Mensagem", type: "textarea", required: true },
  { id: "is_associate", label: "Já sou associado", type: "checkbox" },
];

export default function ContactPage() {
  const [schema, setSchema] = useState<ReceptionFormSchema | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await api.receptionFormSchema();
          setSchema(res.data);
        } catch {
          setSchema({ fields: FALLBACK_FIELDS, title: "Contato / Triagem" });
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const fields =
    schema?.fields && schema.fields.length > 0 ? schema.fields : FALLBACK_FIELDS;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api.createPublicReception(values);
      setOk(
        schema?.success_message ||
          "Recebemos seu contato. Em breve a equipe responde.",
      );
      setValues({});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="public-page">
      <div className="public-page__card">
        <h1 className="public-page__title">
          {schema?.title || "Contato / Triagem"}
        </h1>
        <p className="public-page__lead">
          {schema?.subtitle ||
            "Deixe seus dados. A equipe de acolhimento entrará em contato."}
        </p>

        {error ? <Alert>{error}</Alert> : null}
        {ok ? <Alert tone="ok">{ok}</Alert> : null}

        {loading ? (
          <Loader label="Carregando formulário…" />
        ) : (
          <form className="form-grid" onSubmit={onSubmit}>
            {fields.map((field) => {
              const type =
                field.type ||
                (field.id === "message"
                  ? "textarea"
                  : field.id === "is_associate"
                    ? "checkbox"
                    : field.id === "help_topic"
                      ? "select"
                      : "text");
              const value = values[field.id];

              if (type === "checkbox") {
                return (
                  <label key={field.id} className="field" style={{ flexDirection: "row", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.id]: e.target.checked }))
                      }
                      style={{ marginRight: "0.5rem" }}
                    />
                    {field.label}
                  </label>
                );
              }

              if (type === "textarea") {
                return (
                  <div className="field" key={field.id}>
                    <label htmlFor={field.id}>{field.label}</label>
                    <textarea
                      id={field.id}
                      required={field.required !== false}
                      value={String(value || "")}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.id]: e.target.value }))
                      }
                    />
                  </div>
                );
              }

              if (type === "select") {
                const options = (field.options || [])
                  .map((o) =>
                    typeof o === "string"
                      ? o
                      : String(o.label ?? o.value ?? "").trim(),
                  )
                  .filter(Boolean);
                return (
                  <div className="field" key={field.id}>
                    <label htmlFor={field.id}>{field.label}</label>
                    <select
                      id={field.id}
                      required={field.required !== false}
                      value={String(value || "")}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.id]: e.target.value }))
                      }
                    >
                      <option value="">Selecione…</option>
                      {(options.length ? options : ["Outro"]).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div className="field" key={field.id}>
                  <label htmlFor={field.id}>{field.label}</label>
                  <input
                    id={field.id}
                    type={type === "email" || type === "tel" ? type : "text"}
                    required={field.required !== false}
                    value={String(value || "")}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.id]: e.target.value }))
                    }
                  />
                </div>
              );
            })}

            <div className="page__actions">
              <Button type="submit" variant="accent" disabled={busy}>
                {busy ? "Enviando…" : "Enviar"}
              </Button>
            </div>
          </form>
        )}

        <p style={{ marginTop: "1rem" }}>
          <Link href="/login">Área da equipe</Link>
        </p>
      </div>
    </div>
  );
}
