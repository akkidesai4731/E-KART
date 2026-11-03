import { Truck } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="flex min-h-9 items-center justify-center gap-2 bg-gray-950 px-3 py-2 text-center text-[11px] text-white sm:text-xs">
      <Truck size={15} />
      <span>Discover everyday essentials with E-kart</span>
    </div>
  );
}
