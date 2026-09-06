import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQuarterlyDashboard } from "../services/api";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function QuarterlyAnalysis() {
    const [active, setActive] = useState("Q1");
    const { data, isLoading, isError } = useQuery({
        queryKey: ["quarterly"],
        queryFn: getQuarterlyDashboard,
    });

    if (isLoading) return <p className="p-6">Loading…</p>;
    if (isError || !data) return <p className="p-6">Failed to load dashboard data.</p>;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold">Quarterly Performance Overview</h1>
                <div className="flex gap-1">
                    {QUARTERS.map((q) => (
                        <button
                            key={q}
                            onClick={() => setActive(q)}
                            className="px-3 py-1.5 text-sm rounded-md border"
                            style={
                                active === q
                                    ? { background: "var(--color-accent-light)", color: "var(--color-accent)", borderColor: "var(--color-accent)" }
                                    : { borderColor: "#d1d5db", color: "#4b5563" }
                            }
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
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
                        {data.table.map((row) => (
                            <tr
                                key={row.quarter}
                                style={row.quarter === active ? { background: "var(--color-accent-light)" } : undefined}
                            >
                                <td className="p-3 font-medium">{row.quarter}</td>
                                <td className="p-3">{row.calls.toLocaleString()}</td>
                                <td className="p-3">{row.under_norm_pct}%</td>
                                <td className="p-3">{row.repeat}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}