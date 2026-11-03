import { CreditCard, Headphones, ShieldCheck, Truck } from "lucide-react";

const items = [
  { Icon: Truck, title: "Delivery options", text: "See delivery at checkout" },
  {
    Icon: ShieldCheck,
    title: "Clear information",
    text: "Specifications up front",
  },
  {
    Icon: CreditCard,
    title: "Payment choices",
    text: "Checkout integration to come",
  },
  {
    Icon: Headphones,
    title: "Customer support",
    text: "Contact information available",
  },
];

export default function ValueProps() {
  return (
    <section className="mt-16 grid grid-cols-2 gap-5 border-y border-gray-100 py-7 sm:grid-cols-4 sm:gap-6">
      {items.map(({ Icon, title, text }) => (
        <div key={title} className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={21} />
          </span>
          <div>
            <h3 className="text-xs font-extrabold">{title}</h3>
            <p className="mt-1 text-[10px] leading-5 text-gray-500">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
