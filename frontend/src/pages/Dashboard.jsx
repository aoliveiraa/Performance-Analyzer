import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import MemoryIcon from "@mui/icons-material/Memory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SaveIcon from "@mui/icons-material/Save";

import RunUploadPanel from "../components/RunUploadPanel";
import UploadFilesPanel from "../components/UploadFilesPanel";
import ActionTrendChart from "../components/ActionTrendChart";
import MemoryTrendChart from "../components/MemoryTrendChart";

function Dashboard() {
  const [data, setData] = useState(null);
  const [actions, setActions] = useState([]);
  const [memoryLeaks, setMemoryLeaks] = useState([]);
  const [counters, setCounters] = useState([]);
  const [kpis, setKpis] = useState([]);

  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedHardware, setSelectedHardware] = useState("ALL");
  const [selectedRunId, setSelectedRunId] = useState("");

  const [selectedKpiAction, setSelectedKpiAction] = useState("");
  const [kpiValue, setKpiValue] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingKpi, setSavingKpi] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadRunData = async (runId) => {
  if (!runId) {
    return;
  }

  setLoading(true);
  setErrorMessage("");

  try {
    const [
      dashboardResponse,
      actionsResponse,
      memoryLeaksResponse,
      countersResponse,
      kpisResponse,
    ] = await Promise.allSettled([
      api.get(`/dashboard/${runId}`),
      api.get(`/reports/actions/${runId}`),
      api.get(`/reports/memory-leaks/${runId}`),
      api.get(`/reports/counters/${runId}`),
      api.get("/kpis"),
    ]);

    if (dashboardResponse.status === "fulfilled") {
      setData(dashboardResponse.value.data);
    } else {
      console.error("Run dashboard error:", dashboardResponse.reason);
    }

    if (actionsResponse.status === "fulfilled") {
      setActions(actionsResponse.value.data || []);
    } else {
      console.error("Run actions error:", actionsResponse.reason);
    }

    if (memoryLeaksResponse.status === "fulfilled") {
      setMemoryLeaks(memoryLeaksResponse.value.data || []);
    } else {
      console.error("Run memory leaks error:", memoryLeaksResponse.reason);
    }

    if (countersResponse.status === "fulfilled") {
      setCounters(countersResponse.value.data || []);
    } else {
      console.error("Run counters error:", countersResponse.reason);
    }

    if (kpisResponse.status === "fulfilled") {
      setKpis(kpisResponse.value.data || []);
    }

    const hasAnyError =
      dashboardResponse.status === "rejected" ||
      actionsResponse.status === "rejected" ||
      memoryLeaksResponse.status === "rejected" ||
      countersResponse.status === "rejected";

    if (hasAnyError) {
      setErrorMessage(
        "Some run sections could not be loaded. Please check the backend terminal."
      );
    }
  } catch (error) {
    console.error(error);
    setErrorMessage("Could not load selected run data.");
  } finally {
    setLoading(false);
  }
};

  const loadAllData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [
        dashboardResponse,
        actionsResponse,
        memoryLeaksResponse,
        countersResponse,
        kpisResponse,
      ] = await Promise.allSettled([
        api.get("/dashboard/full"),
        api.get("/reports/actions"),
        api.get("/reports/memory-leaks"),
        api.get("/reports/counters"),
        api.get("/kpis"),
      ]);

      if (dashboardResponse.status === "fulfilled") {
        setData(dashboardResponse.value.data);
      } else {
        console.error("Dashboard error:", dashboardResponse.reason);
      }

      if (actionsResponse.status === "fulfilled") {
        setActions(actionsResponse.value.data || []);
      } else {
        console.error("Actions error:", actionsResponse.reason);
      }

      if (memoryLeaksResponse.status === "fulfilled") {
        setMemoryLeaks(memoryLeaksResponse.value.data || []);
      } else {
        console.error("Memory leaks error:", memoryLeaksResponse.reason);
      }

      if (countersResponse.status === "fulfilled") {
        setCounters(countersResponse.value.data || []);
      } else {
        console.error("Counters error:", countersResponse.reason);
      }

      if (kpisResponse.status === "fulfilled") {
        setKpis(kpisResponse.value.data || []);
      } else {
        console.error("KPIs error:", kpisResponse.reason);
      }

      const hasAnyError =
        dashboardResponse.status === "rejected" ||
        actionsResponse.status === "rejected" ||
        memoryLeaksResponse.status === "rejected" ||
        countersResponse.status === "rejected" ||
        kpisResponse.status === "rejected";

      if (hasAnyError) {
        setErrorMessage(
          "Some dashboard sections could not be loaded. Please check the backend terminal for details."
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const reloadReportsAfterKpiSave = async () => {
    try {
      const [actionsResponse, kpisResponse, dashboardResponse] =
        await Promise.allSettled([
          api.get("/reports/actions"),
          api.get("/kpis"),
          api.get("/dashboard/full"),
        ]);

      if (actionsResponse.status === "fulfilled") {
        setActions(actionsResponse.value.data || []);
      }

      if (kpisResponse.status === "fulfilled") {
        setKpis(kpisResponse.value.data || []);
      }

      if (dashboardResponse.status === "fulfilled") {
        setData(dashboardResponse.value.data);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("KPI was saved, but dashboard refresh failed.");
    }
  };

  const saveKpi = async () => {
    if (!selectedKpiAction) {
      setErrorMessage("Please select an Action before saving the KPI.");
      return;
    }

    const numericKpi = Number(kpiValue);

    if (!Number.isFinite(numericKpi) || numericKpi <= 0) {
      setErrorMessage("Please enter a valid KPI value greater than zero.");
      return;
    }

    setSavingKpi(true);
    setErrorMessage("");

    try {
      await api.post("/kpis", null, {
        params: {
          action_name: selectedKpiAction,
          kpi_ms: numericKpi,
        },
      });

      setSuccessMessage("KPI saved successfully.");
      await reloadReportsAfterKpiSave();
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not save KPI. Please check the backend terminal.");
    } finally {
      setSavingKpi(false);
    }
  };

  const getNumber = (value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  const formatNumber = (value, decimals = 2) => {
    const numberValue = getNumber(value);
    return numberValue.toFixed(decimals);
  };

  const getActionStatus = (row) => {
    return row.Status || "NO KPI";
  };

  const getActionColor = (row) => {
    const status = getActionStatus(row);

    if (status === "PASS") {
      return "success";
    }

    if (status === "FAIL") {
      return "error";
    }

    return "warning";
  };

  const getGrowthValue = (row) => {
    return (
      row["Growth %"] ??
      row.GrowthPercent ??
      row.Growth_Percent ??
      row.growth_percent ??
      0
    );
  };

  const getProcessValue = (row) => {
    return row.Process ?? row.ProcessName ?? row.process ?? "-";
  };

  const getCounterValue = (row) => {
    return row.Counter ?? row.CounterName ?? row.counter ?? "-";
  };

  const getMemoryLeakStatus = (row) => {
    return row.Status ?? row.status ?? "-";
  };

  const availableActions = useMemo(() => {
    return [
      "ALL",
      ...new Set(actions.map((item) => item.Action).filter(Boolean)),
    ];
  }, [actions]);

  const availableHardware = useMemo(() => {
    return [
      "ALL",
      ...new Set(actions.map((item) => item.Hardware).filter(Boolean)),
    ];
  }, [actions]);

  const kpiActionOptions = useMemo(() => {
    const actionsFromReport = actions
      .map((item) => item.Action)
      .filter(Boolean);

    const actionsFromKpis = kpis
      .map((item) => item.Action)
      .filter(Boolean);

    return [...new Set([...actionsFromReport, ...actionsFromKpis])].sort();
  }, [actions, kpis]);

  const filteredActions = useMemo(() => {
    return actions.filter((item) => {
      const actionMatch =
        selectedAction === "ALL" || item.Action === selectedAction;

      const hardwareMatch =
        selectedHardware === "ALL" || item.Hardware === selectedHardware;

      return actionMatch && hardwareMatch;
    });
  }, [actions, selectedAction, selectedHardware]);

  const groupedActions = useMemo(() => {
    return filteredActions.reduce((groups, item) => {
      const action = item.Action || "Unknown Action";

      if (!groups[action]) {
        groups[action] = [];
      }

      groups[action].push(item);

      return groups;
    }, {});
  }, [filteredActions]);

  const totalPass = useMemo(() => {
    return actions.filter((item) => item.Status === "PASS").length;
  }, [actions]);

  const totalFail = useMemo(() => {
    return actions.filter((item) => item.Status === "FAIL").length;
  }, [actions]);

  const totalNoKpi = useMemo(() => {
    return actions.filter((item) => item.Status === "NO KPI").length;
  }, [actions]);

  const successRate = useMemo(() => {
    const totalValidated = totalPass + totalFail;

    if (totalValidated === 0) {
      return 0;
    }

    return ((totalPass / totalValidated) * 100).toFixed(2);
  }, [totalPass, totalFail]);

  const totalActions =
    data?.summary?.total_actions ??
    actions.reduce(
      (total, item) => total + getNumber(item["Total Quantity"]),
      0
    );

  const averageResponse =
    data?.summary?.average_response_time ??
    (actions.length > 0
      ? actions.reduce((sum, item) => sum + getNumber(item.Average), 0) /
        actions.length
      : 0);

  const maxResponse =
    data?.summary?.max_response_time ??
    Math.max(...actions.map((item) => getNumber(item.Max)), 0);

  const criticalLeaks = memoryLeaks.filter((item) => {
    const status = String(getMemoryLeakStatus(item)).toUpperCase();

    return (
      status.includes("FAIL") ||
      status.includes("POSSIBLE") ||
      status.includes("LEAK")
    );
  }).length;

  const handleKpiActionChange = (actionName) => {
    setSelectedKpiAction(actionName);

    const existingKpi = kpis.find((item) => item.Action === actionName);

    if (existingKpi) {
      setKpiValue(existingKpi.KPI);
    } else {
      setKpiValue("");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box
          sx={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <CircularProgress size={56} />

          <Typography variant="h5" fontWeight="bold">
            Loading Performance Analyzer...
          </Typography>

          <Typography color="text.secondary">
            Collecting actions, counters, KPIs and memory analysis data.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#f4f6f8", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            background:
              "linear-gradient(135deg, #0d47a1 0%, #1976d2 45%, #42a5f5 100%)",
            color: "white",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h3" fontWeight="bold">
                Performance Analyzer
              </Typography>

              <Typography sx={{ mt: 1, opacity: 0.9 }}>
                Executive performance dashboard for load tests, counters, KPIs
                and memory leak indicators.
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={loadAllData}
              sx={{
                color: "#0d47a1",
                fontWeight: "bold",
                borderRadius: 3,
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Paper>

        {errorMessage && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage("")}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setSuccessMessage("")}
          >
            {successMessage}
          </Alert>
        </Snackbar>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 4, height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AssessmentIcon color="primary" />

                  <Typography color="text.secondary" fontWeight="bold">
                    Total Actions
                  </Typography>
                </Stack>

                <Typography variant="h3" fontWeight="bold" sx={{ mt: 2 }}>
                  {totalActions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 4, height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SpeedIcon color="primary" />

                  <Typography color="text.secondary" fontWeight="bold">
                    Avg Response
                  </Typography>
                </Stack>

                <Typography variant="h3" fontWeight="bold" sx={{ mt: 2 }}>
                  {formatNumber(averageResponse)}
                </Typography>

                <Typography color="text.secondary">ms</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 4, height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SpeedIcon color="warning" />

                  <Typography color="text.secondary" fontWeight="bold">
                    Max Response
                  </Typography>
                </Stack>

                <Typography variant="h3" fontWeight="bold" sx={{ mt: 2 }}>
                  {formatNumber(maxResponse)}
                </Typography>

                <Typography color="text.secondary">ms</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 4, height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircleIcon color="success" />

                  <Typography color="text.secondary" fontWeight="bold">
                    Success Rate
                  </Typography>
                </Stack>

                <Typography
                  variant="h3"
                  fontWeight="bold"
                  color="success.main"
                  sx={{ mt: 2 }}
                >
                  {successRate}%
                </Typography>

                <Typography color="text.secondary">
                  {totalPass} PASS / {totalFail} FAIL / {totalNoKpi} NO KPI
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 4, height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MemoryIcon color={criticalLeaks > 0 ? "error" : "success"} />

                  <Typography color="text.secondary" fontWeight="bold">
                    Memory Alerts
                  </Typography>
                </Stack>

                <Typography
                  variant="h3"
                  fontWeight="bold"
                  color={criticalLeaks > 0 ? "error.main" : "success.main"}
                  sx={{ mt: 2 }}
                >
                  {criticalLeaks}
                </Typography>

                <Typography color="text.secondary">
                  Possible memory leak indicators
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <RunUploadPanel
          selectedRunId={selectedRunId}
          onRunChange={setSelectedRunId}
          onRunDataChanged={loadRunData}
        />

        <UploadFilesPanel onUploadSuccess={loadAllData} />

        <Paper sx={{ mt: 4, p: 3, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            KPI Management
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Register or update the KPI in milliseconds. The PASS/FAIL result is
            calculated using the 90th Percentil value.
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            sx={{ mb: 3 }}
          >
            <FormControl sx={{ minWidth: 280 }}>
              <InputLabel>Action</InputLabel>

              <Select
                value={selectedKpiAction}
                label="Action"
                onChange={(event) => handleKpiActionChange(event.target.value)}
              >
                {kpiActionOptions.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="KPI (ms)"
              type="number"
              value={kpiValue}
              onChange={(event) => setKpiValue(event.target.value)}
              sx={{ minWidth: 200 }}
              inputProps={{
                min: 1,
              }}
            />

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveKpi}
              disabled={savingKpi}
              sx={{
                height: 56,
                borderRadius: 3,
                fontWeight: "bold",
              }}
            >
              {savingKpi ? "Saving..." : "Save KPI"}
            </Button>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Registered KPIs
          </Typography>

          {kpis.length === 0 ? (
            <Alert severity="info">No KPI registered yet.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#eef3f8" }}>
                    <TableCell>
                      <strong>Action</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>KPI (ms)</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {kpis.map((row) => (
                    <TableRow key={row.Action} hover>
                      <TableCell>{row.Action}</TableCell>

                      <TableCell align="right">
                        {formatNumber(row.KPI, 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper sx={{ mt: 4, p: 3, borderRadius: 4 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Filters
              </Typography>

              <Typography color="text.secondary">
                Filter the action report by Action and Hardware.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel>Action</InputLabel>

                <Select
                  value={selectedAction}
                  label="Action"
                  onChange={(event) => setSelectedAction(event.target.value)}
                >
                  {availableActions.map((action) => (
                    <MenuItem key={action} value={action}>
                      {action}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel>Hardware</InputLabel>

                <Select
                  value={selectedHardware}
                  label="Hardware"
                  onChange={(event) => setSelectedHardware(event.target.value)}
                >
                  {availableHardware.map((hardware) => (
                    <MenuItem key={hardware} value={hardware}>
                      {hardware}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ mt: 4, p: 3, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Action Performance Report
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Results grouped by Action and compared against KPI using the 90th
            Percentil value.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {Object.keys(groupedActions).length === 0 && (
            <Alert severity="info">
              No action data available for the selected filters.
            </Alert>
          )}

          {Object.entries(groupedActions).map(([actionName, actionRows]) => (
            <Box key={actionName} sx={{ mb: 5 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {actionName}
                </Typography>

                <Chip
                  label={`${actionRows.length} hardware result(s)`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#eef3f8" }}>
                      <TableCell>
                        <strong>Hardware</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>KPI</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>Total Quantity</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>Above KPI</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>Min (ms)</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>Max (ms)</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>Average (ms)</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>Std Deviation (ms)</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>50th Percentil (ms)</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>90th Percentil (ms)</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Status</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {actionRows.map((row, index) => {
                      const status = getActionStatus(row);

                      return (
                        <TableRow key={`${row.Hardware}-${index}`} hover>
                          <TableCell>{row.Hardware}</TableCell>

                          <TableCell align="right">
                            {formatNumber(row.KPI, 0)}
                          </TableCell>

                          <TableCell align="right">
                            {row["Total Quantity"] ?? "-"}
                          </TableCell>

                          <TableCell align="right">
                            {row["Above KPI"] ?? "-"}
                          </TableCell>

                          <TableCell align="right">
                            {formatNumber(row.Min)}
                          </TableCell>

                          <TableCell align="right">
                            {formatNumber(row.Max)}
                          </TableCell>

                          <TableCell align="right">
                            {formatNumber(row.Average)}
                          </TableCell>

                          <TableCell align="right">
                            {formatNumber(row["Std Deviation"])}
                          </TableCell>

                          <TableCell align="right">
                            {formatNumber(row["50th Percentil"])}
                          </TableCell>

                          <TableCell align="right">
                            {formatNumber(row["90th Percentil"])}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              color={getActionColor(row)}
                              label={status}
                              icon={
                                status === "PASS" ? (
                                  <CheckCircleIcon />
                                ) : status === "FAIL" ? (
                                  <ErrorIcon />
                                ) : undefined
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Paper>

        <Paper sx={{ mt: 4, p: 3, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Memory Leak Analysis
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Possible memory growth indicators detected from counters.
          </Typography>

          {memoryLeaks.length === 0 ? (
            <Alert severity="success">
              No possible memory leak was detected.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#eef3f8" }}>
                    <TableCell>
                      <strong>Hardware</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Process</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Counter</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Growth %</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Severity</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {memoryLeaks.map((row, index) => {
                    const status = getMemoryLeakStatus(row);

                    const isProblem =
                      String(status).toUpperCase().includes("FAIL") ||
                      String(status).toUpperCase().includes("POSSIBLE") ||
                      String(status).toUpperCase().includes("LEAK");

                    return (
                      <TableRow key={index} hover>
                        <TableCell>{row.Hardware ?? "-"}</TableCell>

                        <TableCell>{getProcessValue(row)}</TableCell>

                        <TableCell>{getCounterValue(row)}</TableCell>

                        <TableCell align="right">
                          {formatNumber(getGrowthValue(row))}%
                        </TableCell>

                        <TableCell>{row.Severity ?? "-"}</TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            color={isProblem ? "error" : "success"}
                            label={status}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper sx={{ mt: 4, p: 3, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Resource Consumption Report
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            First 25 resource counter records.
          </Typography>

          {counters.length === 0 ? (
            <Alert severity="info">No counters data available.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#eef3f8" }}>
                    <TableCell>
                      <strong>Process</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Counter</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Average</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Max</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Growth %</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {counters.slice(0, 25).map((row, index) => {
                    const growth = getNumber(getGrowthValue(row));
                    const hasAttention = growth > 20;

                    return (
                      <TableRow key={index} hover>
                        <TableCell>{getProcessValue(row)}</TableCell>

                        <TableCell>{getCounterValue(row)}</TableCell>

                        <TableCell align="right">
                          {formatNumber(row.Average)}
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(row.Max)}
                        </TableCell>

                        <TableCell align="right">
                          {formatNumber(growth)}%
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            color={hasAttention ? "error" : "success"}
                            label={hasAttention ? "ATTENTION" : "NORMAL"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Grid container spacing={3} sx={{ mt: 1, mb: 5 }}>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: 4, height: "100%" }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                Action Response Trend
              </Typography>

              <ActionTrendChart />
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: 4, height: "100%" }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                Memory Consumption Trend
              </Typography>

              <MemoryTrendChart />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard;