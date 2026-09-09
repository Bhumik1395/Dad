import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { RepeatMachineRow } from "../../services/api";

export function RepeatMachinesTable({
    rows, page, pageSize, totalRows, onPageChange,
}: {
    rows: RepeatMachineRow[];
    page: number;
    pageSize: number;
    totalRows: number;
    onPageChange: (page: number) => void;
}) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [jumpValue, setJumpValue] = useState(String(page));
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

    useEffect(() => {
        setJumpValue(String(page));
    }, [page]);

    const toggle = (machine: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(machine)) next.delete(machine);
            else next.add(machine);
            return next;
        });
    };

    const handleJump = () => {
        const n = parseInt(jumpValue, 10);
        if (!isNaN(n) && n >= 1 && n <= totalPages) {
            onPageChange(n);
        } else {
            setJumpValue(String(page));
        }
    };

    return (
        <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 pt-3 pb-2">
                <h3 className="text-sm font-medium">Repeat Machines ({totalRows.toLocaleString()})</h3>
            </div>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <th className="text-left p-3 border border-gray-200 w-8"></th>
                        <th className="text-left p-3 border border-gray-200">Machine No.</th>
                        <th className="text-left p-3 border border-gray-200">Repeat Calls</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 && (
                        <tr><td colSpan={3} className="p-4 text-center text-gray-400 border border-gray-200">No repeat machines on this page</td></tr>
                    )}
                    {rows.map((row) => {
                        const isOpen = expanded.has(row.machine_no);
                        return (
                            <>
                                <tr
                                    key={row.machine_no}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => toggle(row.machine_no)}
                                >
                                    <td className="p-3 border border-gray-200 text-gray-400">
                                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </td>
                                    <td className="p-3 border border-gray-200 font-medium">{row.machine_no}</td>
                                    <td className="p-3 border border-gray-200">{row.repeat_count}</td>
                                </tr>
                                {isOpen && (
                                    <tr key={`${row.machine_no}-detail`}>
                                        <td colSpan={3} className="border border-gray-200 p-0 bg-gray-50">
                                            <table className="w-full text-sm table-fixed border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-100 text-gray-500 text-xs uppercase">
                                                        <th className="text-left p-2 pl-10 border border-gray-200 w-40">Call Date</th>
                                                        <th className="text-left p-2 border border-gray-200 w-32">Customer</th>
                                                        <th className="text-left p-2 border border-gray-200 w-28">State</th>
                                                        <th className="text-left p-2 border border-gray-200 w-24">Status</th>
                                                        <th className="text-left p-2 border border-gray-200 w-24">Visit Type</th>
                                                        <th className="text-left p-2 border border-gray-200 w-20">Dealer Code</th>
                                                        <th className="text-left p-2 border border-gray-200 w-40">Dealer Name</th>
                                                        <th className="text-left p-2 border border-gray-200 w-24">City</th>
                                                        <th className="text-left p-2 border border-gray-200">Remarks / Solution</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white">
                                                    {row.calls.map((c, i) => (
                                                        <tr key={i} className="align-top">
                                                            <td className="p-2 pl-10 border border-gray-200 whitespace-nowrap">{c.call_date}</td>
                                                            <td className="p-2 border border-gray-200">{c.customer}</td>
                                                            <td className="p-2 border border-gray-200">{c.state}</td>
                                                            <td className="p-2 border border-gray-200 whitespace-nowrap">{c.status}</td>
                                                            <td className="p-2 border border-gray-200 whitespace-nowrap">{c.visit_type}</td>
                                                            <td className="p-2 border border-gray-200 whitespace-nowrap">{c.dealer_code}</td>
                                                            <td className="p-2 border border-gray-200">{c.dealer_name}</td>
                                                            <td className="p-2 border border-gray-200">{c.city}</td>
                                                            <td className="p-2 border border-gray-200 whitespace-normal break-words">{c.remarks}</td>
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
            <div className="flex items-center justify-between p-3 border-t text-sm text-gray-500">
                <span>{totalRows.toLocaleString()} total machines</span>
                <div className="flex items-center gap-2">
                    <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1 border rounded-md disabled:opacity-40">Prev</button>
                    <span>Page</span>
                    <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={jumpValue}
                        onChange={(e) => setJumpValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleJump()}
                        onBlur={handleJump}
                        className="w-14 border rounded-md px-2 py-1 text-center"
                    />
                    <span>of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-3 py-1 border rounded-md disabled:opacity-40">Next</button>
                </div>
            </div>
        </div>
    );
}