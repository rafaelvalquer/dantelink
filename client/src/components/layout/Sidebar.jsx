import { Link2, Palette, Store } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/admin/links", label: "Links", icon: Link2 },
  { to: "/admin/shop", label: "Loja", icon: Store },
  { to: "/admin/design", label: "Design", icon: Palette },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <span className="sidebar__brand-mark" aria-hidden="true" />
      </div>

      <nav className="sidebar__nav" aria-label="Navegação do editor">
        {items.map((item) => (
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
        ))}
      </nav>
    </aside>
  );
}
