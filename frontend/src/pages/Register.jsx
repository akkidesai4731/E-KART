import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://192.168.1.102:8000/api/auth";

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      console.log("Registration status:", response.status);
      console.log("Registration response:", result);

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            `Registration failed (HTTP ${response.status}).`,
        );
      }

      // Registration succeeded. Do not store the password.
      navigate("/login", {
        replace: true,
        state: {
          registeredEmail: email,
          registrationSuccess:
            result.message || "Account created successfully. Please log in.",
        },
      });
    } catch (err) {
      console.error("Registration request failed:", err);

      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the backend. Make sure the server is running on port 8000 and check its CORS settings.",
        );
      } else {
        setError(
          err.message || "Unable to create your account. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        {/* Left promotional panel */}
        <section className="hidden flex-col justify-between bg-gray-950 p-10 text-white md:flex">
          <Link to="/" className="flex items-center gap-2 text-3xl font-black">
            <ShoppingBag size={30} className="text-red-500" />E
            <span className="text-red-500">-</span>kart
          </Link>

          <div>
            <span className="rounded-full bg-red-500/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-400">
              Join E-kart
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight">
              Your next favourite purchase starts here.
            </h1>

            <p className="mt-5 leading-7 text-gray-300">
              Create your account to enjoy a convenient shopping experience
              across mobiles, electronics, and home appliances.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Explore products across categories",
                "Keep track of your shopping",
                "Manage your account in one place",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 size={19} className="text-green-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Welcome to your E-kart shopping experience.
          </p>
        </section>

        {/* Registration form */}
        <section className="p-6 sm:p-10 lg:p-12">
          <Link to="/" className="text-2xl font-black text-gray-900 md:hidden">
            E<span className="text-red-600">-</span>kart
          </Link>

          <p className="mt-5 text-sm font-bold uppercase tracking-widest text-red-600">
            Get started
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            Create account
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Enter your details to create your E-kart account.
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
            {/* Full name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Full name
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
                <UserRound size={19} className="text-gray-400" />

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  required
                  minLength={2}
                  value={form.name}
                  onChange={handleChange}
                  className="w-full py-3.5 text-sm outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
                <Mail size={19} className="text-gray-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full py-3.5 text-sm outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
                <LockKeyhole size={19} className="text-gray-400" />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full min-w-0 py-3.5 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-gray-500"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Confirm password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
                <LockKeyhole size={19} className="text-gray-400" />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full min-w-0 py-3.5 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 py-4 font-bold text-white transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-red-600 hover:underline"
            >
              Login
            </Link>
          </p>

          <Link
            to="/shop"
            className="mt-5 block text-center text-sm text-gray-500 hover:text-red-600"
          >
            Continue shopping
          </Link>
        </section>
      </div>
    </main>
  );
}
