import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = "https://e-kart-2ijq.onrender.com/api";

export default function Account() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const body = response.data;
        const customer = body.user || body.data?.user || body.data;

        if (!customer) {
          throw new Error("Profile details were not returned by the server.");
        }

        if (!cancelled) {
          setProfile(customer);
        }
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 401) {
            setError("Your session has expired. Please log in again.");
          } else {
            setError(
              err.response?.data?.message ||
                err.message ||
                "Unable to load your profile.",
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        Loading your profile...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
      <p className="mt-2 text-gray-500">View your E-KART account details.</p>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          <p>{error}</p>
          {error.includes("expired") && (
            <Link
              to="/login"
              className="mt-2 inline-block font-semibold underline"
            >
              Log in again
            </Link>
          )}
        </div>
      )}

      {!error && profile && (
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-700">
              {(profile.name || "C").charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.name || "Customer"}
              </h2>
              <p className="text-sm text-gray-500">{profile.email || ""}</p>
            </div>
          </div>

          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Full name</p>
              <p className="mt-1 font-medium text-gray-900">
                {profile.name || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email address</p>
              <p className="mt-1 wrap-break-words font-medium text-gray-900">
                {profile.email || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Phone number</p>
              <p className="mt-1 font-medium text-gray-900">
                {profile.phone || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Account type</p>
              <p className="mt-1 font-medium capitalize text-gray-900">
                {profile.role || "customer"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <Link
              to="/my-orders"
              className="font-semibold text-red-600 hover:text-red-700"
            >
              View My Orders →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
