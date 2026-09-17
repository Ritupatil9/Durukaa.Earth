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
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-gray-200 bg-canopy-900 text-white transition-transform lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="text-2xl">🌳</span>
          <div>
            <p className="text-lg font-semibold leading-none">Darukaa.Earth</p>
            <p className="text-xs text-forest-300">Carbon &amp; biodiversity GIS</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-forest-600 text-white"
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
