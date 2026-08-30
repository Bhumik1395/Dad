import { NavLink, Outlet } from "react-router-dom";
import { Scan, BarChart2, Users, RotateCcw } from "lucide-react";
const navItems = [
    { to: "/dashboard/focus", label: "Focus Mode", icon: Scan },
    { to: "/dashboard/quarterly", label: "Quarterly Analysis", icon: BarChart2 },
    { to: "/dashboard/employees", label: "Employee Analysis", icon: Users },
];
export default function DashboardShell() {
    return (
        <div className="flex min-h-screen bg-[--color-bg]">
            <aside className="w-64 bg-white border-r border-[--color-border] flex flex-col justify-between">
                <div>
                    <div className="p-6">
                        <h1 className="text-lg font-bold text-[--color-accent]">Service Call</h1>
                        <p className="text-xs text-gray-500">Analytics Dashboard</p>
                    </div>
                    <nav className="px-3">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to} to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 ${isActive
                                        ? "bg-[--color-accent-light] text-[--color-accent] border-l-2 border-[--color-accent] fontmedium"
                                        : "text-gray-600 hover:bg-gray-50"
                                    }`
                                }
                            >
                                <Icon size={18} /> {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="p-4 border-t border-[--color-border]">
                    <button
                        onClick={() => fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session`, {
                            method: "DELETE", credentials: "include",
                        }).then(() => window.location.href = "/")}
                        className="w-full flex items-center justify-center gap-2 text-sm border rounded-lg py-2 hover:bggray-50"
                    >
                        <RotateCcw size={14} /> Reset Session
                    </button>
                </div>
            </aside>
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}
