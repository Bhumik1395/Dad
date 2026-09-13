import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes, strict — not reset by activity
const PROMPT_DURATION_MS = 30 * 1000;       // 30 seconds to respond before logout

/**
 * Mount this once, high up in the tree (inside AuthProvider, alongside
 * <Routes>) so it applies to every dashboard automatically. It doesn't
 * need to live inside each dashboard shell separately.
 *
 * On logout, this component doesn't navigate anywhere itself — it just
 * calls logout(), which flips `authenticated` to false. Every dashboard
 * route is already wrapped in <ProtectedRoute>, which redirects to
 * /login as soon as it sees `authenticated === false` on its next
 * render. So the redirect-to-login happens for free, no extra wiring.
 */
export default function SessionTimeoutGuard() {
    const { authenticated, logout } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(PROMPT_DURATION_MS / 1000);

    const sessionTimerRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);
    const logoutTimerRef = useRef<number | null>(null);

    const clearAllTimers = () => {
        if (sessionTimerRef.current) window.clearTimeout(sessionTimerRef.current);
        if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
        if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
    };

    const startSessionTimer = () => {
        clearAllTimers();
        setShowPrompt(false);

        sessionTimerRef.current = window.setTimeout(() => {
            setShowPrompt(true);
            setSecondsLeft(PROMPT_DURATION_MS / 1000);

            countdownIntervalRef.current = window.setInterval(() => {
                setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
            }, 1000);

            logoutTimerRef.current = window.setTimeout(() => {
                logout();
            }, PROMPT_DURATION_MS);
        }, SESSION_DURATION_MS);
    };

    useEffect(() => {
        if (authenticated) {
            startSessionTimer();
        } else {
            clearAllTimers();
            setShowPrompt(false);
        }
        return clearAllTimers;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticated]);

    const handleStayLoggedIn = () => {
        startSessionTimer(); // gives another full 10 minutes
    };

    if (!authenticated || !showPrompt) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
                <h3 className="text-lg font-semibold mb-2">Still there?</h3>
                <p className="text-sm text-gray-600 mb-1">
                    Your session will end in {secondsLeft}s.
                </p>
                <p className="text-xs text-gray-400 mb-6">
                    You'll be signed out and returned to the login page if you don't respond.
                </p>
                <button
                    onClick={handleStayLoggedIn}
                    className="w-full text-white text-sm font-medium px-4 py-2.5 rounded-md"
                    style={{ background: "var(--color-accent)" }}
                >
                    Stay signed in — give me 10 more minutes
                </button>
            </div>
        </div>
    );
}
