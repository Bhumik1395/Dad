import { NavLink, Outlet } from "react-router-dom";
import { BarChart2, UploadCloud, LogOut } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const navItems = [
    { to: "/customer/pm", label: "PM Overview", icon: BarChart2 },
    { to: "/customer/pm/upload", label: "Upload Data", icon: UploadCloud },
];

export default function CustomerDashboardShell() {
    const { username, company, logout } = useAuth();

    return (
        <div className="h-screen flex overflow-hidden" style={{ background: "var(--color-bg)" }}>
            <aside className="w-64 h-screen shrink-0 bg-white border-r flex flex-col justify-between" style={{ borderColor: "var(--color-border)" }}>
                <div>
                    <div className="p-6">
                        <h1 className="text-lg font-bold" style={{ color: "var(--color-accent)" }}>Corob Service</h1>
                        <p className="text-xs text-gray-500">PM Data Dashboard</p>
                    </div>
                    <nav className="px-3">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === "/customer/pm"}
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

                <div className="p-4 border-t shrink-0 flex flex-col gap-2" style={{ borderColor: "var(--color-border)" }}>
                    <div className="px-1">
                        <p className="text-sm font-medium text-gray-700 truncate">{company}</p>
                        <p className="text-xs text-gray-500 truncate">{username}</p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-2 text-sm border rounded-lg py-2 hover:bg-gray-50"
                    >
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
            </aside>

            <main className="flex-1 h-screen overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
