import ReactECharts from "echarts-for-react";
import type { PmMonthlyTrendRow } from "../../services/pmApi";

export function PmMonthlyTrendChart({ data }: { data: PmMonthlyTrendRow[] }) {
    const option = {
        color: ["#D32337"],
        grid: { left: 55, right: 20, top: 30, bottom: 40 },
        xAxis: { type: "category", data: data.map((d) => d.year_month), axisLabel: { fontSize: 12 } },
        yAxis: { type: "value", name: "PMs", nameTextStyle: { fontSize: 12 }, axisLabel: { fontSize: 12 } },
        series: [
            {
                name: "Total PMs",
                type: "bar",
                data: data.map((d) => d.pm_count),
                label: { show: true, position: "top", fontSize: 12, color: "#333" },
            },
        ],
        tooltip: { show: false },
    };
    return <ReactECharts option={option} style={{ height: 280 }} />;
}