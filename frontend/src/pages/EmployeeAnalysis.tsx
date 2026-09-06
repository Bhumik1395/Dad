import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeDashboard } from "../services/api";
import { SimpleBarChart } from "../components/charts/SimpleBarChart";

export default function EmployeeAnalysis() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useQuery({
        queryKey: ["employees", page],
        queryFn: () => getEmployeeDashboard(page, 50),
    });

    if (isLoading) return <p className="p-6">Loading…</p>;
    if (isError || !data) return <p className="p-6">Failed to load dashboard data.</p>;

    const topByCalls = [...data.rows]
        .sort((a, b) => b.total_calls - a.total_calls)
        .slice(0, 10)
        .map((r) => ({ name: r.employee_name || r.eng_code, calls: r.total_calls }));

    const topByUnderNorm = [...data.rows]
        .sort((a, b) => b.under_norm_pct - a.under_norm_pct)
        .slice(0, 10)
        .map((r) => ({ name: r.employee_name || r.eng_code, pct: r.under_norm_pct }));

    const totalPages = Math.max(1, Math.ceil(data.totalRows / data.pageSize));

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Employee Performance</h1>

            <div className="bg-white rounded-xl border p-4 mb-4">
                <h3 className="text-sm font-medium mb-2">Calls per Employee</h3>
                <SimpleBarChart data={topByCalls} xKey="name" yKey="calls" />
            </div>

            <div className="bg-white rounded-xl border p-4 mb-4">
                <h3 className="text-sm font-medium mb-2">Under-Norm % per Employee</h3>
                <SimpleBarChart data={topByUnderNorm} xKey="name" yKey="pct" />
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <th className="text-left p-3">Eng Code</th>
                            <th className="text-left p-3">Name</th>
                            <th className="text-left p-3">Total Calls</th>
                            <th className="text-left p-3">Under-Norm Calls</th>
                            <th className="text-left p-3">Under-Norm %</th>
                            <th className="text-left p-3">Physical</th>
                            <th className="text-left p-3">Online</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row) => (
                            <tr key={row.eng_code} className="border-t">
                                <td className="p-3">{row.eng_code}</td>
                                <td className="p-3">{row.employee_name}</td>
                                <td className="p-3">{row.total_calls}</td>
                                <td className="p-3">{row.under_norm_calls}</td>
                                <td className="p-3">{row.under_norm_pct}%</td>
                                <td className="p-3">{row.physical}</td>
                                <td className="p-3">{row.online}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex items-center justify-between p-3 border-t text-sm text-gray-500">
                    <span>Page {page} of {totalPages} ({data.totalRows.toLocaleString()} total)</span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded-md disabled:opacity-40">Prev</button>
                        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded-md disabled:opacity-40">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}