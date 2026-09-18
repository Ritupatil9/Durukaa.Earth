import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getErrorMessage } from "../services/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await register(form);
      showToast("Account created!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-4 py-8">
      <div className="auth-panel animate-rise card w-full max-w-md border-white/10 p-8 sm:p-10">
        <div className="mb-6 text-center">
          <img src="/favicon.svg" alt="Darukaa.Earth" className="mx-auto h-12 w-12 rounded-2xl shadow-sm" />
          <h1 className="display-font mt-4 text-3xl text-forest-900">Create your account</h1>
          <p className="text-sm text-gray-500">Start managing carbon &amp; biodiversity projects</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              required
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-forest-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
