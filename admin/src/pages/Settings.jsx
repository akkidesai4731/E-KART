import { useCallback, useEffect, useState } from "react";
import {
  Save,
  Store,
  Mail,
  Truck,
  Phone,
  MapPin,
  Bell,
  Package,
  Settings as SettingsIcon,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import api from "../api/axios.js";

const STORAGE_KEY = "ekart-admin-store-settings";

const DEFAULT_SETTINGS = {
  storeName: "E-Kart",
  supportEmail: "",
  supportPhone: "",
  storeAddress: "",
  currency: "INR",
  shippingMessage: "Standard delivery",
  freeShippingThreshold: 999,
  lowStockThreshold: 5,
  orderNotifications: true,
  maintenanceMode: false,
};

function readLocalSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function normalizeSettings(data) {
  const settings = data?.settings || data?.data?.settings || data?.data || data;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return DEFAULT_SETTINGS;
  }

  return { ...DEFAULT_SETTINGS, ...settings };
}

function Field({ label, icon: Icon, hint, children }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <Icon size={16} className="text-slate-500" />
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, title, description, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [savedForm, setSavedForm] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [storageMode, setStorageMode] = useState("loading");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data } = await api.get("/admin/settings");
      const settings = normalizeSettings(data);

      setForm(settings);
      setSavedForm(settings);
      setStorageMode("server");
    } catch {
      // Local fallback allows the page to work before the API is configured.
      const settings = readLocalSettings();
      setForm(settings);
      setSavedForm(settings);
      setStorageMode("local");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  function update(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage("");
  }

  function updateToggle(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      ...form,
      freeShippingThreshold: Number(form.freeShippingThreshold),
      lowStockThreshold: Number(form.lowStockThreshold),
    };

    if (
      !payload.storeName.trim() ||
      (payload.supportEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.supportEmail))
    ) {
      setMessageType("error");
      setMessage("Enter a valid store name and support email address.");
      setSaving(false);
      return;
    }

    if (payload.freeShippingThreshold < 0 || payload.lowStockThreshold < 0) {
      setMessageType("error");
      setMessage("Shipping and stock thresholds cannot be negative.");
      setSaving(false);
      return;
    }

    try {
      await api.put("/admin/settings", payload);

      setForm(payload);
      setSavedForm(payload);
      setStorageMode("server");
      setMessageType("success");
      setMessage("Settings saved to your backend successfully.");
    } catch {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setForm(payload);
        setSavedForm(payload);
        setStorageMode("local");
        setMessageType("warning");
        setMessage(
          "Saved in this browser only. Configure the backend settings endpoint to save settings centrally.",
        );
      } catch {
        setMessageType("error");
        setMessage(
          "Settings could not be saved. Check your browser storage and backend connection.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function resetChanges() {
    setForm(savedForm);
    setMessage("");
  }

  async function restoreDefaults() {
    const confirmed = window.confirm(
      "Restore the default values in this form? Save the settings to apply them.",
    );

    if (!confirmed) return;

    setForm({ ...DEFAULT_SETTINGS });
    setMessage("");
  }

  if (loading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3">
        <LoaderCircle size={32} className="animate-spin text-blue-600" />
        <p className="font-semibold text-slate-700">
          Loading store settings...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-300">
              <SettingsIcon size={17} />
              E-KART ADMINISTRATION
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Store settings
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Manage your store identity, customer support, delivery
              preferences, and operational options.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold">
              <span
                className={`h-2 w-2 rounded-full ${
                  storageMode === "server" ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {storageMode === "server"
                ? "Backend connected"
                : "Browser storage mode"}
            </span>
          </div>
        </div>
      </div>

      {/* Information banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={21} />
        <div>
          <p className="text-sm font-bold text-blue-900">Store configuration</p>
          <p className="mt-1 text-sm leading-5 text-blue-800">
            Changes affect your actual storefront only when your backend and
            frontend are configured to use these settings.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Store details */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Store size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Store information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The basic identity and location of your store.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <Field label="Store name" icon={Store}>
              <input
                name="storeName"
                value={form.storeName}
                onChange={update}
                required
                maxLength={100}
                placeholder="E-Kart"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </Field>

            <Field
              label="Currency"
              icon={Store}
              hint="Used for displaying prices when integrated."
            >
              <select
                name="currency"
                value={form.currency}
                onChange={update}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Store address" icon={MapPin}>
                <textarea
                  name="storeAddress"
                  value={form.storeAddress}
                  onChange={update}
                  rows={2}
                  maxLength={500}
                  placeholder="Enter your business address"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Contact details */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Mail size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Customer support
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Contact details customers can use to reach your store.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <Field label="Support email" icon={Mail}>
              <input
                name="supportEmail"
                type="email"
                value={form.supportEmail}
                onChange={update}
                maxLength={254}
                placeholder="support@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </Field>

            <Field label="Support phone" icon={Phone}>
              <input
                name="supportPhone"
                type="tel"
                value={form.supportPhone}
                onChange={update}
                maxLength={25}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </Field>
          </div>
        </section>

        {/* Delivery and inventory */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <Truck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Delivery & inventory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure delivery messaging and stock alert preferences.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <Field label="Shipping message" icon={Truck}>
              <input
                name="shippingMessage"
                value={form.shippingMessage}
                onChange={update}
                maxLength={150}
                placeholder="Standard delivery"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </Field>

            <Field
              label="Free shipping threshold"
              icon={Package}
              hint={`Orders at or above ${form.currency} ${Number(form.freeShippingThreshold || 0).toLocaleString()} may qualify for free shipping when implemented in checkout.`}
            >
              <input
                name="freeShippingThreshold"
                type="number"
                min="0"
                step="1"
                value={form.freeShippingThreshold}
                onChange={update}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </Field>

            <Field
              label="Low-stock alert threshold"
              icon={Package}
              hint="Show a low-stock alert when a product's inventory reaches this quantity, if implemented in the admin panel."
            >
              <input
                name="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                value={form.lowStockThreshold}
                onChange={update}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </Field>
          </div>
        </section>

        {/* Operational preferences */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Wrench size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Store operations
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose operational preferences for your store.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-5 sm:p-6">
            <Toggle
              icon={Bell}
              title="Order notifications"
              description="Enable the preference for order notifications. A notification service must be connected for alerts to be sent."
              checked={form.orderNotifications}
              onChange={(value) => updateToggle("orderNotifications", value)}
            />

            <Toggle
              icon={Wrench}
              title="Maintenance mode"
              description="Save a maintenance-mode preference. Your backend or storefront must enforce it before it affects customer access."
              checked={form.maintenanceMode}
              onChange={(value) => updateToggle("maintenanceMode", value)}
            />
          </div>
        </section>

        {/* Feedback */}
        {message && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : messageType === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {messageType === "error" ? (
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            )}
            <p>{message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="sticky bottom-3 z-10 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            {isDirty
              ? "You have unsaved changes."
              : "Your form matches the last saved settings."}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetChanges}
              disabled={!isDirty || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={16} />
              Undo changes
            </button>

            <button
              type="button"
              onClick={restoreDefaults}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Restore defaults
            </button>

            <button
              type="submit"
              disabled={saving || !isDirty}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
