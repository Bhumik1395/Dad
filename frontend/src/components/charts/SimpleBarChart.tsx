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
        grid: { left: 35, right: 10, top: 25, bottom: 60 },
        xAxis: {
            type: "category",
            data: data.map((d) => d[xKey]),
            axisLabel: { rotate: 0, fontSize: 12, interval: 0 },
        },
        yAxis: { type: "value", axisLabel: { fontSize: 9 } },
        series: [{
            type: "bar",
            data: data.map((d) => d[yKey]),
            barWidth: "60%",
            label: { show: true, position: "top", fontSize: 9, color: "#333" },
        }],

    };
    return <ReactECharts option={option} style={{ height: 200 }} />;
}