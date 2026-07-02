import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import api from "../services/api";

function MemoryTrendChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadChart();
  }, []);

  const loadChart = async () => {
    try {
      const response = await api.get(
        "/charts/memory-trend"
      );

      if (Array.isArray(response.data)) {
        setChartData(response.data);
      } else {
        console.error(
          "Formato inválido:",
          response.data
        );
        setChartData([]);
      }
    } catch (error) {
      console.error(error);
      setChartData([]);
    }
  };

  const options = {
    title: {
      text: "Memory Consumption Trend",
    },

    tooltip: {
      trigger: "axis",
    },

    xAxis: {
      type: "category",
      data: chartData.map(
        (_, index) => index + 1
      ),
    },

    yAxis: {
      type: "value",
      name: "Memory",
    },

    series: [
      {
        name: "Memory",
        type: "line",
        smooth: true,
        areaStyle: {},

        data: chartData.map(
          (item) => item.value
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

export default MemoryTrendChart;