import { Outlet } from "react-router-dom";
import Sidebar from "../layout/Sidebar.jsx";
import Topbar from "../layout/Topbar.jsx";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
