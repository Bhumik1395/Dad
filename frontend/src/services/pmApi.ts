const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface PmStateRow {
    state: string;
    total_pms: number;
    closed_pms: number;
    open_pms: number;
    closure_rate_pct: number;
}

export interface PmRegionBreakdownRow {
    region: string;
    total_pms: number;
    closed_pms: number;
    open_pms: number;
    closure_rate_pct: number;
    states: PmStateRow[];
}

export interface PmMonthlyTrendRow {
    year_month: string;
    pm_count: number;
    closure_rate_pct: number;
}

export interface PmWeeklyTrendRow {
    year_week: string;
    pm_count: number;
}

export interface PmDetailRow {
    ticket_no: string;
    dealer_code: string;
    dealer_name: string;
    call_date: string;
    remarks: string;
}

export interface PmDashboardResponse {
    kpis: {
        totalPms: number;
        closureRatePct: number;
        avgLocalClosureHours: number | null;
        avgUpcountryClosureHours: number | null;
    };
    regionBreakdown: PmRegionBreakdownRow[];
    monthlyTrend: PmMonthlyTrendRow[];
    weeklyTrend: PmWeeklyTrendRow[];
    pmDetailTable: {
        rows: PmDetailRow[];
        page: number;
        pageSize: number;
        totalRows: number;
    };
}

export interface PmFilterOptions {
    states: string[];
}

export interface PmUploadResponse {
    files: { filename: string; row_count: number }[];
    companies: { company: string; total_rows_stored: number }[];
}

function authHeaders(token: string): HeadersInit {
    return { Authorization: `Bearer ${token}` };
}

async function handle<T>(res: Response): Promise<T> {
    if (res.status === 401) throw { error: "session_expired" };
    if (!res.ok) throw await res.json().catch(() => ({ message: "Request failed" }));
    return res.json();
}

/** Upload one or more PM-data .xlsx files at once. */
export function uploadPmFiles(
    files: File[],
    token: string,
    onProgress?: (pct: number) => void
): Promise<PmUploadResponse> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        files.forEach((f) => form.append("files", f));

        xhr.open("POST", `${API_BASE}/api/pm/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            let body: any = {};
            try {
                body = JSON.parse(xhr.responseText);
            } catch {
                /* non-JSON response */
            }
            if (xhr.status >= 200 && xhr.status < 300) resolve(body);
            else reject(body.detail ?? body ?? { message: "Upload failed" });
        };
        xhr.onerror = () => reject({ message: "Network error during upload" });
        xhr.send(form);
    });
}

export async function getPmDashboard(
    token: string,
    opts: { company?: string; state?: string; page?: number; pageSize?: number } = {}
): Promise<PmDashboardResponse> {
    const params = new URLSearchParams();
    if (opts.company) params.set("company", opts.company);
    if (opts.state) params.set("state", opts.state);
    params.set("page", String(opts.page ?? 1));
    params.set("page_size", String(opts.pageSize ?? 50));

    const res = await fetch(`${API_BASE}/api/pm/dashboard?${params}`, { headers: authHeaders(token) });
    return handle<PmDashboardResponse>(res);
}

export async function getPmFilterOptions(token: string, company?: string): Promise<PmFilterOptions> {
    const params = new URLSearchParams();
    if (company) params.set("company", company);
    const res = await fetch(`${API_BASE}/api/pm/filters?${params}`, { headers: authHeaders(token) });
    return handle<PmFilterOptions>(res);
}

/**
 * PDFs aren't generated -- they're static files you commit to
 * frontend/public/pm-pdfs/, named exactly `${ticket_no}.pdf`.
 * This just builds the URL; existence is checked at click-time (see
 * PmDashboard.tsx) since most tickets won't have one yet.
 */
export function pmPdfUrl(ticketNo: string): string {
    return `/pm-pdfs/${encodeURIComponent(ticketNo)}.pdf`;
}
