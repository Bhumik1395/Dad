import ReactECharts from "echarts-for-react";

export function SimpleLineChart({
    data, xKey, yKey,
}: {
    data: Record<string, string | number>[];
    xKey: string;
    yKey: string;
}) {
    const option = {
        color: ["#0F6E56"],
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: "category", data: data.map((d) => d[xKey]) },
        yAxis: { type: "value" },
        series: [{ type: "line", data: data.map((d) => d[yKey]), smooth: true }],

    };
    return <ReactECharts option={option} style={{ height: 260 }} />;
}