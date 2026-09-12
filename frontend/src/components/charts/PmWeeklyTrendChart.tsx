import ReactECharts from "echarts-for-react";
import type { PmWeeklyTrendRow } from "../../services/pmApi";

export function PmWeeklyTrendChart({ data }: { data: PmWeeklyTrendRow[] }) {
    const option = {
        color: ["#D32337"],
        grid: { left: 45, right: 20, top: 30, bottom: 40 },
        xAxis: {
            type: "category",
            data: data.map((d) => d.year_week),
            axisLabel: { fontSize: 11, rotate: data.length > 10 ? 45 : 0 },
        },
        yAxis: { type: "value", name: "PMs", nameTextStyle: { fontSize: 12 }, axisLabel: { fontSize: 12 } },
        series: [
            {
                name: "PMs Done",
                type: "bar",
                data: data.map((d) => d.pm_count),
                label: { show: true, position: "top", fontSize: 11, color: "#333" },
            },
        ],
        tooltip: { show: false },
    };
    return <ReactECharts option={option} style={{ height: 240 }} />;
}
