import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/projects", label: "Projects", icon: "🗂️" },
  { to: "/map", label: "Map", icon: "🗺️" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col bg-canopy-900 text-white transition-transform lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <img src="/favicon.svg" alt="" className="h-10 w-10 rounded-2xl shadow-sm" />
          <div>
            <p className="display-font text-xl leading-none">Darukaa.Earth</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-forest-300">Restoration atlas</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 pt-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-forest-600 text-white shadow-lg shadow-black/10"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <span aria-hidden="true">🚪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
