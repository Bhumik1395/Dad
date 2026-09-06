import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFocusDashboard } from "../services/api";
import { VisitTypeDonut } from "../components/charts/VisitTypeDonut";

export default function FocusMode() {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const { data, isLoading, isError } = useQuery({
        queryKey: ["focus", filters],
        queryFn: () => getFocusDashboard(filters),
    });

    const updateFilter = (key: string, value: string) => {
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
                <input
                    type="text"
                    placeholder="Customer"
                    className="border rounded-lg px-3 py-2 text-sm"
                    onChange={(e) => updateFilter("customer", e.target.value)}
                />
                <input
                    type="text"
                    placeholder="State"
                    className="border rounded-lg px-3 py-2 text-sm"
                    onChange={(e) => updateFilter("state", e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Machine No."
                    className="border rounded-lg px-3 py-2 text-sm"
                    onChange={(e) => updateFilter("machine", e.target.value)}
                />
                <select
                    className="border rounded-lg px-3 py-2 text-sm"
                    onChange={(e) => updateFilter("status", e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="Undernorm">Undernorm</option>
                    <option value="Overnorm">Overnorm</option>
                    <option value="Open">Open</option>
                    <option value="Short Closed">Short Closed</option>
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
                    <div className="bg-white rounded-xl border p-4">
                        <VisitTypeDonut data={data.charts.visitType} />
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