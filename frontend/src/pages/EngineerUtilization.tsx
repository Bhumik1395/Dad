import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUtilizationDashboard, getFilterOptions } from "../services/api";
import { Search, ChevronDown, ChevronRight } from "lucide-react";

export default function EngineerUtilization() {
    const [customer, setCustomer] = useState("");

    const { data: filterOptions } = useQuery({
        queryKey: ["filterOptions"],
        queryFn: getFilterOptions,
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ["utilization", customer],
        queryFn: () => getUtilizationDashboard(customer || undefined),
    });

    const [supervisorSearch, setSupervisorSearch] = useState("");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const filteredSupervisors = useMemo(() => {
        if (!data) return [];
        const q = supervisorSearch.toLowerCase();
        return data.supervisors.filter((row) => row.supervisor.toLowerCase().includes(q));
    }, [data, supervisorSearch]);

    const engineersBySupervisor = useMemo(() => {
        if (!data) return {};
        const map: Record<string, typeof data.engineers> = {};
        for (const eng of data.engineers) {
            if (!map[eng.supervisor]) map[eng.supervisor] = [];
            map[eng.supervisor].push(eng);
        }
        return map;
    }, [data]);

    const toggleExpanded = (supervisor: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(supervisor)) next.delete(supervisor);
            else next.add(supervisor);
            return next;
        });
    };

    if (isLoading) return <p className="p-6">Loading…</p>;
    if (isError || !data) return <p className="p-6">Failed to load dashboard data.</p>;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-semibold">Engineer Utilization</h1>
                <select
                    className="border rounded-lg px-3 py-2 text-sm"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                >
                    <option value="">All Companies</option>
                    {filterOptions?.customers.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
            <p className="text-sm text-gray-500 mb-6">
                Based on {data.totalWorkingDays} working days ({data.distinctMonths} month{data.distinctMonths > 1 ? "s" : ""} in this file, 26 working days each)
                {customer && <> — filtered to <span className="font-medium">{customer}</span></>}
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

            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <th className="text-left p-3 border border-gray-200 w-8"></th>
                            <th className="text-left p-3 border border-gray-200">Supervisor</th>
                            <th className="text-left p-3 border border-gray-200">Engineers</th>
                            <th className="text-left p-3 border border-gray-200">Avg Utilization %</th>
                            <th className="text-left p-3 border border-gray-200">Avg Under-Norm %</th>
                            <th className="text-left p-3 border border-gray-200">Total Calls</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSupervisors.length === 0 && (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-400 border border-gray-200">No matching supervisors</td></tr>
                        )}
                        {filteredSupervisors.map((row) => {
                            const isOpen = expanded.has(row.supervisor);
                            const engineers = engineersBySupervisor[row.supervisor] || [];
                            return (
                                <>
                                    <tr
                                        key={row.supervisor}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => toggleExpanded(row.supervisor)}
                                    >
                                        <td className="p-3 border border-gray-200 text-gray-400">
                                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </td>
                                        <td className="p-3 border border-gray-200 font-medium">{row.supervisor}</td>
                                        <td className="p-3 border border-gray-200">{row.num_engineers}</td>
                                        <td className="p-3 border border-gray-200">{row.avg_utilization_pct}%</td>
                                        <td className="p-3 border border-gray-200">{row.avg_under_norm_pct}%</td>
                                        <td className="p-3 border border-gray-200">{row.total_calls}</td>
                                    </tr>
                                    {isOpen && (
                                        <tr key={`${row.supervisor}-detail`}>
                                            <td colSpan={6} className="border border-gray-200 p-0 bg-gray-50">
                                                <table className="w-full text-sm border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-100 text-gray-500 text-xs uppercase">
                                                            <th className="text-left p-2 pl-10 border border-gray-200">Eng Code</th>
                                                            <th className="text-left p-2 border border-gray-200">Name</th>
                                                            <th className="text-left p-2 border border-gray-200">Total Calls</th>
                                                            <th className="text-left p-2 border border-gray-200">Days Quota Met</th>
                                                            <th className="text-left p-2 border border-gray-200">Utilization %</th>
                                                            <th className="text-left p-2 border border-gray-200">Under-Norm %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white">
                                                        {engineers.map((eng) => (
                                                            <tr key={eng.eng_code}>
                                                                <td className="p-2 pl-10 border border-gray-200">{eng.eng_code}</td>
                                                                <td className="p-2 border border-gray-200">{eng.employee_name}</td>
                                                                <td className="p-2 border border-gray-200">{eng.total_calls}</td>
                                                                <td className="p-2 border border-gray-200">{eng.days_quota_met}</td>
                                                                <td className="p-2 border border-gray-200">{eng.utilization_pct}%</td>
                                                                <td className="p-2 border border-gray-200">{eng.under_norm_pct}%</td>
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
        </div>
    );
}