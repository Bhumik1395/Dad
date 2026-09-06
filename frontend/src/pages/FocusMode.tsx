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

    if (isLoading) return <p className="p-6">Loading…</p>;
    if (isError || !data) return <p className="p-6">Failed to load dashboard data.</p>;

    return (
        <div className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
                <KpiCard label="Total machines" value={data.kpis.totalMachines} />
                <KpiCard label="Total calls" value={data.kpis.totalCalls} />
                <KpiCard label="Under-norm %" value={`${data.kpis.underNormPct}%`} />
                <KpiCard label="Repeat calls" value={data.kpis.repeatCalls} />
            </div>
            <div className="bg-white rounded-xl border p-4">
                <VisitTypeDonut data={data.charts.visitType} />
            </div>
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