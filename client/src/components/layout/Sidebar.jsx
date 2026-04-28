import { BarChart3, Link2, Palette, Store } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../app/AuthContext.jsx";

const editorItems = [
  { to: "/admin/links", label: "Links", icon: Link2 },
  { to: "/admin/shop", label: "Loja", icon: Store },
  { to: "/admin/design", label: "Design", icon: Palette },
];

const insightItems = [
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function getPageTitle(page) {
  return String(page?.title || page?.slug || "Minha pagina").trim();
}

function getPageHandle(page) {
  const slug = String(page?.slug || "").trim();
  return slug ? `/${slug}` : "Sem URL publicada";
}

function getPageInitial(page) {
  return getPageTitle(page).charAt(0).toUpperCase() || "D";
}

export default function Sidebar({ page }) {
  const { user, logout } = useAuth();
  const renderNavItems = (items) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `sidebar__link ${isActive ? "is-active" : ""}`
        }
      >
        <span className="sidebar__link-icon" aria-hidden="true">
          <item.icon size={17} strokeWidth={2.1} />
        </span>
        <span className="sidebar__link-label">{item.label}</span>
      </NavLink>
    ));

  return (
    <aside className="sidebar">
      <div className="sidebar__profile">
        <div className="sidebar__profile-main">
          <span className="sidebar__brand-mark" aria-hidden="true">
            {getPageInitial(page)}
          </span>
          <div className="sidebar__profile-copy">
            <span className="sidebar__profile-eyebrow">Workspace</span>
            <strong>{getPageTitle(page)}</strong>
            <span className="sidebar__profile-handle">{getPageHandle(page)}</span>
          </div>
        </div>
      </div>

      <div className="sidebar__section">
        <span className="sidebar__section-label">Editar</span>

        <nav className="sidebar__nav" aria-label="Navegacao do editor">
          {renderNavItems(editorItems)}
        </nav>
      </div>

      <div className="sidebar__section">
        <span className="sidebar__section-label">Insights</span>

        <nav className="sidebar__nav" aria-label="Navegacao de insights">
          {renderNavItems(insightItems)}
        </nav>
      </div>

      <div className="sidebar__section sidebar__section--account">
        <span className="sidebar__section-label">Conta</span>
        <div className="sidebar__account-card">
          <strong>{user?.displayName || user?.email || "Conta"}</strong>
          <span>{user?.email || "Sessao ativa"}</span>
          <button type="button" className="sidebar__logout" onClick={logout}>
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
