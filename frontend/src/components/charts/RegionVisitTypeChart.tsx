import ReactECharts from "echarts-for-react";

export function RegionVisitTypeChart({ data }: { data: { region: string; Physical: number; Online: number }[] }) {
    const option = {
        color: ["#006A50", "#CADCD6"],
        legend: { top: 0, textStyle: { fontSize: 10 } },
        grid: { left: 40, right: 10, top: 40, bottom: 30 },
        xAxis: { type: "category", data: data.map((d) => d.region), axisLabel: { fontSize: 10 } },
        yAxis: { type: "value", axisLabel: { fontSize: 9 } },
        series: [
            {
                name: "Physical",
                type: "bar",
                data: data.map((d) => d.Physical),
                label: { show: true, position: "top", fontSize: 9, color: "#333" },
            },
            {
                name: "Online",
                type: "bar",
                data: data.map((d) => d.Online),
                label: { show: true, position: "top", fontSize: 9, color: "#333" },
            },
        ],

    };
    return <ReactECharts option={option} style={{ height: 240 }} />;
}