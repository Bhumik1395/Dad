import ReactECharts from "echarts-for-react";
import type { MonthlyTrendRow } from "../../services/api";

export function MonthlyTrendChart({ data }: { data: MonthlyTrendRow[] }) {
    const option = {
        color: ["#0F6E56", "#DC2626", "#2563EB"],
        legend: { top: 0, textStyle: { fontSize: 10 } },
        grid: { left: 45, right: 45, top: 40, bottom: 30 },
        xAxis: { type: "category", data: data.map((d) => d.year_month), axisLabel: { fontSize: 10 } },
        yAxis: [
            { type: "value", name: "Calls", axisLabel: { fontSize: 9 } },
            { type: "value", name: "Under-Norm %", axisLabel: { fontSize: 9, formatter: "{value}%" }, splitLine: { show: false } },
        ],
        series: [
            {
                name: "Total Calls",
                type: "bar",
                yAxisIndex: 0,
                data: data.map((d) => d.calls),
                label: { show: true, position: "top", fontSize: 8, color: "#333" },
            },
            {
                name: "Repeat Calls",
                type: "bar",
                yAxisIndex: 0,
                data: data.map((d) => d.repeat_calls),
                label: { show: true, position: "top", fontSize: 8, color: "#333" },
            },
            {
                name: "Under-Norm %",
                type: "bar",
                yAxisIndex: 1,
                data: data.map((d) => d.under_norm_pct),
                label: { show: true, position: "top", fontSize: 8, color: "#333", formatter: "{c}%" },
            },
        ],
        tooltip: { trigger: "axis" },
    };
    return <ReactECharts option={option} style={{ height: 260 }} />;
}