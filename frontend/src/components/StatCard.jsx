export default function StatCard({ label, value, suffix, icon, isLoading }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-xl">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-6 w-20 animate-pulse rounded bg-gray-200" />
        ) : (
          <p className="truncate text-2xl font-semibold text-gray-900">
            {value}
            {suffix && <span className="ml-1 text-sm font-normal text-gray-500">{suffix}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
