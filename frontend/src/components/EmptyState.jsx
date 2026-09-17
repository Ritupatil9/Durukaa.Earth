export default function EmptyState({ icon = "🌱", title, description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-base font-semibold text-gray-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
