import ReactECharts from "echarts-for-react";

export function SimpleBarChart({
    data, xKey, yKey,
}: {
    data: Record<string, string | number>[];
    xKey: string;
    yKey: string;
}) {
    const option = {
        color: ["#0F6E56"],
        grid: { left: 40, right: 20, top: 20, bottom: 40 },
        xAxis: { type: "category", data: data.map((d) => d[xKey]), axisLabel: { rotate: 30 } },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: data.map((d) => d[yKey]) }],
        tooltip: { trigger: "axis" },
    };
    return <ReactECharts option={option} style={{ height: 260 }} />;
}