import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="public-page">
      <div className="public-page__card">
        <h1 className="public-page__title">Sem permissão</h1>
        <p className="public-page__lead">
          Sua conta não tem acesso a esta área do Dharma.
        </p>
        <p>
          <Link href="/login">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
