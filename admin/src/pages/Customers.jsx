import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Users,
  Mail,
  Phone,
  Download,
  UserRound,
  ArrowUpDown,
  X,
  AlertCircle,
  CheckCircle2,
  Filter,
  UsersRound,
} from "lucide-react";
import api from "../api/axios.js";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U"
  );
};

const normalizeCustomers = (data) => {
  const candidates = [
    data,
    data?.customers,
    data?.data,
    data?.data?.customers,
    data?.results,
  ];

  return candidates.find(Array.isArray) || [];
};

const escapeCSV = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

function StatCard({ title, value, description, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className={`rounded-xl p-3 ring-1 ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [contactFilter, setContactFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCustomers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setNotice("");

    try {
      const { data } = await api.get("/customers");
      const list = normalizeCustomers(data);

      setCustomers(list);
      setNotice(
        `${list.length} customer${list.length === 1 ? "" : "s"} loaded`,
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load customers. Check your admin customers API and server connection.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const stats = useMemo(() => {
    const withEmail = customers.filter((customer) => customer.email?.trim());
    const withPhone = customers.filter((customer) => customer.phone?.trim());
    const withBoth = customers.filter(
      (customer) => customer.email?.trim() && customer.phone?.trim(),
    );

    return {
      total: customers.length,
      withEmail: withEmail.length,
      withPhone: withPhone.length,
      withBoth: withBoth.length,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const name = customer.name || customer.fullName || "";
        const email = customer.email || "";
        const phone = customer.phone || customer.mobile || "";

        const matchesSearch = `${name} ${email} ${phone}`
          .toLowerCase()
          .includes(query);

        const hasEmail = Boolean(email.trim());
        const hasPhone = Boolean(phone.trim());

        const matchesContact =
          contactFilter === "all" ||
          (contactFilter === "email" && hasEmail) ||
          (contactFilter === "phone" && hasPhone) ||
          (contactFilter === "both" && hasEmail && hasPhone);

        return matchesSearch && matchesContact;
      })
      .sort((a, b) => {
        const getValue = (customer) => {
          if (sortBy === "email") return customer.email || "";
          if (sortBy === "phone") {
            return customer.phone || customer.mobile || "";
          }
          if (sortBy === "newest") {
            return new Date(a.createdAt || a.created_at || 0).getTime();
          }
          return customer.name || customer.fullName || "";
        };

        let comparison;

        if (sortBy === "newest") {
          const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
          const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
          comparison = dateA - dateB;
        } else {
          comparison = String(getValue(a)).localeCompare(
            String(getValue(b)),
            undefined,
            { sensitivity: "base", numeric: true },
          );
        }

        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [customers, search, contactFilter, sortBy, sortOrder]);

  const exportCSV = () => {
    if (!filteredCustomers.length) return;

    const rows = [
      ["Name", "Email", "Phone", "Customer ID"],
      ...filteredCustomers.map((customer) => [
        customer.name || customer.fullName || "",
        customer.email || "",
        customer.phone || customer.mobile || "",
        customer._id || customer.id || "",
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ekart-customers.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const changeSort = (value) => {
    if (sortBy === value) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(value);
      setSortOrder(value === "newest" ? "desc" : "asc");
    }
  };

  return (
    <div className="min-h-screen space-y-7 bg-slate-50/70 p-1 sm:p-3">
      {/* Page heading */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-300">
              <UsersRound size={17} />
              E-KART ADMINISTRATION
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Customers
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Manage your customer directory, find contact details, and export
              customer records from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadCustomers(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={exportCSV}
              disabled={!filteredCustomers.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total customers"
          value={stats.total}
          description="Registered customer records"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Email available"
          value={stats.withEmail}
          description="Customers with an email address"
          icon={Mail}
          color="violet"
        />
        <StatCard
          title="Phone available"
          value={stats.withPhone}
          description="Customers with a phone number"
          icon={Phone}
          color="emerald"
        />
        <StatCard
          title="Complete contacts"
          value={stats.withBoth}
          description="Email and phone both available"
          icon={CheckCircle2}
          color="amber"
        />
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold">Could not load customers</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadCustomers()}
            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold hover:bg-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {notice && !error && !loading && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      )}

      {/* Customer directory */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Customer directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredCustomers.length} of {customers.length}{" "}
                customers
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 sm:w-72">
                <Search size={18} className="shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, phone..."
                  aria-label="Search customers"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                <Filter size={16} className="shrink-0 text-slate-400" />
                <select
                  value={contactFilter}
                  onChange={(event) => setContactFilter(event.target.value)}
                  aria-label="Filter by contact availability"
                  className="w-full bg-transparent py-3 text-sm font-medium text-slate-700 outline-none sm:w-auto"
                >
                  <option value="all">All contacts</option>
                  <option value="email">Has email</option>
                  <option value="phone">Has phone</option>
                  <option value="both">Email and phone</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8">
            <RefreshCw size={30} className="animate-spin text-blue-600" />
            <p className="font-semibold text-slate-700">
              Loading customer records...
            </p>
            <p className="text-sm text-slate-400">Please wait a moment.</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              {search || contactFilter !== "all" ? (
                <Search size={30} />
              ) : (
                <UserRound size={30} />
              )}
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">
              {customers.length === 0
                ? "No customers yet"
                : "No matching customers"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {customers.length === 0
                ? "Registered customers will appear here once customer records are returned by your backend."
                : "Try a different search term or change the contact filter."}
            </p>
            {(search || contactFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setContactFilter("all");
                }}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-760px text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Customer</th>
                  <th className="px-5 py-4 font-bold">Email address</th>
                  <th className="px-5 py-4 font-bold">Phone number</th>
                  <th className="px-5 py-4 font-bold">Contact status</th>
                  <th className="px-5 py-4 text-right font-bold">
                    <button
                      onClick={() => changeSort("name")}
                      className="inline-flex items-center justify-end gap-1.5 transition hover:text-blue-600"
                    >
                      Sort name
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer, index) => {
                  const name =
                    customer.name || customer.fullName || "Unnamed customer";
                  const email = customer.email || "";
                  const phone = customer.phone || customer.mobile || "";
                  const hasBoth = Boolean(email.trim() && phone.trim());
                  const customerKey =
                    customer._id || customer.id || `${email}-${index}`;

                  return (
                    <tr
                      key={customerKey}
                      className="group transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-100 to-violet-100 font-extrabold text-blue-700 ring-1 ring-blue-200/60">
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-56 truncate font-bold text-slate-800">
                              {name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Customer #{index + 1}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {email ? (
                          <a
                            href={`mailto:${email}`}
                            className="inline-flex max-w-64 items-center gap-2 break-all text-slate-600 transition hover:text-blue-600"
                          >
                            <Mail
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {email}
                          </a>
                        ) : (
                          <span className="text-slate-400">Not provided</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-2 text-slate-600 transition hover:text-blue-600"
                          >
                            <Phone
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">Not provided</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${
                            hasBoth
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              hasBoth ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {hasBoth ? "Complete" : "Partial"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => changeSort("name")}
                          title="Sort customers by name"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 opacity-70 transition hover:border-blue-200 hover:text-blue-700 group-hover:opacity-100"
                        >
                          {sortOrder === "asc" ? "A → Z" : "Z → A"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {!loading && customers.length > 0 && (
          <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
            <span>
              Displaying <strong>{filteredCustomers.length}</strong> customer
              records
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Customer information from your backend
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
