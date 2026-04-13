import { NavLink } from "react-router-dom";

const items = [
  { to: "/admin/links", label: "Links", description: "Perfil, links e coleções" },
  { to: "/admin/shop", label: "Loja", description: "Bloco de loja" },
  { to: "/admin/design", label: "Design", description: "Cores e estilo dos botões" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__eyebrow">MINHA PÁGINA</span>
        <strong className="sidebar__title">Estúdio da Página</strong>
        <p className="sidebar__text">Edite e acompanhe sua página pública em tempo real.</p>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "is-active" : ""}`
            }
          >
            <span className="sidebar__link-title">{item.label}</span>
            <span className="sidebar__link-text">{item.description}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
