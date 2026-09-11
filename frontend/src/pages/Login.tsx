import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const { initialized, authenticated, roles, login } = useAuth();

    useEffect(() => {
        document.title = "Sign in — Corob Service";
    }, []);

    if (!initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
                <p className="text-gray-500 text-sm">Loading…</p>
            </div>
        );
    }

    if (authenticated) {
        if (roles.includes("corob_employee")) return <Navigate to="/dashboard/focus" replace />;
        if (roles.includes("customer")) return <Navigate to="/customer/pm" replace />;
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
            <div className="bg-white rounded-xl border p-10 w-[440px] text-center" style={{ borderColor: "var(--color-border)" }}>
                <h1 className="text-lg font-bold mb-1" style={{ color: "var(--color-accent)" }}>Corob Service</h1>
                <p className="text-xs text-gray-500 mb-6">Analytics Dashboard</p>

                <h2 className="text-xl font-semibold mb-2">Sign in to continue</h2>
                <p className="text-sm text-gray-500 mb-8">
                    Use your Corob account to access your analytics dashboard.
                </p>

                <button
                    onClick={() => login()}
                    className="w-full flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-md"
                    style={{ background: "var(--color-accent)" }}
                >
                    <LogIn size={16} /> Sign in
                </button>
            </div>
        </div>
    );
}
