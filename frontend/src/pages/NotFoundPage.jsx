import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-gray-50 text-center">
      <p className="text-4xl">🧭</p>
      <h1 className="text-xl font-semibold text-gray-900">Page not found</h1>
      <p className="text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/dashboard" className="btn-primary mt-4">
        Back to Dashboard
      </Link>
    </div>
  );
}
