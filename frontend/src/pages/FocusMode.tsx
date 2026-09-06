import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFocusDashboard, getFilterOptions } from "../services/api";
import { VisitTypeDonut } from "../components/charts/VisitTypeDonut";
import { SimpleBarChart } from "../components/charts/SimpleBarChart";
import { SimpleLineChart } from "../components/charts/SimpleLineChart";
import { CallDetailTable } from "../components/tables/CallDetailTable";

export default function FocusMode() {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [page, setPage] = useState(1);

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
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <KpiCard label="Total machines" value={data.kpis.totalMachines} />
                        <KpiCard label="Total calls" value={data.kpis.totalCalls} />
                        <KpiCard label="Under-norm %" value={`${data.kpis.underNormPct}%`} />
                        <KpiCard label="Repeat calls" value={data.kpis.repeatCalls} />
                    </div>

                    {!filters.state && data.stateBreakdown.length > 0 && (
                        <div className="bg-white rounded-xl border overflow-hidden mb-4">
                            <div className="px-4 pt-3">
                                <h3 className="text-sm font-medium">State-wise Breakdown</h3>
                            </div>
                            <table className="w-full text-sm mt-2">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                        <th className="text-left p-3">State</th>
                                        <th className="text-left p-3">Total Calls</th>
                                        <th className="text-left p-3">Repeat Calls</th>
                                        <th className="text-left p-3">Under-Norm</th>
                                        <th className="text-left p-3">Under-Norm %</th>
                                        <th className="text-left p-3">Over-Norm</th>
                                        <th className="text-left p-3">Over-Norm %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.stateBreakdown.map((row) => (
                                        <tr key={row.state} className="border-t">
                                            <td className="p-3 font-medium">{row.state}</td>
                                            <td className="p-3">{row.total_calls}</td>
                                            <td className="p-3">{row.repeat_calls}</td>
                                            <td className="p-3">{row.under_norm_calls}</td>
                                            <td className="p-3">{row.under_norm_pct}%</td>
                                            <td className="p-3">{row.over_norm_calls}</td>
                                            <td className="p-3">{row.over_norm_pct}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-xl border p-4">
                            <h3 className="text-sm font-medium mb-2">Visit Type</h3>
                            <VisitTypeDonut data={data.charts.visitType} />
                        </div>
                        <div className="bg-white rounded-xl border p-4">
                            <h3 className="text-sm font-medium mb-2">Status Breakdown</h3>
                            <SimpleBarChart data={data.charts.statusBreakdown} xKey="name" yKey="value" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border p-4 mb-4">
                        <h3 className="text-sm font-medium mb-2">Calls Over Time</h3>
                        <SimpleLineChart data={data.charts.callsOverTime} xKey="month" yKey="calls" />
                    </div>

                    <div className="bg-white rounded-xl border p-4 mb-4">
                        <h3 className="text-sm font-medium mb-2">Top Repeat Machines</h3>
                        <SimpleBarChart data={data.charts.repeatMachines} xKey="machine" yKey="calls" />
                    </div>

                    <CallDetailTable
                        rows={data.table.rows}
                        page={data.table.page}
                        pageSize={data.table.pageSize}
                        totalRows={data.table.totalRows}
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