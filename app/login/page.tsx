"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DHARMA_LOGO } from "@/lib/brand";
import { useDharmaConfig } from "@/lib/dharma-config";

export default function LoginPage() {
  const { login, loading, user } = useAuth();
  const { config } = useDharmaConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandTitle = config.title || "Dharma";

  if (loading || user) {
    return (
      <div className="login">
        <div className="login__media" aria-hidden>
          <video
            className="login__video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/screen.mp4" type="video/mp4" />
          </video>
          <div className="login__shade login__shade--side" />
          <div className="login__shade login__shade--bottom" />
          <div className="login__grain" />
        </div>
        <div className="login__loader">
          <div className="loader__spinner" />
          <span>Preparando…</span>
        </div>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível entrar. Verifique e-mail e senha.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="login__media" aria-hidden>
        <video
          className="login__video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/screen.mp4" type="video/mp4" />
        </video>
        <div className="login__shade login__shade--side" />
        <div className="login__shade login__shade--bottom" />
        <div className="login__grain" />
      </div>

      <header className="login__header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DHARMA_LOGO}
          alt={brandTitle}
          className="login__logo"
          width={36}
          height={36}
        />
      </header>

      <div className="login__content">
        <h1 className="login__headline">
          <span className="login__headline-strong">{brandTitle}</span>
        </h1>
        <p className="login__lede">
          Acesso da equipe à gestão associativa, acolhimento, loja e relatórios.
        </p>

        <form className="login__form" onSubmit={onSubmit}>
          {error ? <p className="login__error">{error}</p> : null}

          <div className="login__field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="login__field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button className="login__submit" type="submit" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="login__links">
          <Link href="/nova-senha">Esqueci a senha</Link>
          <span aria-hidden>·</span>
          <Link href="/contato">Contato</Link>
        </p>
      </div>
    </div>
  );
}
