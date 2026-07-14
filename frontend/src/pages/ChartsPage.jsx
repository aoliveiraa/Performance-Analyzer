import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  FormGroup,
  Paper,
  Typography,
} from "@mui/material";

import { useParams } from "react-router-dom";

import { useEffect, useMemo, useState } from "react";

import ReactECharts from "echarts-for-react";

const FIXED_COUNTERS = [
  "Private Bytes",
  "Working Set",
  "Handle Count",
  "Thread Count",
  "IO Read Bytes/sec",
  "IO Write Bytes/sec",
  "% Processor Time",
];

function ChartsPage() {
  const { runId } = useParams();

  const [actions, setActions] = useState([]);
  const [status, setStatus] = useState(null);
  const [performanceCounters, setPerformanceCounters] = useState([]);
  const [topMemory, setTopMemory] = useState([]);

  const [selectedCounters, setSelectedCounters] = useState(FIXED_COUNTERS);

  const [error, setError] = useState("");

  useEffect(() => {
    loadCharts();
  }, [runId]);

  async function safeFetchArray(url) {
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  }

  async function safeFetchObject(url) {
    const response = await fetch(url);

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data)
    ) {
      return data;
    }

    return {};
  }

  async function loadCharts() {
    try {
      setError("");

      const actionsData = await safeFetchArray(
        `http://localhost:8000/charts/actions/${runId}`
      );

      setActions(actionsData);

      const statusData = await safeFetchObject(
        `http://localhost:8000/charts/status/${runId}`
      );

      setStatus(statusData);

      const countersData = await safeFetchArray(
        `http://localhost:8000/charts/performance-counters/${runId}`
      );

      setPerformanceCounters(countersData);

      const topMemoryData = await safeFetchArray(
        `http://localhost:8000/charts/top-memory/${runId}`
      );

      setTopMemory(topMemoryData);
    } catch (err) {
      console.error(err);

      setError(
        "Could not load chart data. Please check if backend is running."
      );
    }
  }

  function handleToggleCounter(counter) {
    setSelectedCounters((current) => {
      if (current.includes(counter)) {
        return current.filter((item) => item !== counter);
      }

      return [...current, counter];
    });
  }

  const actionData = Array.isArray(actions)
    ? actions
    : [];

  const countersData = Array.isArray(performanceCounters)
    ? performanceCounters
    : [];

  const topMemoryData = Array.isArray(topMemory)
    ? topMemory
    : [];

  const filteredCountersData = useMemo(
    () =>
      countersData.filter((item) =>
        selectedCounters.includes(item.counter)
      ),
    [countersData, selectedCounters]
  );

  const averageChart = {
    tooltip: {
      trigger: "axis",
    },

    legend: {
      data: [
        "Average",
        "90th Percentil",
        "KPI",
      ],
      bottom: 0,
    },

    grid: {
      left: 70,
      right: 30,
      bottom: 110,
      top: 50,
    },

    xAxis: {
      type: "category",
      data: actionData.map(
        (item) => item.Action
      ),
      axisLabel: {
        rotate: 35,
        interval: 0,
        fontSize: 10,
      },
    },

    yAxis: {
      type: "value",
    },

    series: [
      {
        name: "Average",
        type: "bar",
        data: actionData.map(
          (item) => item.Average
        ),
      },
      {
        name: "90th Percentil",
        type: "bar",
        data: actionData.map(
          (item) => item["90th Percentil"]
        ),
      },
      {
        name: "KPI",
        type: "line",
        data: actionData.map(
          (item) => item.KPI
        ),
      },
    ],
  };

  const statusChart = {
    tooltip: {
      trigger: "item",
    },

    legend: {
      bottom: 0,
    },

    series: [
      {
        type: "pie",
        radius: "65%",
        center: ["50%", "45%"],
        data: status
          ? [
              {
                name: "PASS",
                value: status.PASS || 0,
              },
              {
                name: "FAIL",
                value: status.FAIL || 0,
              },
              {
                name: "NO KPI",
                value: status["NO KPI"] || 0,
              },
            ]
          : [],
      },
    ],
  };

  function buildLineSeries(data) {
    const grouped = {};

    data.forEach((item) => {
      const key = `${item.counter} | ${item.process} | ${item.hardware}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push([
        item.timestamp,
        item.value,
      ]);
    });

    return Object.keys(grouped)
      .slice(0, 20)
      .map((key) => ({
        name: key,
        type: "line",
        showSymbol: false,
        smooth: true,
        data: grouped[key],
      }));
  }

  const countersSeries = useMemo(
    () => buildLineSeries(filteredCountersData),
    [filteredCountersData]
  );

  const performanceCountersChart = {
    tooltip: {
      trigger: "axis",
    },

    legend: {
      type: "scroll",
      bottom: 0,
    },

    grid: {
      left: 90,
      right: 30,
      bottom: 110,
      top: 40,
    },

    xAxis: {
      type: "category",
      axisLabel: {
        show: false,
      },
    },

    yAxis: {
      type: "value",
    },

    series: countersSeries,
  };

  const topMemoryChart = {
    tooltip: {
      trigger: "axis",
    },

    legend: {
      bottom: 0,
    },

    grid: {
      left: 90,
      right: 30,
      bottom: 150,
      top: 50,
    },

    xAxis: {
      type: "category",
      data: topMemoryData.map(
        (item) =>
          `${item.hardware} | ${item.process}`
      ),
      axisLabel: {
        rotate: 25,
        interval: 0,
        fontSize: 10,
      },
    },

    yAxis: {
      type: "value",
    },

    series: [
      {
        name: "Max Memory",
        type: "bar",
        data: topMemoryData.map(
          (item) => item.max
        ),
      },
      {
        name: "Average Memory",
        type: "bar",
        data: topMemoryData.map(
          (item) => item.average
        ),
      },
    ],
  };

  function renderFixedCounterSelector() {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          backgroundColor: "#fafafa",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              md: "center",
            },
            flexDirection: {
              xs: "column",
              md: "row",
            },
            gap: 1,
            mb: 1,
          }}
        >
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
            >
              Performance counters
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Selected: {selectedCounters.length} of {FIXED_COUNTERS.length}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
            }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setSelectedCounters(FIXED_COUNTERS)
              }
              sx={{
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Select all
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() =>
                setSelectedCounters([])
              }
              sx={{
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Clear
            </Button>
          </Box>
        </Box>

        <FormGroup
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr 1fr",
            },
            gap: 0.5,
          }}
        >
          {FIXED_COUNTERS.map((counter) => (
            <FormControlLabel
              key={counter}
              control={
                <Checkbox
                  size="small"
                  checked={selectedCounters.includes(counter)}
                  onChange={() =>
                    handleToggleCounter(counter)
                  }
                />
              }
              label={
                <Typography
                  variant="body2"
                  title={counter}
                >
                  {counter}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      </Paper>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ mb: 1 }}
          >
            Charts
          </Typography>

          <Typography color="text.secondary">
            Run: {runId}
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "2fr 1fr",
            },
            gap: 3,
          }}
        >
          <Paper
            sx={{
              p: 2,
              borderRadius: 4,
              minHeight: 520,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
            >
              Response Time - Average / 90th Percentil / KPI
            </Typography>

            {actionData.length === 0 ? (
              <Alert severity="info">
                No action chart data found for this run.
              </Alert>
            ) : (
              <ReactECharts
                option={averageChart}
                style={{
                  height: 470,
                }}
              />
            )}
          </Paper>

          <Paper
            sx={{
              p: 2,
              borderRadius: 4,
              minHeight: 520,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
            >
              Status Distribution
            </Typography>

            <ReactECharts
              option={statusChart}
              style={{
                height: 470,
              }}
            />
          </Paper>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 4,
              minHeight: 640,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
            >
              Memory / CPU / IO Counters Trend
            </Typography>

            {renderFixedCounterSelector()}

            {countersData.length === 0 ? (
              <Alert severity="info">
                No performance counter data found for this run.
              </Alert>
            ) : selectedCounters.length === 0 ? (
              <Alert severity="warning">
                Select at least one counter to display the chart.
              </Alert>
            ) : filteredCountersData.length === 0 ? (
              <Alert severity="warning">
                No data found for the selected counters in this run.
              </Alert>
            ) : (
              <ReactECharts
                option={performanceCountersChart}
                style={{
                  height: 470,
                }}
              />
            )}
          </Paper>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 4,
              minHeight: 560,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
            >
              Top Memory Consumers
            </Typography>

            {topMemoryData.length === 0 ? (
              <Alert severity="info">
                No memory consumer data found for this run.
              </Alert>
            ) : (
              <ReactECharts
                option={topMemoryChart}
                style={{
                  height: 510,
                }}
              />
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}

export default ChartsPage;