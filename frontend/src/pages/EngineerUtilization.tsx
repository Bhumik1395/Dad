import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUtilizationDashboard } from "../services/api";
import { Search } from "lucide-react";

export default function EngineerUtilization() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["utilization"],
        queryFn: getUtilizationDashboard,
    });

    const [supervisorSearch, setSupervisorSearch] = useState("");
    const [engineerSearch, setEngineerSearch] = useState("");

    const filteredSupervisors = useMemo(() => {
        if (!data) return [];
        const q = supervisorSearch.toLowerCase();
        return data.supervisors.filter((row) => row.supervisor.toLowerCase().includes(q));
    }, [data, supervisorSearch]);

    const filteredEngineers = useMemo(() => {
        if (!data) return [];
        const q = engineerSearch.toLowerCase();
        return data.engineers.filter(
            (row) =>
                row.eng_code.toLowerCase().includes(q) ||
                row.employee_name.toLowerCase().includes(q) ||
                row.supervisor.toLowerCase().includes(q)
        );
    }, [data, engineerSearch]);

    if (isLoading) return <p className="p-6">Loading…</p>;
    if (isError || !data) return <p className="p-6">Failed to load dashboard data.</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-1">Engineer Utilization</h1>
            <p className="text-sm text-gray-500 mb-6">
                Based on {data.totalWorkingDays} working days ({data.distinctMonths} month{data.distinctMonths > 1 ? "s" : ""} in this file, 26 working days each)
            </p>

            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium">Supervisor Overview</h2>
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search supervisor…"
                        value={supervisorSearch}
                        onChange={(e) => setSupervisorSearch(e.target.value)}
                        className="border rounded-lg pl-8 pr-3 py-1.5 text-sm w-56"
                    />
                </div>
            </div>
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
                        {filteredSupervisors.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-400 border border-gray-200">No matching supervisors</td></tr>
                        )}
                        {filteredSupervisors.map((row) => (
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

            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium">Engineer Detail</h2>
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search eng code, name, or supervisor…"
                        value={engineerSearch}
                        onChange={(e) => setEngineerSearch(e.target.value)}
                        className="border rounded-lg pl-8 pr-3 py-1.5 text-sm w-64"
                    />
                </div>
            </div>
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
                        {filteredEngineers.length === 0 && (
                            <tr><td colSpan={7} className="p-4 text-center text-gray-400 border border-gray-200">No matching engineers</td></tr>
                        )}
                        {filteredEngineers.map((row) => (
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