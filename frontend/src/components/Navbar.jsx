import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ onMenuClick, title }) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-sm font-semibold text-forest-700">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        </div>
      )}
    </header>
  );
}
