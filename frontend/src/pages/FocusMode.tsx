import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFocusDashboard, getFilterOptions } from "../services/api";
import { SimpleBarChart } from "../components/charts/SimpleBarChart";
import { RegionVisitTypeChart } from "../components/charts/RegionVisitTypeChart";
import { RepeatMachinesTable } from "../components/tables/RepeatMachinesTable";
import { useFocusFilter } from "../context/FocusFilterContext";
import { ChevronDown, ChevronRight } from "lucide-react";

function formatHoursOnly(hours: number | null): string {
    if (hours === null) return "—";
    return `${hours} hrs`;
}

export default function FocusMode() {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [page, setPage] = useState(1);
    const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
    const { setCustomer } = useFocusFilter();

    const { data: filterOptions } = useQuery({
        queryKey: ["filterOptions"],
        queryFn: getFilterOptions,
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ["focus", filters, page],
        queryFn: () => getFocusDashboard(filters, page, 50),
    });

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

    return (
        <div className="p-6">
            <div className="grid grid-cols-4 gap-3 mb-6">
                <select className="border rounded-lg px-3 py-2 text-sm" onChange={(e) => updateFilter("customer", e.target.value)}>
                    <option value="">All Customers</option>
                    {filterOptions?.customers.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm" onChange={(e) => updateFilter("state", e.target.value)}>
                    <option value="">All States</option>
                    {filterOptions?.states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm" onChange={(e) => updateFilter("machine", e.target.value)}>
                    <option value="">All Machines</option>
                    {filterOptions?.machines.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm" onChange={(e) => updateFilter("status", e.target.value)}>
                    <option value="">All Statuses</option>
                    {filterOptions?.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {isLoading && <p>Loading…</p>}
            {!isLoading && (isError || !data) && <p>Failed to load dashboard data.</p>}

            {!isLoading && data && (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <KpiCard label="Total machines" value={data.kpis.totalMachines} />
                        <KpiCard label="Total calls" value={data.kpis.totalCalls} />
                        <KpiCard label="Under-norm %" value={`${data.kpis.underNormPct}%`} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
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
                                                        <td colSpan={8} className="border border-gray-200 p-0">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                                                        <th className="text-left p-2 pl-10">State</th>
                                                                        <th className="text-left p-2">Total Calls</th>
                                                                        <th className="text-left p-2">Repeat Calls</th>
                                                                        <th className="text-left p-2">Under-Norm</th>
                                                                        <th className="text-left p-2">Under-Norm %</th>
                                                                        <th className="text-left p-2">Over-Norm</th>
                                                                        <th className="text-left p-2">Over-Norm %</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {region.states.map((s, i) => (
                                                                        <tr key={s.state} className="border-t">
                                                                            <td className="p-2 pl-10"><span className="text-gray-400 mr-2">#{i + 1}</span>{s.state}</td>
                                                                            <td className="p-2">{s.total_calls}</td>
                                                                            <td className="p-2">{s.repeat_calls}</td>
                                                                            <td className="p-2">{s.under_norm_calls}</td>
                                                                            <td className="p-2">{s.under_norm_pct}%</td>
                                                                            <td className="p-2">{s.over_norm_calls}</td>
                                                                            <td className="p-2">{s.over_norm_pct}%</td>
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