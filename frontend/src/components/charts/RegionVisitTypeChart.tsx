import ReactECharts from "echarts-for-react";

export function RegionVisitTypeChart({ data }: { data: { region: string; Physical: number; Online: number; Unknown: number }[] }) {
    const option = {
        color: ["#0F6E56", "#7DC9B0", "#9CA3AF"],
        legend: { top: 0, textStyle: { fontSize: 10 } },
        grid: { left: 40, right: 10, top: 40, bottom: 30 },
        xAxis: { type: "category", data: data.map((d) => d.region), axisLabel: { fontSize: 10 } },
        yAxis: { type: "value", axisLabel: { fontSize: 9 } },
        series: [
            { name: "Physical", type: "bar", data: data.map((d) => d.Physical), label: { show: true, position: "top", fontSize: 9, color: "#333" } },
            { name: "Online", type: "bar", data: data.map((d) => d.Online), label: { show: true, position: "top", fontSize: 9, color: "#333" } },
            { name: "Unknown", type: "bar", data: data.map((d) => d.Unknown), label: { show: true, position: "top", fontSize: 9, color: "#333" } },
        ],
        tooltip: { trigger: "axis" },
    };
    return <ReactECharts option={option} style={{ height: 240 }} />;
}