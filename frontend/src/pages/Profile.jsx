import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

      <div className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <p className="text-sm text-gray-500">Full name</p>
          <p className="mt-1 font-medium">{user?.name || "Not provided"}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="mt-1 font-medium">{user?.email || "Not provided"}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Phone</p>
          <p className="mt-1 font-medium">{user?.phone || "Not provided"}</p>
        </div>

        <Link
          to="/my-orders"
          className="inline-block rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          View My Orders
        </Link>
      </div>
    </div>
  );
}
