import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, AlertCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";

const API_URL = "http://192.168.1.102:8000/api/auth";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      // Safely parse the backend response.
      const result = await response.json().catch(() => ({}));

      // Log the response for debugging. Never log the password or token.
      console.log("Login status:", response.status);
      console.log("Login response:", result);

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            `Login failed (HTTP ${response.status}).`,
        );
      }

      // Supports { success, token, user } and
      // { success, data: { token, user } } responses.
      const data = result.data ?? result;
      const token = data.token ?? data.accessToken;
      const user = data.user ?? data.customer;

      if (!token || !user) {
        throw new Error(
          "The server response is missing the token or user details. Check authController.js.",
        );
      }

      // Save the session through AuthContext.
      login({ token, user });

      const requestedPath = location.state?.from;
      const redirectPath =
        typeof requestedPath === "string"
          ? requestedPath
          : requestedPath?.pathname || "/";

      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Login request failed:", err);

      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the backend. Ensure your server is running on port 8000 and check CORS settings.",
        );
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-[80vh] place-items-center bg-gray-100 px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gray-950 p-10 text-white md:flex">
          <Link to="/" className="text-3xl font-black tracking-tight">
            E<span className="text-red-500">-</span>kart
          </Link>

          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-red-400">
              Welcome back
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight">
              Everything you need, all in one place.
            </h1>
            <p className="mt-4 text-sm leading-7 text-gray-300">
              Sign in to access your account and continue shopping.
            </p>
          </div>

          <p className="text-xs text-gray-400">
            Your E-kart shopping experience
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <Link
            to="/"
            className="text-2xl font-black tracking-tight text-gray-900 md:hidden"
          >
            E<span className="text-red-600">-</span>kart
          </Link>

          <h2 className="mt-5 text-3xl font-extrabold text-gray-900">
            Sign in
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Enter your account details below.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 focus-within:border-blue-600">
                <Mail size={18} className="text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full py-3.5 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 focus-within:border-blue-600">
                <LockKeyhole size={18} className="text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full py-3.5 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 py-3.5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New to E-kart?{" "}
            <Link
              to="/register"
              className="font-bold text-red-600 hover:underline"
            >
              Create an account
            </Link>
          </p>

          <Link
            to="/shop"
            className="mt-6 block text-center text-sm text-gray-500 hover:text-red-600"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
