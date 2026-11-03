export default function Badge({ children }) {
  return (
    <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
      {children}
    </span>
  );
}
