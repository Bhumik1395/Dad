import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getFocusDashboard, getFilterOptions, getQuarterlyDashboard } from "../services/api";
import { SimpleBarChart } from "../components/charts/SimpleBarChart";
import { RegionVisitTypeChart } from "../components/charts/RegionVisitTypeChart";
import { RepeatMachinesTable } from "../components/tables/RepeatMachinesTable";
import { useFocusFilter } from "../context/FocusFilterContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MonthlyTrendChart } from "../components/charts/MonthlyTrendChart";
import { FocusModeSkeleton } from "../components/skeletons/Focusmodeskeleton";

function formatHoursOnly(hours: number | null): string {
    if (hours === null) return "—";
    return `${hours} hrs`;
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function FocusMode() {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [page, setPage] = useState(1);
    const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
    const { setCustomer } = useFocusFilter();
    const [activeQuarter, setActiveQuarter] = useState("Q1");

    const { data: filterOptions } = useQuery({
        queryKey: ["filterOptions"],
        queryFn: getFilterOptions,
    });

    const { data, isLoading, isFetching, isError } = useQuery({
        queryKey: ["focus", filters, page],
        queryFn: () => getFocusDashboard(filters, page, 50),
        placeholderData: keepPreviousData,
    });

    const {
        data: quarterlyData,
        isLoading: quarterlyLoading,
    } = useQuery({
        queryKey: ["quarterly"],
        queryFn: getQuarterlyDashboard,
    });

    const loading = isLoading || quarterlyLoading;

    const updateFilter = (key: string, value: string) => {
        setPage(1);
        setFilters((prev) => {
            const next = { ...prev };
            if (value) next[key] = value;
            else delete next[key];
            return next;
        });
        if (key === "customer") setCustomer(value);
    };

    const toggleRegion = (region: string) => {
        setExpandedRegions((prev) => {
            const next = new Set(prev);
            if (next.has(region)) next.delete(region);
            else next.add(region);
            return next;
        });
    };

    if (loading) return <FocusModeSkeleton />;

    return (
        <div className="p-6">
            <div className="grid grid-cols-3 gap-3 mb-2">
                <select className="border rounded-lg px-3 py-2 text-sm" onChange={(e) => updateFilter("customer", e.target.value)}>
                    <option value="">All Customers</option>
                    {filterOptions?.customers.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm" onChange={(e) => updateFilter("state", e.target.value)}>
                    <option value="">All States</option>
                    {filterOptions?.states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm" onChange={(e) => updateFilter("service_type", e.target.value)}>
                    <option value="">All Service Types</option>
                    <option value="Service">Service</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div className="h-5 mb-4">
                {isFetching && !isLoading && <span className="text-xs text-gray-400">Updating…</span>}
            </div>

            {!isLoading && (isError || !data) && <p>Failed to load dashboard data.</p>}

            {!isLoading && data && (
                <>
                    <div className="grid grid-cols-6 gap-4 mb-6">
                        <KpiCard label="Total machines" value={data.kpis.totalMachines} />
                        <KpiCard label="Total calls" value={data.kpis.totalCalls} />
                        <KpiCard label="Under-norm %" value={`${data.kpis.underNormPct}%`} />
                        <KpiCard label="Repeat calls" value={data.kpis.repeatCalls} />
                        <KpiCard label="Avg local call closure" value={formatHoursOnly(data.kpis.avgLocalClosureHours)} />
                        <KpiCard label="Avg upcountry/remote closure" value={formatHoursOnly(data.kpis.avgUpcountryClosureHours)} />
                    </div>

                    {!filters.state && data.regionBreakdown.length > 0 && (
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
                                        <th className="text-left p-3 border border-gray-200">Repeat Calls</th>
                                        <th className="text-left p-3 border border-gray-200">Under-Norm</th>
                                        <th className="text-left p-3 border border-gray-200">Under-Norm %</th>
                                        <th className="text-left p-3 border border-gray-200">Over-Norm</th>
                                        <th className="text-left p-3 border border-gray-200">Over-Norm %</th>
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
                                                    <td className="p-3 border border-gray-200">{region.repeat_calls}</td>
                                                    <td className="p-3 border border-gray-200">{region.under_norm_calls}</td>
                                                    <td className="p-3 border border-gray-200">{region.under_norm_pct}%</td>
                                                    <td className="p-3 border border-gray-200">{region.over_norm_calls}</td>
                                                    <td className="p-3 border border-gray-200">{region.over_norm_pct}%</td>
                                                </tr>
                                                {isOpen && (
                                                    <tr key={`${region.region}-detail`}>
                                                        <td colSpan={8} className="border border-gray-200 p-0 bg-gray-50">
                                                            <table className="w-full text-sm border-collapse">
                                                                <thead>
                                                                    <tr className="bg-gray-100 text-gray-500 text-xs uppercase">
                                                                        <th className="text-left p-2 pl-10 border border-gray-200">State</th>
                                                                        <th className="text-left p-2 border border-gray-200">Total Calls</th>
                                                                        <th className="text-left p-2 border border-gray-200">Repeat Calls</th>
                                                                        <th className="text-left p-2 border border-gray-200">Under-Norm</th>
                                                                        <th className="text-left p-2 border border-gray-200">Under-Norm %</th>
                                                                        <th className="text-left p-2 border border-gray-200">Over-Norm</th>
                                                                        <th className="text-left p-2 border border-gray-200">Over-Norm %</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white">
                                                                    {region.states.map((s, i) => (
                                                                        <tr key={s.state}>
                                                                            <td className="p-2 pl-10 border border-gray-200">
                                                                                <span className="text-gray-400 mr-2">#{i + 1}</span>{s.state}
                                                                            </td>
                                                                            <td className="p-2 border border-gray-200">{s.total_calls}</td>
                                                                            <td className="p-2 border border-gray-200">{s.repeat_calls}</td>
                                                                            <td className="p-2 border border-gray-200">{s.under_norm_calls}</td>
                                                                            <td className="p-2 border border-gray-200">{s.under_norm_pct}%</td>
                                                                            <td className="p-2 border border-gray-200">{s.over_norm_calls}</td>
                                                                            <td className="p-2 border border-gray-200">{s.over_norm_pct}%</td>
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
                        <h3 className="text-sm font-medium mb-2">Visit Type by Region</h3>
                        <RegionVisitTypeChart data={data.charts.regionVisitType} />
                    </div>

                    <div className="bg-white rounded-xl border p-4 mb-4">
                        <h3 className="text-sm font-medium mb-2">Month-on-Month Trend</h3>
                        <MonthlyTrendChart data={data.monthlyTrend} />
                    </div>

                    <div className="bg-white rounded-xl border p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium">Quarterly Analysis</h3>
                            <div className="flex gap-1">
                                {QUARTERS.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setActiveQuarter(q)}
                                        className="px-3 py-1.5 text-sm rounded-md border"
                                        style={
                                            activeQuarter === q
                                                ? { background: "var(--color-accent-light)", color: "var(--color-accent)", borderColor: "var(--color-accent)" }
                                                : { borderColor: "#d1d5db", color: "#4b5563" }
                                        }
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {quarterlyData ? (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                        <th className="text-left p-3">Quarter</th>
                                        <th className="text-left p-3">Total Calls</th>
                                        <th className="text-left p-3">Under Norm %</th>
                                        <th className="text-left p-3">Repeat Calls</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quarterlyData.table.map((row) => (
                                        <tr
                                            key={row.quarter}
                                            className="border-t"
                                            style={row.quarter === activeQuarter ? { background: "var(--color-accent-light)" } : undefined}
                                        >
                                            <td className="p-3 font-medium">{row.quarter}</td>
                                            <td className="p-3">{row.calls.toLocaleString()}</td>
                                            <td className="p-3">{row.under_norm_pct}%</td>
                                            <td className="p-3">{row.repeat}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-sm text-gray-400">Quarterly data unavailable.</p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border p-4 mb-4">
                        <h3 className="text-sm font-medium mb-2">Top Repeat Machines</h3>
                        <SimpleBarChart data={data.charts.repeatMachines} xKey="machine" yKey="calls" />
                    </div>

                    <RepeatMachinesTable
                        rows={data.repeatMachinesTable.rows}
                        page={data.repeatMachinesTable.page}
                        pageSize={data.repeatMachinesTable.pageSize}
                        totalRows={data.repeatMachinesTable.totalRows}
                        onPageChange={setPage}
                    />
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