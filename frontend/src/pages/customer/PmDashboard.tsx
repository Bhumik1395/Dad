import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getPmDashboard, getPmFilterOptions } from "../../services/pmApi";
import { useAuth } from "../../auth/AuthContext";
import { PmMonthlyTrendChart } from "../../components/charts/PmMonthlyTrendChart";

function formatHoursOnly(hours: number | null): string {
    if (hours === null) return "—";
    return `${hours} hrs`;
}

export default function PmDashboard() {
    const { token, roles, company: myCompany } = useAuth();
    const [state, setState] = useState("");
    const [page, setPage] = useState(1);
    const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

    // corob_employee viewing this page needs a ?company= — customers are
    // always scoped to their own company server-side regardless of this.
    const [employeeCompany, setEmployeeCompany] = useState(myCompany ?? "");
    const isEmployee = roles.includes("corob_employee");
    const activeCompany = isEmployee ? employeeCompany : myCompany ?? undefined;

    const { data: filterOptions } = useQuery({
        queryKey: ["pmFilterOptions", activeCompany],
        queryFn: () => getPmFilterOptions(token!, activeCompany),
        enabled: !!token && !!activeCompany,
    });

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["pmDashboard", activeCompany, state, page],
        queryFn: () => getPmDashboard(token!, { company: activeCompany, state: state || undefined, page }),
        enabled: !!token && !!activeCompany,
    });

    const toggleRegion = (region: string) => {
        setExpandedRegions((prev) => {
            const next = new Set(prev);
            if (next.has(region)) next.delete(region); else next.add(region);
            return next;
        });
    };

    return (
        <div className="p-6">
            {isEmployee && (
                <div className="mb-4">
                    <input
                        className="border rounded-lg px-3 py-2 text-sm w-72"
                        placeholder="Company (e.g. Asian Paints Ltd)"
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
                        <KpiCard label="Total calls" value={data.kpis.totalCalls} />
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
                                        <th className="text-left p-3 border border-gray-200">Total Calls</th>
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
                                                    <td className="p-3 border border-gray-200">{region.total_calls}</td>
                                                    <td className="p-3 border border-gray-200">{region.closed_calls}</td>
                                                    <td className="p-3 border border-gray-200">{region.open_calls}</td>
                                                    <td className="p-3 border border-gray-200">{region.closure_rate_pct}%</td>
                                                </tr>
                                                {isOpen && (
                                                    <tr key={`${region.region}-detail`}>
                                                        <td colSpan={6} className="border border-gray-200 p-0 bg-gray-50">
                                                            <table className="w-full text-sm border-collapse">
                                                                <thead>
                                                                    <tr className="bg-gray-100 text-gray-500 text-xs uppercase">
                                                                        <th className="text-left p-2 pl-10 border border-gray-200">State</th>
                                                                        <th className="text-left p-2 border border-gray-200">Total Calls</th>
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
                                                                            <td className="p-2 border border-gray-200">{s.total_calls}</td>
                                                                            <td className="p-2 border border-gray-200">{s.closed_calls}</td>
                                                                            <td className="p-2 border border-gray-200">{s.open_calls}</td>
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
                        <h3 className="text-sm font-medium mb-2">Month-on-Month Trend</h3>
                        <PmMonthlyTrendChart data={data.monthlyTrend} />
                    </div>

                    <div className="bg-white rounded-xl border p-4 mb-4">
                        <h3 className="text-sm font-medium mb-2">Customer Satisfaction</h3>
                        <div className="flex gap-3 flex-wrap">
                            {data.satisfactionBreakdown.map((s) => (
                                <div key={s.satisfaction_status} className="border rounded-lg px-4 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
                                    <span className="text-gray-500">{s.satisfaction_status || "Not Recorded"}:</span>{" "}
                                    <span className="font-medium">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border overflow-hidden mb-4">
                        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                            <h3 className="text-sm font-medium">Feedback</h3>
                            <span className="text-xs text-gray-400">{data.feedbackTable.totalRows} total</span>
                        </div>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <th className="text-left p-3 border border-gray-200">Ticket</th>
                                    <th className="text-left p-3 border border-gray-200">Date</th>
                                    <th className="text-left p-3 border border-gray-200">State</th>
                                    <th className="text-left p-3 border border-gray-200">Satisfaction</th>
                                    <th className="text-left p-3 border border-gray-200">Feedback</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.feedbackTable.rows.map((row) => (
                                    <tr key={row.ticket_no}>
                                        <td className="p-3 border border-gray-200">{row.ticket_no}</td>
                                        <td className="p-3 border border-gray-200">{row.call_date}</td>
                                        <td className="p-3 border border-gray-200">{row.state}</td>
                                        <td className="p-3 border border-gray-200">{row.satisfaction_status}</td>
                                        <td className="p-3 border border-gray-200">{row.feedback}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">Previous</button>
                            <span>Page {data.feedbackTable.page}</span>
                            <button
                                disabled={page * data.feedbackTable.pageSize >= data.feedbackTable.totalRows}
                                onClick={() => setPage((p) => p + 1)}
                                className="disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
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
