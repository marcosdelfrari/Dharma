import Link from "next/link";

export default function NotFound() {
  return (
    <div className="public-page">
      <div className="public-page__card">
        <h1 className="public-page__title">Página não encontrada</h1>
        <p className="public-page__lead">
          O endereço não existe ou foi movido.
        </p>
        <p>
          <Link href="/app">Ir ao painel</Link>
          {" · "}
          <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
