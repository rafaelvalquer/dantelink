import { Link2, Palette, Store } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/admin/links", label: "Links", icon: Link2 },
  { to: "/admin/shop", label: "Loja", icon: Store },
  { to: "/admin/design", label: "Design", icon: Palette },
];

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function PremiumSidebar() {
  return (
    <aside className="w-full shrink-0 xl:sticky xl:top-4 xl:w-[248px] xl:self-start">
      <div className="rounded-[32px] border border-white/10 bg-[#111327] p-4 shadow-[0_30px_80px_-42px_rgba(0,0,0,0.75)]">
        <div className="mb-5 flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#7C3AED] text-lg font-bold text-white shadow-[0_18px_38px_-18px_rgba(124,58,237,0.95)]">
            D
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A9AEC7]">
              DandeLink
            </div>
            <div className="truncate text-sm font-semibold text-white">
              Premium editor
            </div>
          </div>
        </div>

        <nav
          className="flex gap-3 overflow-x-auto pb-1 xl:grid xl:overflow-visible"
          aria-label="Navegacao do editor"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cls(
                  "group inline-flex min-w-[150px] items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition duration-200 xl:min-w-0",
                  isActive
                    ? "border-[#8E67F3] bg-[#151834] text-white shadow-[0_20px_45px_-30px_rgba(124,58,237,0.9)]"
                    : "border-white/5 bg-white/[0.03] text-[#D9DBE8] hover:border-white/10 hover:bg-white/[0.06]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cls(
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition duration-200",
                      isActive
                        ? "border-[#A78BFA]/40 bg-[#7C3AED] text-white"
                        : "border-white/8 bg-white/[0.06] text-[#A9AEC7] group-hover:text-white",
                    )}
                    aria-hidden="true"
                  >
                    <item.icon size={18} strokeWidth={2.1} />
                  </span>
                  <span className="text-sm font-semibold tracking-[-0.01em]">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
