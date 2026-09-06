declare module "echarts-for-react" {
  import { Component, CSSProperties } from "react";

  /** Props accepted by the ReactECharts component */
  export interface EChartsReactProps {
    /** ECharts option object */
    option: any;
    /** Inline style for the container */
    style?: CSSProperties;
    /** Optional CSS class name */
    className?: string;
    /** Any additional props */
    [key: string]: any;
  }

  /** The default exported component */
  export default class ReactECharts extends Component<EChartsReactProps> {
    /** Returns the underlying ECharts instance */
    getEchartsInstance(): any;
    /** Triggers a resize of the chart */
    resize(): void;
  }
}
