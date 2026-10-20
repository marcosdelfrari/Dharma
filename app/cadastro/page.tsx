"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, type SystemInvitePreview } from "@/lib/api";
import { DHARMA_LOGO } from "@/lib/brand";
import { useDharmaConfig } from "@/lib/dharma-config";
import { Alert, Button, Loader, Panel } from "@/components/ui";

function CadastroForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const { config } = useDharmaConfig();

  const [preview, setPreview] = useState<SystemInvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    last_name: "",
    password: "",
    confirm: "",
  });

  useEffect(() => {
    if (!token) {
      setError("Link de convite inválido.");
      setLoadingPreview(false);
      return;
    }
    void (async () => {
      try {
        const res = await api.previewSystemInvite(token);
        setPreview(res.data);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Convite inválido ou expirado",
        );
      } finally {
        setLoadingPreview(false);
      }
    })();
  }, [token]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.acceptSystemInvite({
        token,
        password: form.password,
        name: form.name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
      });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao concluir cadastro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login__stack">
        <div className="login__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DHARMA_LOGO}
            alt={config.title || "Dharma"}
            width={48}
            height={48}
            style={{ margin: "0 auto 0.75rem", borderRadius: "999px" }}
          />
          <p>Cadastro de acesso ao painel</p>
        </div>

        <Panel>
          {loadingPreview ? <Loader label="Validando convite…" /> : null}
          {error ? <Alert>{error}</Alert> : null}

          {preview && !error ? (
            <>
              <p style={{ marginBottom: "1rem", color: "var(--dharma-muted)" }}>
                Defina sua senha para acessar o relatório de serviços.
                {preview.email ? ` Conta: ${preview.email}` : ""}
              </p>
              <form className="form-grid" onSubmit={onSubmit}>
                <div className="field">
                  <label htmlFor="name">Nome</label>
                  <input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="last_name">Sobrenome</label>
                  <input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="password">Senha</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <small style={{ color: "var(--dharma-muted)" }}>
                    Mín. 8 caracteres, 1 maiúscula e 1 especial
                  </small>
                </div>
                <div className="field">
                  <label htmlFor="confirm">Confirmar senha</label>
                  <input
                    id="confirm"
                    type="password"
                    required
                    value={form.confirm}
                    onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  />
                </div>
                <div className="page__actions">
                  <Button type="submit" variant="accent" disabled={busy}>
                    {busy ? "Salvando…" : "Concluir cadastro"}
                  </Button>
                </div>
              </form>
            </>
          ) : null}

          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            <Link href="/login">Já tenho acesso</Link>
          </p>
        </Panel>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="login">
          <Loader label="Carregando…" />
        </div>
      }
    >
      <CadastroForm />
    </Suspense>
  );
}
