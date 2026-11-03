import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Zap,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  Image,
  Users,
  Settings,
  Menu,
  X,
  Store,
  Boxes,
} from "lucide-react";

const links = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Products", path: "/products", icon: Package },
  { label: "Inventory", path: "/inventory", icon: Boxes },
  { label: "Orders", path: "/orders", icon: ShoppingBag },
  { label: "Categories", path: "/categories", icon: Tags },
  { label: "Banners & Sales", path: "/banners", icon: Image },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white p-4 lg:hidden">
        <span className="flex items-center gap-2 font-black text-slate-950">
          <Zap className="text-red-600" />
          E-KART ADMIN
        </span>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          aria-expanded={open}
          className="rounded-lg p-2 transition hover:bg-slate-100"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-slate-950 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-600 shadow-lg shadow-red-950/30">
            <Zap size={24} fill="currentColor" />
          </span>

          <div>
            <h1 className="text-xl font-black tracking-tight">E-Kart</h1>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Store management
          </p>

          <nav className="space-y-1">
            {links.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      className={`shrink-0 transition-transform duration-200 ${
                        isActive ? "" : "group-hover:scale-110"
                      }`}
                    />
                    <span className="flex-1">{label}</span>

                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom link */}
        <div className="mt-auto border-t border-white/10 p-4">
          <NavLink
            to="/"
            end
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <Store size={18} />
            Admin home
          </NavLink>

          <p className="px-3 pb-1 pt-3 text-[11px] text-slate-600">
            E-Kart Management System
          </p>
        </div>
      </aside>
    </>
  );
}
