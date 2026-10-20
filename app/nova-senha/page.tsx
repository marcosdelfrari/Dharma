"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Alert, Button, Loader } from "@/components/ui";

function validatePassword(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}

function NewPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") || "";
  const [mode, setMode] = useState<"forgot" | "reset">(
    tokenFromUrl ? "reset" : "forgot",
  );
  const [token, setToken] = useState(tokenFromUrl);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const checks = useMemo(() => validatePassword(password), [password]);

  async function onForgot(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api.forgotOperatorPassword(email.trim(), "dharma");
      setOk("Se o e-mail existir, enviaremos instruções de redefinição.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao solicitar");
    } finally {
      setBusy(false);
    }
  }

  async function onReset(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!checks.length || !checks.uppercase || !checks.special) {
      setError("Senha: mín. 8 caracteres, 1 maiúscula e 1 caractere especial.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      await api.resetOperatorPassword(token.trim(), password);
      setOk("Senha atualizada. Redirecionando…");
      setTimeout(() => router.push("/login"), 1000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao redefinir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="public-page__title">Nova senha</h1>
      <p className="public-page__lead">
        {mode === "forgot"
          ? "Informe o e-mail do operador para receber o link."
          : "Defina uma nova senha com o token recebido."}
      </p>

      {error ? <Alert>{error}</Alert> : null}
      {ok ? <Alert tone="ok">{ok}</Alert> : null}

      {mode === "forgot" ? (
        <form className="form-grid" onSubmit={onForgot}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="page__actions">
            <Button type="submit" disabled={busy}>
              {busy ? "Enviando…" : "Enviar link"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("reset")}>
              Já tenho token
            </Button>
          </div>
        </form>
      ) : (
        <form className="form-grid" onSubmit={onReset}>
          <div className="field">
            <label htmlFor="token">Token</label>
            <input
              id="token"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Nova senha</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirmar senha</label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <div className="page__actions">
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Atualizar senha"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("forgot")}>
              Pedir link
            </Button>
          </div>
        </form>
      )}

      <p style={{ marginTop: "1rem" }}>
        <Link href="/login">Voltar ao login</Link>
      </p>
    </>
  );
}

export default function NewPasswordPage() {
  return (
    <div className="public-page">
      <div className="public-page__card">
        <Suspense fallback={<Loader label="Carregando…" />}>
          <NewPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
