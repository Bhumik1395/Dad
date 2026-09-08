import ReactECharts from "echarts-for-react";

export function RegionVisitTypeChart({ data }: { data: { region: string; Physical: number; Online: number }[] }) {
    const option = {
        color: ["#0F6E56", "#7DC9B0"],
        legend: { top: 0, textStyle: { fontSize: 10 } },
        grid: { left: 40, right: 10, top: 30, bottom: 30 },
        xAxis: { type: "category", data: data.map((d) => d.region), axisLabel: { fontSize: 10 } },
        yAxis: { type: "value", axisLabel: { fontSize: 9 } },
        series: [
            { name: "Physical", type: "bar", data: data.map((d) => d.Physical) },
            { name: "Online", type: "bar", data: data.map((d) => d.Online) },
        ],
        tooltip: { trigger: "axis" },
    };
    return <ReactECharts option={option} style={{ height: 240 }} />;
}   