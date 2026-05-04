import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../app/AuthContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      await register({ displayName, email, password });
      navigate("/admin/links", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__header">
          <span className="marketing-card__eyebrow">Criar conta</span>
          <h1>Comece seu DandeLink</h1>
          <p>Crie sua conta para ganhar uma página própria e acessar o painel.</p>
        </div>

        <label className="field field--full">
          <span>Nome</span>
          <input
            className="ui-input"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Seu nome ou marca"
            autoComplete="name"
          />
        </label>

        <label className="field field--full">
          <span>E-mail</span>
          <input
            className="ui-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="field field--full">
          <span>Senha</span>
          <input
            className="ui-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimo de 8 caracteres"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {error ? <div className="editor-shell__error">{error}</div> : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>

        <p className="auth-card__footer">
          Ja tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
