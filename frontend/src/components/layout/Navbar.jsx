import { useEffect, useRef, useState } from "react";
import {
  Zap,
  Menu,
  X,
  Search,
  ShoppingCart,
  Heart,
  UserRound,
  ArrowRight,
  Smartphone,
  Refrigerator,
  Tv,
  House,
  ChevronDown,
  Package,
  LogIn,
  LogOut,
  UserCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  { label: "Home", to: "/", type: "path" },
  { label: "Shop All", to: "/shop", type: "path" },
  { label: "Mobiles", to: "/shop?category=Mobiles", type: "category" },
  {
    label: "Home Appliances",
    to: "/shop?category=Home%20Appliances",
    type: "category",
  },
];

const quickCategories = [
  { label: "Televisions", to: "/shop?category=Televisions", icon: Tv },
  {
    label: "Refrigerators",
    to: "/shop?category=Refrigerators",
    icon: Refrigerator,
  },
  { label: "Smartphones", to: "/shop?category=Mobiles", icon: Smartphone },
  {
    label: "Home essentials",
    to: "/shop?category=Home%20Appliances",
    icon: House,
  },
];

function getLinkActive(link, pathname, searchParams) {
  if (link.to === "/") return pathname === "/";

  if (link.to === "/shop") {
    return pathname === "/shop" && !searchParams.get("category");
  }

  if (link.type === "category") {
    const category = new URLSearchParams(link.to.split("?")[1]).get("category");

    return pathname === "/shop" && searchParams.get("category") === category;
  }

  return pathname === link.to;
}

