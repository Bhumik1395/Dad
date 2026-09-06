import ReactECharts from "echarts-for-react";

export function VisitTypeDonut({ data }: { data: { name: string; value: number }[] }) {
    const option = {
        color: ["#0F6E56", "#7DC9B0"],
        tooltip: {
            trigger: "item",
            formatter: "{b}: {c} ({d}%)",
        },
        series: [
            {
                type: "pie",
                radius: ["40%", "70%"],
                data,
                label: {
                    formatter: "{b}: {c} ({d}%)",
                    fontSize: 12,
                },
                labelLine: {
                    length: 15,
                    length2: 10,
                },
            },
        ],
    };
    return <ReactECharts option={option} style={{ height: 260 }} />;
}