import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ onMenuClick, title }) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-forest-900/10 bg-[#f4f6ef]/90 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-forest-600">Field intelligence</p>
            <h1 className="display-font text-2xl text-forest-900">{title}</h1>
          </div>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#d9e8c8] text-sm font-bold text-forest-800 shadow-sm">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        </div>
      )}
    </header>
  );
}
