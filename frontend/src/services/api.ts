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
        statusBreakdown: { name: string; value: number }[];
        callsOverTime: { month: string; calls: number }[];
        repeatMachines: { machine: string; calls: number }[];
    };
    table: {
        rows: Record<string, string | number>[];
        page: number;
        pageSize: number;
        totalRows: number;
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

export interface FilterOptions {
    customers: string[];
    states: string[];
    machines: string[];
    statuses: string[];
}

export interface EmployeeRow {
    eng_code: string;
    employee_name: string;
    total_calls: number;
    under_norm_calls: number;
    under_norm_pct: number;
    physical: number;
    online: number;
}

export interface EmployeeDashboardResponse {
    rows: EmployeeRow[];
    page: number;
    pageSize: number;
    totalRows: number;
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
            try {
                body = JSON.parse(xhr.responseText);
            } catch {
                /* non-JSON response */
            }

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

export async function getFilterOptions(): Promise<FilterOptions> {
    const res = await fetch(`${API_BASE}/api/filters`, { credentials: "include" });
    if (res.status === 401) throw { error: "session_expired" };
    if (!res.ok) throw await res.json();
    return res.json();
}

export async function getFocusDashboard(
    filters: Record<string, string>,
    page: number = 1,
    pageSize: number = 50
): Promise<FocusDashboardResponse> {
    const params = new URLSearchParams({ ...filters, page: String(page), page_size: String(pageSize) });
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

export async function getEmployeeDashboard(
    page: number = 1,
    pageSize: number = 50
): Promise<EmployeeDashboardResponse> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    const res = await fetch(`${API_BASE}/api/dashboard/employees?${params}`, {
        credentials: "include",
    });
    if (res.status === 401) throw { error: "session_expired" };
    if (!res.ok) throw await res.json();
    return res.json();
}