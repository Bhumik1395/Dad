import ReactECharts from "echarts-for-react";
import type { ComponentType, CSSProperties } from "react";

type VisitTypeDatum = { name: string; value: number };

// echarts-for-react ships React 17-era class component typings. Its runtime
// component works with React 19, but its declaration is not JSX-compatible.
const ECharts = ReactECharts as unknown as ComponentType<{
    option: object;
    style?: CSSProperties;
}>;

export function VisitTypeDonut({ data }: { data: VisitTypeDatum[] }) {
    const option = {
        color: ["#0F6E56", "#7DC9B0"],
        series: [{ type: "pie", radius: ["40%", "70%"], data }],
    };
    return <ECharts option={option} style={{ height: 260 }} />;
}
