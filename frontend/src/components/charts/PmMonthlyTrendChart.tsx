import ReactECharts from "echarts-for-react";
import type { PmMonthlyTrendRow } from "../../services/pmApi";

export function PmMonthlyTrendChart({ data }: { data: PmMonthlyTrendRow[] }) {
    const option = {
        color: ["#D32337", "#4A9B84"],
        legend: { top: 0, textStyle: { fontSize: 12 } },
        grid: { left: 55, right: 55, top: 50, bottom: 40 },
        xAxis: { type: "category", data: data.map((d) => d.year_month), axisLabel: { fontSize: 12 } },
        yAxis: [
            { type: "value", name: "Calls", nameTextStyle: { fontSize: 12 }, axisLabel: { fontSize: 12 } },
            {
                type: "value",
                name: "Closure Rate %",
                nameTextStyle: { fontSize: 12 },
                axisLabel: { fontSize: 12, formatter: "{value}%" },
                splitLine: { show: false },
            },
        ],
        series: [
            {
                name: "Total Calls",
                type: "bar",
                yAxisIndex: 0,
                data: data.map((d) => d.calls),
                label: { show: true, position: "top", fontSize: 12, color: "#333" },
            },
            {
                name: "Closure Rate %",
                type: "line",
                yAxisIndex: 1,
                data: data.map((d) => d.closure_rate_pct),
                label: { show: true, position: "top", fontSize: 12, color: "#333", formatter: "{c}%" },
            },
        ],
        tooltip: { show: false },
    };
    return <ReactECharts option={option} style={{ height: 280 }} />;
}
