import { NavLink, Outlet } from "react-router-dom";
import { Scan, BarChart2, Users, RotateCcw } from "lucide-react";

const navItems = [
    { to: "focus", label: "Focus Mode", icon: Scan },
    { to: "quarterly", label: "Quarterly Analysis", icon: BarChart2 },
    { to: "employees", label: "Employee Analysis", icon: Users },
];

export default function DashboardShell() {
    return (
        <div className="h-screen flex overflow-hidden" style={{ background: "var(--color-bg)" }}>
            <aside className="w-64 h-screen shrink-0 bg-white border-r flex flex-col justify-between" style={{ borderColor: "var(--color-border)" }}>
                <div>
                    <div className="p-6">
                        <h1 className="text-lg font-bold" style={{ color: "var(--color-accent)" }}>Service Call</h1>
                        <p className="text-xs text-gray-500">Analytics Dashboard</p>
                    </div>
                    <nav className="px-3">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 ${isActive ? "font-medium border-l-2" : "text-gray-600 hover:bg-gray-50"
                                    }`
                                }
                                style={({ isActive }) =>
                                    isActive
                                        ? { background: "var(--color-accent-light)", color: "var(--color-accent)", borderColor: "var(--color-accent)" }
                                        : undefined
                                }
                            >
                                <Icon size={18} /> {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="p-4 border-t shrink-0" style={{ borderColor: "var(--color-border)" }}>
                    <button
                        onClick={() =>
                            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session`, {
                                method: "DELETE",
                                credentials: "include",
                            }).then(() => (window.location.href = "/"))
                        }
                        className="w-full flex items-center justify-center gap-2 text-sm border rounded-lg py-2 hover:bg-gray-50"
                    >
                        <RotateCcw size={14} /> Reset Session
                    </button>
                </div>
            </aside>

            <main className="flex-1 h-screen overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}