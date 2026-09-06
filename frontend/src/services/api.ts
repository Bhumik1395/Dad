const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface FocusDashboardResponse {
    kpis: {
        totalMachines: number;
        totalCalls: number;
        underNormPct: number;
        repeatCalls: number;
    };
    charts: {
        visitType: { name: string; value: number }[];
    };
}

export interface QuarterlyRow {
    quarter: string;
    calls: number;
    under_norm_pct: number;
    repeat: number;
}

export interface QuarterlyDashboardResponse {
    table: QuarterlyRow[];
    regionBreakdown: { quarter: string; region: string; calls: number }[];
}

export function uploadExcel(
    file: File,
    onProgress?: (pct: number) => void
): Promise<{ session_id: string; row_count: number }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        form.append("file", file);

        xhr.open("POST", `${API_BASE}/api/upload`);
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const pct = Math.round((event.loaded / event.total) * 100);
                onProgress(pct);
            }
        };

        xhr.onload = () => {
            let body: any = {};
            try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON response */ }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(body);
            } else {
                reject(body.detail ?? body ?? { message: "Upload failed" });
            }
        };

        xhr.onerror = () => reject({ message: "Network error during upload" });

        xhr.send(form);
    });
}

export async function getFocusDashboard(
    filters: Record<string, string>
): Promise<FocusDashboardResponse> {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/api/dashboard/focus?${params}`, {
        credentials: "include",
    });
    if (res.status === 401) throw { error: "session_expired" };
    if (!res.ok) throw await res.json();
    return res.json();
}

export async function getQuarterlyDashboard(): Promise<QuarterlyDashboardResponse> {
    const res = await fetch(`${API_BASE}/api/dashboard/quarterly`, {
        credentials: "include",
    });
    if (res.status === 401) throw { error: "session_expired" };
    if (!res.ok) throw await res.json();
    return res.json();
}