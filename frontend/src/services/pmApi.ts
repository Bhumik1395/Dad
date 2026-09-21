const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface PmStateRow {
    state: string;
    total_pms: number;
    closed_pms: number;
    open_pms: number;
}

export interface PmRegionBreakdownRow {
    region: string;
    total_pms: number;
    closed_pms: number;
    open_pms: number;
    states: PmStateRow[];
}

export interface PmMonthlyTrendRow {
    year_month: string;
    pm_count: number;
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
        pmDone: number;
        pmNotDone: number;
    };

    regionBreakdown: PmRegionBreakdownRow[];
    monthlyTrend: PmMonthlyTrendRow[];
    weeklyTrend: PmWeeklyTrendRow[];
    weeklyTrendMonth: string | null;
    availableMonths: string[];
    pmDetailTable: {
        rows: PmDetailRow[];
        page: number;
        pageSize: number;
        totalRows: number;
    };
}

export interface PmFilterOptions {
    states: string[];
    months: string[];
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
    opts: {
        company?: string;
        state?: string;
        overallMonth?: string;
        month?: string;
        dealerCode?: string;
        detailState?: string;
        detailMonth?: string;
        page?: number;
        pageSize?: number;
    } = {}
): Promise<PmDashboardResponse> {
    const params = new URLSearchParams();
    if (opts.company) params.set("company", opts.company);
    if (opts.state) params.set("state", opts.state);
    if (opts.overallMonth) params.set("overall_month", opts.overallMonth);
    if (opts.month) params.set("month", opts.month);
    if (opts.dealerCode) params.set("dealer_code", opts.dealerCode);
    if (opts.detailState) params.set("detail_state", opts.detailState);
    if (opts.detailMonth) params.set("detail_month", opts.detailMonth);
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

/** Permanently deletes all stored PM data for a company. Irreversible. */
export async function deleteAllPmData(token: string, company?: string): Promise<{ company: string; deleted: boolean }> {
    const params = new URLSearchParams();
    if (company) params.set("company", company);
    const res = await fetch(`${API_BASE}/api/pm/data?${params}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    return handle(res);
}

export function pmPdfUrl(ticketNo: string): string {
    const safeName = ticketNo.replace(/\//g, "_");
    return `/pm-pdfs/${encodeURIComponent(safeName)}.pdf`;
}