const API_BASE = import.meta.env.VITE_API_BASE_URL;
export async function uploadExcel(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST", body: form, credentials: "include",
    });
    if (!res.ok) {
        const err = await res.json();
        throw err.detail ?? err;
    }
    return res.json();
}
export async function getFocusDashboard(filters: Record<string, string>) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/api/dashboard/focus?${params}`, {
        credentials: "include",
    });
    if (res.status === 401) throw { error: "session_expired" };
    return res.json();
}
export async function getQuarterlyDashboard() {
    const res = await fetch(`${API_BASE}/api/dashboard/quarterly`, { credentials: "include" });
    if (res.status === 401) throw { error: "session_expired" };
    return res.json();
}
