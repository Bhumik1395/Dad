import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FileText, FileX, Search } from "lucide-react";
import { getPmDashboard, getPmFilterOptions, pmPdfUrl } from "../../services/pmApi";
import { useAuth } from "../../auth/AuthContext";
import { PmMonthlyTrendChart } from "../../components/charts/PmMonthlyTrendChart";
import { PmWeeklyTrendChart } from "../../components/charts/PmWeeklyTrendChart";
import { PdfViewerModal } from "../../components/PdfViewerModal";

function formatHoursOnly(hours: number | null): string {
    if (hours === null) return "—";
    return `${hours} hrs`;
}

export default function PmDashboard() {
    const { token, roles, company: myCompany } = useAuth();
    const [state, setState] = useState("");
    const [page, setPage] = useState(1);
    const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
    const [openPdf, setOpenPdf] = useState<{ url: string; title: string } | null>(null);
    const [pdfMissingTicket, setPdfMissingTicket] = useState<string | null>(null);

    const [weeklyMonth, setWeeklyMonth] = useState<string | undefined>(undefined);

    const [dealerSearchInput, setDealerSearchInput] = useState("");
    const [dealerSearch, setDealerSearch] = useState("");
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            setDealerSearch(dealerSearchInput.trim());
        }, 300);
        return () => clearTimeout(t);
    }, [dealerSearchInput]);

    const [employeeCompany, setEmployeeCompany] = useState(myCompany ?? "");
    const isEmployee = roles.includes("corob_employee");
    const activeCompany = isEmployee ? employeeCompany : myCompany ?? undefined;

    const { data: filterOptions } = useQuery({
        queryKey: ["pmFilterOptions", activeCompany],
        queryFn: () => getPmFilterOptions(token!, activeCompany),
        enabled: !!token && !!activeCompany,
    });

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["pmDashboard", activeCompany, state, weeklyMonth, dealerSearch, page],
        queryFn: () => getPmDashboard(token!, {
            company: activeCompany,
            state: state || undefined,
            month: weeklyMonth,
            dealerCode: dealerSearch || undefined,
            page,
        }),
        enabled: !!token && !!activeCompany,
    });

    const toggleRegion = (region: string) => {
        setExpandedRegions((prev) => {
            const next = new Set(prev);
            if (next.has(region)) next.delete(region); else next.add(region);
            return next;
        });
    };

    const handleOpenPdf = async (ticketNo: string) => {
        setPdfMissingTicket(null);
        const url = pmPdfUrl(ticketNo);
        try {
            const res = await fetch(url, { method: "HEAD" });
            if (res.ok) {
                setOpenPdf({ url, title: `PM Report — ${ticketNo}` });
            } else {
                setPdfMissingTicket(ticketNo);
            }
        } catch {
            setPdfMissingTicket(ticketNo);
        }
    };

    return (
        <div className="p-6">
            {isEmployee && (
                <div className="mb-4">
                    <input
                        className="border rounded-lg px-3 py-2 text-sm w-72"
                        placeholder="Company (e.g. AKZO Nobel Paints)"
                        value={employeeCompany}
                        onChange={(e) => setEmployeeCompany(e.target.value)}
                    />
                </div>
            )}

            {!activeCompany && (
                <p className="text-sm text-gray-500">
                    {isEmployee ? "Enter a company to view its PM dashboard." : "No company assigned to this account."}
                </p>
            )}

            {activeCompany && (
                <div className="grid grid-cols-4 gap-3 mb-6">
                    <select
                        className="border rounded-lg px-3 py-2 text-sm"
                        value={state}
                        onChange={(e) => { setPage(1); setState(e.target.value); }}
                    >
                        <option value="">All States</option>
                        {filterOptions?.states.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            )}

            {activeCompany && isLoading && <p>Loading…</p>}
            {activeCompany && !isLoading && isError && (
                <p className="text-sm text-red-600">
                    {(error as any)?.message ?? "No PM data uploaded yet for this company."}
                </p>
            )}

            {activeCompany && !isLoading && data && (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <KpiCard label="Total PMs" value={data.kpis.totalPms} />
                        <KpiCard label="Closure rate" value={`${data.kpis.closureRatePct}%`} />
                        <KpiCard label="Avg local closure" value={formatHoursOnly(data.kpis.avgLocalClosureHours)} />
                    </div>

                    {!state && data.regionBreakdown.length > 0 && (
                        <div className="bg-white rounded-xl border overflow-hidden mb-4">
                            <div className="px-4 pt-3 pb-2">
                                <h3 className="text-sm font-medium">Region-wise Breakdown</h3>
                            </div>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                        <th className="text-left p-3 border border-gray-200 w-8"></th>
                                        <th className="text-left p-3 border border-gray-200">Region</th>
                                        <th className="text-left p-3 border border-gray-200">Total PMs</th>
                                        <th className="text-left p-3 border border-gray-200">Closed</th>
                                        <th className="text-left p-3 border border-gray-200">Open</th>
                                        <th className="text-left p-3 border border-gray-200">Closure Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.regionBreakdown.map((region) => {
                                        const isOpen = expandedRegions.has(region.region);
                                        return (
                                            <>
                                                <tr key={region.region} className="cursor-pointer hover:bg-gray-50" onClick={() => toggleRegion(region.region)}>
                                                    <td className="p-3 border border-gray-200 text-gray-400">
                                                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </td>
                                                    <td className="p-3 border border-gray-200 font-medium">{region.region}</td>
                                                    <td className="p-3 border border-gray-200">{region.total_pms}</td>
                                                    <td className="p-3 border border-gray-200">{region.closed_pms}</td>
                                                    <td className="p-3 border border-gray-200">{region.open_pms}</td>
                                                    <td className="p-3 border border-gray-200">{region.closure_rate_pct}%</td>
                                                </tr>
                                                {isOpen && (
                                                    <tr key={`${region.region}-detail`}>
                                                        <td colSpan={6} className="border border-gray-200 p-0 bg-gray-50">
                                                            <table className="w-full text-sm border-collapse">
                                                                <thead>
                                                                    <tr className="bg-gray-100 text-gray-500 text-xs uppercase">
                                                                        <th className="text-left p-2 pl-10 border border-gray-200">State</th>
                                                                        <th className="text-left p-2 border border-gray-200">Total PMs</th>
                                                                        <th className="text-left p-2 border border-gray-200">Closed</th>
                                                                        <th className="text-left p-2 border border-gray-200">Open</th>
                                                                        <th className="text-left p-2 border border-gray-200">Closure Rate</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white">
                                                                    {region.states.map((s, i) => (
                                                                        <tr key={s.state}>
                                                                            <td className="p-2 pl-10 border border-gray-200">
                                                                                <span className="text-gray-400 mr-2">#{i + 1}</span>{s.state}
                                                                            </td>
                                                                            <td className="p-2 border border-gray-200">{s.total_pms}</td>
                                                                            <td className="p-2 border border-gray-200">{s.closed_pms}</td>
                                                                            <td className="p-2 border border-gray-200">{s.open_pms}</td>
                                                                            <td className="p-2 border border-gray-200">{s.closure_rate_pct}%</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-sm font-medium">Weekly Analysis</h3>
                                <p className="text-xs text-gray-500">New PMs completed per week</p>
                            </div>
                            <select
                                className="border rounded-lg px-3 py-1.5 text-sm"
                                value={weeklyMonth ?? data.weeklyTrendMonth ?? ""}
                                onChange={(e) => setWeeklyMonth(e.target.value || undefined)}
                            >
                                {data.availableMonths.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <PmWeeklyTrendChart data={data.weeklyTrend} />
                    </div>

                    <div className="bg-white rounded-xl border p-4 mb-4">
                        <h3 className="text-sm font-medium mb-2">Monthly Analysis</h3>
                        <PmMonthlyTrendChart data={data.monthlyTrend} />
                    </div>

                    <div className="bg-white rounded-xl border overflow-hidden mb-4">
                        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-medium shrink-0">PM Detail</h3>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={dealerSearchInput}
                                        onChange={(e) => setDealerSearchInput(e.target.value)}
                                        placeholder="Search dealer code…"
                                        className="border rounded-lg pl-8 pr-3 py-1.5 text-sm w-56"
                                        style={{ borderColor: "var(--color-border)" }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 shrink-0">{data.pmDetailTable.totalRows} total</span>
                            </div>
                        </div>

                        {pdfMissingTicket && (
                            <div className="mx-4 mb-2 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs">
                                <FileX size={14} className="shrink-0" />
                                No PDF uploaded yet for ticket {pdfMissingTicket}.
                            </div>
                        )}

                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <th className="text-left p-3 border border-gray-200">Ticket No</th>
                                    <th className="text-left p-3 border border-gray-200">Dealer Code</th>
                                    <th className="text-left p-3 border border-gray-200">Dealer Name</th>
                                    <th className="text-left p-3 border border-gray-200">Date</th>
                                    <th className="text-left p-3 border border-gray-200">Resolution Remark</th>
                                    <th className="text-left p-3 border border-gray-200">PDF</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.pmDetailTable.rows.map((row) => (
                                    <tr key={row.ticket_no}>
                                        <td className="p-3 border border-gray-200">{row.ticket_no}</td>
                                        <td className="p-3 border border-gray-200">{row.dealer_code}</td>
                                        <td className="p-3 border border-gray-200">{row.dealer_name}</td>
                                        <td className="p-3 border border-gray-200">{row.call_date}</td>
                                        <td className="p-3 border border-gray-200">{row.remarks}</td>
                                        <td className="p-3 border border-gray-200">
                                            <button
                                                onClick={() => handleOpenPdf(row.ticket_no)}
                                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                                                style={{ borderColor: "var(--color-border)" }}
                                            >
                                                <FileText size={12} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">Previous</button>
                            <span>Page {data.pmDetailTable.page}</span>
                            <button
                                disabled={page * data.pmDetailTable.pageSize >= data.pmDetailTable.totalRows}
                                onClick={() => setPage((p) => p + 1)}
                                className="disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}

            {openPdf && (
                <PdfViewerModal url={openPdf.url} title={openPdf.title} onClose={() => setOpenPdf(null)} />
            )}
        </div>
    );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
    );
}
