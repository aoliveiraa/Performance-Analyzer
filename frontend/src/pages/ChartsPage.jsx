import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";

import { useNavigate, useParams } from "react-router-dom";
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

const COUNTER_GROUPS = {
  Memory: ["Private Bytes", "Working Set"],
  Process: ["Handle Count", "Thread Count"],
  IO: ["IO Read Bytes/sec", "IO Write Bytes/sec"],
  CPU: ["% Processor Time"],
};

function ChartsPage() {
  const { runId } = useParams();
  const navigate = useNavigate();

  const [actions, setActions] = useState([]);
  const [status, setStatus] = useState(null);
  const [performanceCounters, setPerformanceCounters] = useState([]);
  const [topMemory, setTopMemory] = useState([]);
  const [reportMetadata, setReportMetadata] = useState(null);

  const [selectedCounters, setSelectedCounters] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState("ALL");

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

  async function loadReportMetadata() {
    try {
      const response = await fetch(
        `http://localhost:8000/runs/${runId}/files`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setReportMetadata(data?.metadata || null);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadCharts() {
    try {
      setError("");

      await loadReportMetadata();

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

  function formatTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  function formatCounterValue(value, counter) {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return "-";
    }

    if (
      counter.includes("Private Bytes") ||
      counter.includes("Working Set")
    ) {
      return `${(numericValue / 1024 / 1024).toFixed(2)} MB`;
    }

    if (counter.includes("% Processor Time")) {
      return `${numericValue.toFixed(2)}%`;
    }

    return numericValue.toLocaleString("en-US");
  }

  const actionData = Array.isArray(actions) ? actions : [];
  const countersData = Array.isArray(performanceCounters)
    ? performanceCounters
    : [];
  const topMemoryData = Array.isArray(topMemory) ? topMemory : [];

  const availableProcesses = useMemo(() => {
    return [
      ...new Set(
        countersData
          .map((item) => item.process)
          .filter(Boolean)
      ),
    ].sort();
  }, [countersData]);

  const filteredCountersData = useMemo(() => {
    return countersData.filter((item) => {
      const counterMatch = selectedCounters.includes(item.counter);

      const processMatch =
        selectedProcess === "ALL" ||
        item.process === selectedProcess;

      return counterMatch && processMatch;
    });
  }, [countersData, selectedCounters, selectedProcess]);

  const averageChart = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["Average", "90th Percentil", "KPI"],
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
      data: actionData.map((item) => item.Action),
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
        data: actionData.map((item) => item.Average),
      },
      {
        name: "90th Percentil",
        type: "bar",
        data: actionData.map((item) => item["90th Percentil"]),
      },
      {
        name: "KPI",
        type: "line",
        data: actionData.map((item) => item.KPI),
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
      const counter = item.counter || "-";
      const process = item.process || "-";
      const hardware = item.hardware || "-";
      const action = item.action || "-";
      const timestamp = item.timestamp || "";
      const value = Number(item.value || 0);
      const parsedTime = new Date(timestamp).getTime();

      if (Number.isNaN(parsedTime)) {
        return;
      }

      const key = `${counter} | ${process} | ${hardware}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push({
        value: [parsedTime, value],
        counter,
        process,
        hardware,
        action,
        timestamp,
      });
    });

    return Object.keys(grouped)
      .map((key) => {
        grouped[key].sort((a, b) => a.value[0] - b.value[0]);

        return {
  name: key,
  type: "line",

  // Keeps the chart visually clean but creates invisible hover points
  showSymbol: true,
  symbol: "circle",
  symbolSize: 10,

  itemStyle: {
    opacity: 0,
  },

  smooth: false,
  connectNulls: true,

  triggerLineEvent: true,

  lineStyle: {
    width: 3,
  },

  emphasis: {
    focus: "series",
    scale: false,
    itemStyle: {
      opacity: 0,
    },
    lineStyle: {
      width: 4,
    },
  },

  data: grouped[key],
};

      });
  }

  const countersSeries = useMemo(
    () => buildLineSeries(filteredCountersData),
    [filteredCountersData]
  );

  const performanceCountersChart = {
    dataZoom: [
      {
        type: "inside",
      },
      {
        type: "slider",
        bottom: 45,
      },
    ],
tooltip: {
  trigger: "item",

  formatter: (params) => {
    const data = params.data || {};

    const counter = data.counter || "-";
    const process = data.process || "-";
    const hardware = data.hardware || "-";
    const action = data.action || "-";
    const timestamp = data.timestamp || "";

    const value =
      params.value?.[1] ??
      data.value?.[1] ??
      0;

    const formattedValue =
      formatCounterValue(value, counter);

    const formattedTime =
      formatTime(timestamp);

    return `
      <b>Time</b><br/>
      ${formattedTime}
      <br/><br/>

      <b>Process</b><br/>
      ${process}
      <br/><br/>

      <b>Hardware</b><br/>
      ${hardware}
      <br/><br/>

      <b>Action</b><br/>
      ${action}
      <br/><br/>

      <b>Counter</b><br/>
      ${counter}
      <br/><br/>

      <b>Value</b><br/>
      ${formattedValue}
    `;
  },
},
    legend: {
      show: false,
    },
    grid: {
      left: 90,
      right: 30,
      bottom: 80,
      top: 30,
      containLabel: true,
    },
    xAxis: {
      type: "time",
      name: "Timeline",
      nameLocation: "middle",
      nameGap: 35,
      axisLabel: {
        show: true,
        formatter: (value) => formatTime(value),
      },
      splitLine: {
        show: true,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => {
          const hasOnlyMemoryCounters =
            selectedCounters.length > 0 &&
            selectedCounters.every((counter) =>
              ["Private Bytes", "Working Set"].includes(counter)
            );

          if (hasOnlyMemoryCounters) {
            return `${(value / 1024 / 1024).toFixed(0)} MB`;
          }

          if (
            selectedCounters.length === 1 &&
            selectedCounters[0] === "% Processor Time"
          ) {
            return `${Number(value).toFixed(0)}%`;
          }

          return Number(value).toLocaleString("en-US");
        },
      },
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
        (item) => `${item.hardware} | ${item.process}`
      ),
      axisLabel: {
        rotate: 25,
        interval: 0,
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => `${(value / 1024 / 1024).toFixed(0)} MB`,
      },
    },
    series: [
      {
        name: "Max Memory",
        type: "bar",
        data: topMemoryData.map((item) => item.max),
      },
      {
        name: "Average Memory",
        type: "bar",
        data: topMemoryData.map((item) => item.average),
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
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Performance Counters
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {selectedCounters.length === 0
                ? "No counters selected"
                : `${selectedCounters.length} counter(s) selected`}
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
              onClick={() => setSelectedCounters(FIXED_COUNTERS)}
              sx={{
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Select All
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => setSelectedCounters([])}
              sx={{
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Clear Selection
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: 2,
          }}
        >
          {Object.entries(COUNTER_GROUPS).map(([groupName, counters]) => (
            <Paper
              key={groupName}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{
                  mb: 1,
                }}
              >
                {groupName}
              </Typography>

              <FormGroup>
                {counters.map((counter) => (
                  <FormControlLabel
                    key={counter}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedCounters.includes(counter)}
                        onChange={() => handleToggleCounter(counter)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {counter}
                      </Typography>
                    }
                  />
                ))}
              </FormGroup>
            </Paper>
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
              Charts
            </Typography>

            {reportMetadata ? (
              <Typography
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                }}
              >
                {[
                  reportMetadata.version,
                  reportMetadata.build,
                  reportMetadata.suite,
                  reportMetadata.environment,
                  reportMetadata.date,
                ]
                  .filter(Boolean)
                  .join(" | ")}
              </Typography>
            ) : (
              <Typography color="text.secondary">
                Loading report information...
              </Typography>
            )}
          </Box>

          <Button
            variant="outlined"
            onClick={() => navigate(`/report/${runId}/summary`)}
            sx={{
              borderRadius: 3,
              fontWeight: "bold",
            }}
          >
            Back to Summary
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
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
            <Typography variant="h6" gutterBottom>
              Response Time - Average / 90th Percentil / KPI
            </Typography>

            {actionData.length === 0 ? (
              <Alert severity="info">
                No action chart data found for this run.
              </Alert>
            ) : (
              <ReactECharts option={averageChart} style={{ height: 470 }} />
            )}
          </Paper>

          <Paper
            sx={{
              p: 2,
              borderRadius: 4,
              minHeight: 520,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Status Distribution
            </Typography>

            <ReactECharts option={statusChart} style={{ height: 470 }} />
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
            <Typography variant="h6" gutterBottom>
              Memory / CPU / IO Counters Trend
            </Typography>

            <FormControl
              sx={{
                minWidth: 450,
                mb: 2,
              }}
            >
              <InputLabel>Process</InputLabel>

              <Select
                value={selectedProcess}
                label="Process"
                onChange={(event) => setSelectedProcess(event.target.value)}
              >
                <MenuItem value="ALL">All Processes</MenuItem>

                {availableProcesses.map((process) => (
                  <MenuItem key={process} value={process}>
                    {process}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderFixedCounterSelector()}

            {countersData.length === 0 ? (
              <Alert severity="info">
                No performance counter data found for this run.
              </Alert>
            ) : selectedCounters.length === 0 ? (
              <Alert severity="info">
                Select one or more counters above to build the performance chart.
              </Alert>
            ) : filteredCountersData.length === 0 ? (
              <Alert severity="warning">
                No data found for the selected counters in this run.
              </Alert>
            ) : (
              <ReactECharts
                option={performanceCountersChart}
                style={{ height: 470 }}
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
            <Typography variant="h6" gutterBottom>
              Top Memory Consumers
            </Typography>

            {topMemoryData.length === 0 ? (
              <Alert severity="info">
                No memory consumer data found for this run.
              </Alert>
            ) : (
              <ReactECharts option={topMemoryChart} style={{ height: 510 }} />
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}

export default ChartsPage;
