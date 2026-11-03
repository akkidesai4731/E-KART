import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, LockKeyhole, Mail } from "lucide-react";
import api from "../api/axios.js";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });

      // This assumes the backend sets an authenticated, secure cookie.
      // If your backend returns a token instead, implement the matching
      // authentication flow and admin-role check before navigating.
      if (response.data?.user?.role !== "admin") {
        setError("An authorized admin account is required.");
        return;
      }

      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Check your credentials and backend login route.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-10">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-600 text-white">
            <Zap size={26} fill="currentColor" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-950">E-Kart Admin</h1>
            <p className="text-sm text-slate-500">Store management login</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with your authorized admin account.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Email address
            </span>
            <span className="flex items-center gap-2 rounded-xl border px-3 focus-within:border-blue-500">
              <Mail size={18} className="text-slate-400" />
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 outline-none"
                placeholder="admin@example.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </span>
            <span className="flex items-center gap-2 rounded-xl border px-3 focus-within:border-blue-500">
              <LockKeyhole size={18} className="text-slate-400" />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 outline-none"
                placeholder="Enter your password"
              />
            </span>
          </label>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 block text-center text-sm font-semibold text-slate-500 hover:text-red-600"
        >
          Back to admin dashboard
        </Link>
      </div>
    </div>
  );
}