export default function Navbar() {
  const { cartCount = 0 } = useCart();
  const { user, isLoggedIn, logout } = useAuth();

  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const accountRef = useRef(null);
  const searchParams = new URLSearchParams(location.search);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileOpen(false);
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function closeMenus() {
    setMobileOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }

  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();

    navigate(query ? `/shop?search=${encodeURIComponent(query)}` : "/shop");
    closeMenus();
  }

  function handleLogout() {
    logout();
    closeMenus();
    navigate("/", { replace: true });
  }

  const accountName = user?.name || user?.fullName || "My Account";

  return (
    <header className="sticky top-0 z-50 w-full min-w-0 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-xl">
      {/* Announcement bar */}
      <div className="bg-gray-950 px-2 py-2 text-center text-[10px] font-medium text-white sm:px-3 sm:text-xs">
        <span className="text-red-400">E-KART</span>
        {" · Electronics for everyday living"}

        <Link
          to="/shop"
          onClick={closeMenus}
          className="ml-1 inline-flex items-center gap-1 font-bold text-blue-300 hover:text-white sm:ml-2"
        >
          Explore <ArrowRight size={12} />
        </Link>
      </div>

      {/* Responsive main navbar */}
      <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center gap-1.5 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3 lg:gap-5 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => {
            setMobileOpen((value) => !value);
            setSearchOpen(false);
            setAccountOpen(false);
          }}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 sm:h-10 sm:w-10 lg:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenus}
          aria-label="E-KART homepage"
          className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-600 text-white shadow-sm shadow-red-200 sm:h-10 sm:w-10 sm:rounded-xl">
            <Zap size={21} fill="currentColor" />
          </span>

          <span className="text-lg font-black tracking-tight text-gray-950 sm:text-2xl">
            E-<span className="text-red-600">kart</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {navigation.map((link) => {
            const active = getLinkActive(link, location.pathname, searchParams);

            return (
              <Link
                key={link.label}
                to={link.to}
                onClick={closeMenus}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-red-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop search */}
        <form
          onSubmit={submitSearch}
          role="search"
          className="ml-auto hidden h-11 min-w-0 max-w-sm flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 md:flex"
        >
          <Search size={18} className="shrink-0 text-gray-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search electronics..."
            aria-label="Search products"
            className="w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="shrink-0 text-gray-400 hover:text-gray-800"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="submit"
            aria-label="Submit search"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-gray-600 hover:bg-red-600 hover:text-white"
          >
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Actions: compact on mobile */}
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 md:ml-0">
          {/* Mobile search */}
          <button
            type="button"
            onClick={() => {
              setSearchOpen((value) => !value);
              setMobileOpen(false);
              setAccountOpen(false);
            }}
            aria-label="Toggle search"
            aria-expanded={searchOpen}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-700 hover:bg-gray-100 sm:h-10 sm:w-10 md:hidden"
          >
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            onClick={closeMenus}
            aria-label="Wishlist"
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 sm:grid"
          >
            <Heart size={20} />
          </Link>

          {/* Account */}
          <div className="relative min-w-0" ref={accountRef}>
            <button
              type="button"
              onClick={() => {
                setAccountOpen((value) => !value);
                setMobileOpen(false);
                setSearchOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              className="flex h-9 max-w-108px items-center gap-1 rounded-lg px-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-red-600 sm:h-10 sm:max-w-170px sm:gap-2 sm:px-3 sm:text-sm"
            >
              <UserRound size={19} className="shrink-0" />

              <span className="min-w-0 truncate">
                {isLoggedIn ? accountName : "Login"}
              </span>

              <ChevronDown
                size={13}
                className={`hidden shrink-0 transition-transform sm:block ${
                  accountOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountOpen && (
              <div
                role="menu"
                aria-label="Account menu"
                className="absolute right-0 top-full z-50 mt-2 w-60 max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl"
              >
                {isLoggedIn ? (
                  <>
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {accountName}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user?.email || ""}
                      </p>
                    </div>

                    <Link
                      to="/account"
                      role="menuitem"
                      onClick={closeMenus}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
                    >
                      <UserCircle size={18} />
                      My Profile
                    </Link>

                    <Link
                      to="/my-orders"
                      role="menuitem"
                      onClick={closeMenus}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
                    >
                      <Package size={18} />
                      My Orders
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">
                        Welcome to E-KART
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Sign in to manage your account.
                      </p>
                    </div>

                    <Link
                      to="/login"
                      role="menuitem"
                      onClick={closeMenus}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
                    >
                      <LogIn size={18} />
                      Login
                    </Link>

                    <Link
                      to="/login?mode=register"
                      role="menuitem"
                      onClick={closeMenus}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
                    >
                      <UserRound size={18} />
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <Link
            to="/cart"
            onClick={closeMenus}
            aria-label={`Shopping cart, ${cartCount} items`}
            aria-current={location.pathname === "/cart" ? "page" : undefined}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition sm:h-10 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-3 ${
              location.pathname === "/cart"
                ? "bg-red-600"
                : "bg-gray-950 hover:bg-red-600"
            }`}
          >
            <span className="relative">
              <ShoppingCart size={19} />

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-gray-950">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>

            <span className="hidden text-sm font-bold sm:inline">Cart</span>
          </Link>
        </div>
      </div>

      {/* Mobile search panel */}
      {searchOpen && (
        <div className="w-full min-w-0 border-t border-gray-100 bg-white px-3 py-3 sm:px-4 md:hidden">
          <form
            onSubmit={submitSearch}
            role="search"
            className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-400"
          >
            <Search size={18} className="shrink-0 text-gray-400" />

            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />

            <button
              type="submit"
              className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="w-full min-w-0 border-t border-gray-100 bg-white px-3 py-4 shadow-lg sm:px-4 lg:hidden">
          <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
            Browse E-KART
          </p>

          <nav aria-label="Mobile navigation" className="grid gap-1">
            {navigation.map((link) => {
              const active = getLinkActive(
                link,
                location.pathname,
                searchParams,
              );

              return (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={closeMenus}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-red-50 text-red-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                  <ArrowRight size={16} className="opacity-50" />
                </Link>
              );
            })}
          </nav>

          {/* Quick categories */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 sm:gap-3">
            {quickCategories.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={closeMenus}
                className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-50 p-3 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600"
              >
                <Icon size={17} className="shrink-0 text-blue-600" />
                <span className="min-w-0 wrap-break-words">{label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile account links */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 sm:gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  to="/account"
                  onClick={closeMenus}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm font-semibold text-gray-700"
                >
                  <UserCircle size={17} className="shrink-0" />
                  My Profile
                </Link>

                <Link
                  to="/my-orders"
                  onClick={closeMenus}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm font-semibold text-gray-700"
                >
                  <Package size={17} className="shrink-0" />
                  My Orders
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-100 p-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 p-3 text-sm font-semibold text-gray-700"
                >
                  <LogIn size={17} />
                  Login
                </Link>

                <Link
                  to="/login?mode=register"
                  onClick={closeMenus}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 p-3 text-sm font-semibold text-gray-700"
                >
                  <UserRound size={17} />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile cart shortcut */}
          <Link
            to="/cart"
            onClick={closeMenus}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-800 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <ShoppingCart size={17} />
            View cart ({cartCount})
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/shop"
            onClick={closeMenus}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
          >
            Explore all products <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </header>
  );
}
