import { useQuery } from "@tanstack/react-query";
import { getUtilizationDashboard } from "../services/api";

export default function EngineerUtilization() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["utilization"],
        queryFn: getUtilizationDashboard,
    });

    if (isLoading) return <p className="p-6">Loading…</p>;
    if (isError || !data) return <p className="p-6">Failed to load dashboard data.</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-1">Engineer Utilization</h1>
            <p className="text-sm text-gray-500 mb-6">
                Based on {data.totalWorkingDays} working days ({data.distinctMonths} month{data.distinctMonths > 1 ? "s" : ""} in this file, 26 working days each)
            </p>

            <h2 className="text-lg font-medium mb-2">Supervisor Overview</h2>
            <div className="bg-white rounded-xl border overflow-hidden mb-6">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <th className="text-left p-3 border border-gray-200">Supervisor</th>
                            <th className="text-left p-3 border border-gray-200">Engineers</th>
                            <th className="text-left p-3 border border-gray-200">Avg Utilization %</th>
                            <th className="text-left p-3 border border-gray-200">Avg Under-Norm %</th>
                            <th className="text-left p-3 border border-gray-200">Total Calls</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.supervisors.map((row) => (
                            <tr key={row.supervisor}>
                                <td className="p-3 border border-gray-200 font-medium">{row.supervisor}</td>
                                <td className="p-3 border border-gray-200">{row.num_engineers}</td>
                                <td className="p-3 border border-gray-200">{row.avg_utilization_pct}%</td>
                                <td className="p-3 border border-gray-200">{row.avg_under_norm_pct}%</td>
                                <td className="p-3 border border-gray-200">{row.total_calls}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2 className="text-lg font-medium mb-2">Engineer Detail</h2>
            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <th className="text-left p-3 border border-gray-200">Eng Code</th>
                            <th className="text-left p-3 border border-gray-200">Name</th>
                            <th className="text-left p-3 border border-gray-200">Supervisor</th>
                            <th className="text-left p-3 border border-gray-200">Total Calls</th>
                            <th className="text-left p-3 border border-gray-200">Days Quota Met</th>
                            <th className="text-left p-3 border border-gray-200">Utilization %</th>
                            <th className="text-left p-3 border border-gray-200">Under-Norm %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.engineers.map((row) => (
                            <tr key={row.eng_code}>
                                <td className="p-3 border border-gray-200">{row.eng_code}</td>
                                <td className="p-3 border border-gray-200">{row.employee_name}</td>
                                <td className="p-3 border border-gray-200">{row.supervisor}</td>
                                <td className="p-3 border border-gray-200">{row.total_calls}</td>
                                <td className="p-3 border border-gray-200">{row.days_quota_met}</td>
                                <td className="p-3 border border-gray-200">{row.utilization_pct}%</td>
                                <td className="p-3 border border-gray-200">{row.under_norm_pct}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}