import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, LogOut, FileText, UploadCloud, ChevronDown, ChevronRight } from "lucide-react";
import { downloadPdfReport } from "../../services/api";
import { FocusFilterProvider, useFocusFilter } from "../../context/FocusFilterContext";
import { useAuth } from "../../auth/AuthContext";
import corobLogo from "../../assets/corob-logo.png";

interface NavLeaf {
    to: string;
    label: string;
}

interface NavGroupDef {
    label: string;
    children: NavLeaf[];
}

const navGroups: NavGroupDef[] = [
    {
        label: "Service Calls",
        children: [{ to: "/dashboard/focus", label: "Service Calls" }],
    },
    {
        label: "Preventive Measure",
        children: [
            { to: "/dashboard/pm", label: "PM Overview" },
            { to: "/dashboard/pm/upload", label: "Upload PM Data" },
        ],
    },
    {
        label: "Engineer Utilization",
        children: [
            { to: "/dashboard/employees", label: "Employee Analysis" },
            { to: "/dashboard/utilization", label: "Engineer Utilization" },
        ],
    },
];

function NavGroup({ group }: { group: NavGroupDef }) {
    const location = useLocation();
    const isSingleChild = group.children.length === 1;
    const isActive = group.children.some((c) => location.pathname.startsWith(c.to));
    const [open, setOpen] = useState(isActive);

    if (isSingleChild) {
        return (
            <NavLink
                to={group.children[0].to}
                className="w-full block text-center text-lg py-8 hover:text-red-600 transition-colors"
                style={({ isActive }) =>
                    isActive
                        ? { color: "var(--color-accent)", fontWeight: 600 }
                        : { color: "#111827" }
                }
            >
                {group.label}
            </NavLink>
        );
    }

    return (
        <div className="w-full">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-center gap-1.5 text-center text-lg py-8 hover:text-red-600 transition-colors"
                style={isActive ? { color: "var(--color-accent)", fontWeight: 600 } : { color: "#111827" }}
            >
                {group.label}
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {open && (
                <div className="flex flex-col items-center gap-1 pb-4 -mt-4">
                    {group.children.map((child) => (
                        <NavLink
                            key={child.to}
                            to={child.to}
                            end
                            className="text-sm py-2 px-3 rounded-md hover:bg-gray-50"
                            style={({ isActive }) =>
                                isActive
                                    ? { color: "var(--color-accent)", fontWeight: 600, background: "var(--color-accent-light)" }
                                    : { color: "#6b7280" }
                            }
                        >
                            {child.label}
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
}

function DashboardShellInner() {
    const [collapsed, setCollapsed] = useState(false);
    const [generating, setGenerating] = useState(false);
    const { customer } = useFocusFilter();
    const { username, roles, logout } = useAuth();

    const roleLabel = roles.includes("corob_employee")
        ? "Corob Employee"
        : roles.includes("customer")
            ? "Customer"
            : "";

    const handleGeneratePdf = async () => {
        setGenerating(true);
        try {
            await downloadPdfReport(customer);
        } catch {
            alert("Failed to generate PDF report. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSignOut = async () => {
        try {

            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session`, {
                method: "DELETE",
                credentials: "include",
            });
        } catch {
        }
        logout();
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--color-bg)" }}>
            <header className="shrink-0 flex items-center justify-between px-8 py-5 bg-white border-b-2 border-black">
                <img src={corobLogo} alt="Corob" className="h-8 w-auto" />
                <div className="flex items-center gap-4">
                    <div className="text-right leading-tight">
                        <p className="font-semibold text-gray-900">{username}</p>
                        <p className="text-sm text-gray-500">{roleLabel}</p>
                    </div>
                    <button onClick={handleSignOut} title="Sign out" className="text-gray-700 hover:text-red-600">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside
                    className={`h-full shrink-0 bg-white border-r-2 border-black flex flex-col transition-all duration-200 ${collapsed ? "w-16" : "w-64"
                        }`}
                >
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="p-5 text-gray-800 hover:text-red-600 self-start"
                        title={collapsed ? "Expand menu" : "Collapse menu"}
                    >
                        <Menu size={22} />
                    </button>

                    {!collapsed && (
                        <nav className="flex-1 flex flex-col overflow-y-auto px-2">
                            {navGroups.map((group) => (
                                <NavGroup key={group.label} group={group} />
                            ))}

                            <div className="mt-auto pt-4 pb-4 border-t flex flex-col items-center gap-2" style={{ borderColor: "var(--color-border)" }}>
                                <NavLink
                                    to="/dashboard/upload"
                                    className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-md hover:bg-gray-50"
                                    style={({ isActive }) =>
                                        isActive
                                            ? { color: "var(--color-accent)", fontWeight: 600 }
                                            : { color: "#374151" }
                                    }
                                >
                                    <UploadCloud size={16} /> Upload Service Calls
                                </NavLink>

                                {customer && (
                                    <p className="text-xs text-gray-500 px-1 text-center">
                                        PDF for: <span className="font-medium text-gray-700">{customer}</span>
                                    </p>
                                )}
                                <button
                                    onClick={handleGeneratePdf}
                                    disabled={generating}
                                    className="w-full flex items-center justify-center gap-2 text-sm text-white rounded-lg py-2 disabled:opacity-60"
                                    style={{ background: "var(--color-accent)" }}
                                >
                                    <FileText size={14} /> {generating ? "Generating…" : "Generate PDF Report"}
                                </button>
                            </div>
                        </nav>
                    )}
                </aside>

                <main className="flex-1 h-full overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default function DashboardShell() {
    return (
        <FocusFilterProvider>
            <DashboardShellInner />
        </FocusFilterProvider>
    );
}