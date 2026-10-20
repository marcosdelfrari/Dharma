import Link from "next/link";

export default function NotConnectedPage() {
  return (
    <div className="public-page">
      <div className="public-page__card">
        <h1 className="public-page__title">API indisponível</h1>
        <p className="public-page__lead">
          Não foi possível falar com o backend. Confira se a API está rodando em{" "}
          <code>localhost:8056</code> e se o proxy Next está ativo.
        </p>
        <p>
          <Link href="/login">Tentar novamente</Link>
        </p>
      </div>
    </div>
  );
}
