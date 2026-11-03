export default function StatCard({
  title,
  value,
  note,
  icon: Icon,
  color = "blue",
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <span className={`rounded-xl p-3 ${styles[color] || styles.blue}`}>
          {Icon && <Icon size={22} />}
        </span>
      </div>

      {note && <p className="mt-4 text-xs text-slate-500">{note}</p>}
    </div>
  );
}
