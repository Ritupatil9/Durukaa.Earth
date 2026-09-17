export default function LoadingSkeleton({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}
