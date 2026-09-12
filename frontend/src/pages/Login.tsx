import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const { initialized, authenticated, roles, signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        const errMsg = await signIn(email, password);
        setSubmitting(false);
        if (errMsg) setError(errMsg);
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl border p-10 w-[440px]"
                style={{ borderColor: "var(--color-border)" }}
            >
                <div className="text-center mb-6">
                    <h1 className="text-lg font-bold mb-1" style={{ color: "var(--color-accent)" }}>Corob Service</h1>
                    <p className="text-xs text-gray-500">Analytics Dashboard</p>
                </div>

                <h2 className="text-xl font-semibold mb-6 text-center">Sign in to continue</h2>

                {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <label className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@corob.com"
                    className="w-full border rounded-md px-3 py-2 text-sm mb-4"
                    style={{ borderColor: "var(--color-border)" }}
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm mb-6"
                    style={{ borderColor: "var(--color-border)" }}
                />

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-md disabled:opacity-60"
                    style={{ background: "var(--color-accent)" }}
                >
                    <LogIn size={16} /> {submitting ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </div>
    );
}
