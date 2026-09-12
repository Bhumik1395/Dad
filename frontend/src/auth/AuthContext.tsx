import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface AuthContextValue {
    initialized: boolean;
    authenticated: boolean;
    username: string | null;
    roles: string[];
    company: string | null;
    token: string | null;
    signIn: (email: string, password: string) => Promise<string | null>; // returns error message, or null on success
    logout: () => void;
    authError: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [initialized, setInitialized] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [company, setCompany] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    const resolveIdentity = useCallback(async (accessToken: string): Promise<boolean> => {
        const res = await fetch(`${API_BASE}/api/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setAuthError(body?.detail?.message ?? "Your account isn't authorized yet.");
            setToken(null);
            setUsername(null);
            setRoles([]);
            setCompany(null);
            return false;
        }
        const data = await res.json();
        setToken(accessToken);
        setUsername(data.username);
        setRoles(data.roles);
        setCompany(data.company);
        setAuthError(null);
        return true;
    }, []);

    useEffect(() => {
        // Supabase persists the session in localStorage itself and keeps the
        // access token refreshed in the background -- we just react to it.
        supabase.auth.getSession().then(({ data }) => {
            const accessToken = data.session?.access_token;
            (accessToken ? resolveIdentity(accessToken) : Promise.resolve(false)).finally(() =>
                setInitialized(true)
            );
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.access_token) {
                resolveIdentity(session.access_token);
            } else {
                setToken(null);
                setUsername(null);
                setRoles([]);
                setCompany(null);
            }
        });

        return () => listener.subscription.unsubscribe();
    }, [resolveIdentity]);

    const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
        setAuthError(null);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return error.message;
        if (data.session) {
            const ok = await resolveIdentity(data.session.access_token);
            if (!ok) {
                await supabase.auth.signOut(); // don't leave a "logged in but not authorized" Supabase session dangling
                return authError ?? "Your account isn't authorized for this app yet.";
            }
        }
        return null;
    }, [resolveIdentity, authError]);

    const logout = useCallback(() => {
        supabase.auth.signOut();
        setToken(null);
        setUsername(null);
        setRoles([]);
        setCompany(null);
    }, []);

    const value: AuthContextValue = {
        initialized,
        authenticated: !!token,
        username,
        roles,
        company,
        token,
        signIn,
        logout,
        authError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
