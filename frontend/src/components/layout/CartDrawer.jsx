import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  UserRound,
  Package,
  MapPin,
  Heart,
  Settings,
} from "lucide-react";

export default function AccountDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    { name: "My Profile", icon: UserRound, path: "/account" },
    { name: "My Orders", icon: Package, path: "/account?section=orders" },
    { name: "My Addresses", icon: MapPin, path: "/account?section=addresses" },
    { name: "My Wishlist", icon: Heart, path: "/account?section=wishlist" },
    {
      name: "Account Settings",
      icon: Settings,
      path: "/account?section=settings",
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white shadow-md transition hover:bg-red-700"
      >
        <Menu size={20} />
        My Account
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Close account menu"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-998 cursor-default bg-black/50"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-999 h-screen w-80 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Account menu"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Account</h2>
            <p className="mt-1 text-sm text-gray-500">Manage your account</p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close drawer"
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="space-y-2 p-4">
          {items.map(({ name, icon: Icon, path }) => (
            <Link
              key={name}
              to={path}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-gray-700 transition hover:bg-red-50 hover:text-red-600"
            >
              <Icon size={20} />
              <span className="font-medium">{name}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
