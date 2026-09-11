import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import keycloak from "./keycloak";

interface AuthContextValue {
    initialized: boolean;
    authenticated: boolean;
    username: string | null;
    roles: string[];
    company: string | null;
    token: string | null;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [initialized, setInitialized] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        keycloak
            .init({ onLoad: "check-sso", pkceMethod: "S256", checkLoginIframe: false })
            .then((authed) => {
                setAuthenticated(authed);
                setToken(authed ? keycloak.token ?? null : null);
                setInitialized(true);
            })
            .catch(() => setInitialized(true));

        // Keep the access token fresh; a value under 30s left triggers a refresh.
        const refreshInterval = setInterval(() => {
            keycloak.updateToken(30).then((refreshed) => {
                if (refreshed) setToken(keycloak.token ?? null);
            }).catch(() => {
                setAuthenticated(false);
            });
        }, 20000);

        return () => clearInterval(refreshInterval);
    }, []);

    const parsed: Record<string, any> = keycloak.tokenParsed ?? {};
    const roles: string[] = parsed.realm_access?.roles ?? [];
    const company: string | null = parsed.company ?? null;
    const username: string | null = parsed.preferred_username ?? null;

    const value: AuthContextValue = {
        initialized,
        authenticated,
        username,
        roles,
        company,
        token,
        login: () => keycloak.login(),
        logout: () => keycloak.logout({ redirectUri: window.location.origin + "/login" }),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
