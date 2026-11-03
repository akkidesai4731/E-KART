import { Minus, Plus } from "lucide-react";

export default function QuantityInput({ value, onChange, max = 100 }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="grid h-9 w-9 place-items-center disabled:opacity-30"
      >
        <Minus size={14} />
      </button>

      <span className="min-w-8 text-center text-sm">{value}</span>

      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-9 w-9 place-items-center disabled:opacity-30"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
