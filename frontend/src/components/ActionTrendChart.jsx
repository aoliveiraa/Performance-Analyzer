import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import api from "../services/api";

function ActionTrendChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadChart();
  }, []);

  const loadChart = async () => {
    try {
      const response = await api.get(
        "/charts/action-trend"
      );

      setChartData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const options = {
    title: {
      text: "Response Time Trend",
    },

    tooltip: {
      trigger: "axis",
    },

    xAxis: {
      type: "category",
      data: chartData.map((_, index) => index + 1),
    },

    yAxis: {
      type: "value",
      name: "Milliseconds",
    },

    series: [
      {
        name: "Response Time",
        type: "line",
        smooth: true,
        data: chartData.map(
          (item) => item.duration
        ),
      },
    ],
  };

  return (
    <ReactECharts
      option={options}
      style={{
        height: "400px",
      }}
    />
  );
}

export default ActionTrendChart;