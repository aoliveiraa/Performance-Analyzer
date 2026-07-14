import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import api from "../services/api";

function CompareReportsPage() {
  const [reports, setReports] = useState([]);
  const [reportA, setReportA] = useState("");
  const [reportB, setReportB] = useState("");
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingReports, setLoadingReports] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [resultFilter, setResultFilter] = useState("All");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoadingReports(true);
    setErrorMessage("");

    try {
      const response = await api.get("/reports");
      const data = Array.isArray(response.data) ? response.data : [];

      setReports(data);

      if (data.length >= 2) {
        const firstReport = normalizeRunId(data[0]);
        const secondReport = normalizeRunId(data[1]);

        setReportA(firstReport);
        setReportB(secondReport);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Could not load reports. Please check if the backend endpoint /reports is working."
      );
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }

  function normalizeRunId(report) {
    if (typeof report === "string") {
      return report;
    }

    return report.run_id || report.runId || report.id || report.name || "";
  }

  function buildReportLabel(report) {
    if (!report) {
      return "Unknown report";
    }

    const runId = normalizeRunId(report);

    const version =
      report.version ||
      report.Version ||
      "-";

    const build =
      report.build ||
      report.Build ||
      "-";

    const suite =
      report.suite ||
      report.Suite ||
      "-";

    const environment =
      report.environment ||
      report.Environment ||
      "-";

    const date =
      report.date ||
      report.Date ||
      "-";

    const hasMetadata =
      version !== "-" ||
      build !== "-" ||
      suite !== "-" ||
      environment !== "-" ||
      date !== "-";

    if (!hasMetadata) {
      return runId;
    }

    return [
      version,
      build,
      suite,
      environment,
      date,
    ]
      .filter(Boolean)
      .join(" | ");
  }

  function getReportByRunId(runId) {
    return reports.find(
      (report) => normalizeRunId(report) === runId
    );
  }

  async function handleCompare() {
    if (!reportA || !reportB) {
      setErrorMessage("Please select two reports to compare.");
      setSuccessMessage("");
      return;
    }

    if (reportA === reportB) {
      setErrorMessage("Please select two different reports.");
      setSuccessMessage("");
      return;
    }

    setComparing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.get("/reports/compare", {
        params: {
          report_a: reportA,
          report_b: reportB,
        },
      });

      setComparisonData(response.data);
      setSuccessMessage("Reports compared successfully.");
    } catch (error) {
      console.error(error);
      setComparisonData(null);
      setErrorMessage(
        "Could not compare reports. Please check if the backend endpoint /reports/compare is working."
      );
    } finally {
      setComparing(false);
    }
  }

  function getNumber(value) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  function formatNumber(value, decimals = 2) {
    const numberValue = getNumber(value);

    if (numberValue === null) {
      return "-";
    }

    return numberValue.toFixed(decimals);
  }

  function formatPercent(value) {
    const numberValue = getNumber(value);

    if (numberValue === null) {
      return "-";
    }

    return `${numberValue.toFixed(2)}%`;
  }

  function getStatusColor(status) {
    if (status === "PASS") {
      return "success";
    }

    if (status === "FAIL") {
      return "error";
    }

    return "warning";
  }

  function getStatusIcon(status) {
    if (status === "PASS") {
      return <CheckCircleIcon />;
    }

    if (status === "FAIL") {
      return <ErrorIcon />;
    }

    return <WarningIcon />;
  }

  function getResultColor(result) {
    if (result === "Improved") {
      return "success";
    }

    if (result === "Worse") {
      return "error";
    }

    if (result === "Same") {
      return "info";
    }

    return "default";
  }

  function getResultLabel(result) {
    if (result === "Improved") {
      return "Improved";
    }

    if (result === "Worse") {
      return "Worse";
    }

    if (result === "Same") {
      return "Same";
    }

    return "N/A";
  }

  const comparisonRows = useMemo(() => {
    const rows = comparisonData?.comparison || [];

    const search = searchText.trim().toLowerCase();

    return rows
      .filter((row) => {
        const actionMatch =
          !search ||
          String(row.action || "")
            .toLowerCase()
            .includes(search);

        const resultMatch =
          resultFilter === "All" ||
          row.result === resultFilter;

        return actionMatch && resultMatch;
      })
      .sort((a, b) => {
        const aResult = a.result || "";
        const bResult = b.result || "";

        if (aResult === "Worse" && bResult !== "Worse") {
          return -1;
        }

        if (aResult !== "Worse" && bResult === "Worse") {
          return 1;
        }

        const aDiff = Math.abs(Number(a.difference_percent || 0));
        const bDiff = Math.abs(Number(b.difference_percent || 0));

        return bDiff - aDiff;
      });
  }, [comparisonData, searchText, resultFilter]);

  const totalCompared = comparisonData?.total_actions || 0;

  const totalImproved = useMemo(() => {
    return (comparisonData?.comparison || []).filter(
      (row) => row.result === "Improved"
    ).length;
  }, [comparisonData]);

  const totalWorse = useMemo(() => {
    return (comparisonData?.comparison || []).filter(
      (row) => row.result === "Worse"
    ).length;
  }, [comparisonData]);

  const totalSame = useMemo(() => {
    return (comparisonData?.comparison || []).filter(
      (row) => row.result === "Same"
    ).length;
  }, [comparisonData]);

  const reportALabel = buildReportLabel(
    getReportByRunId(reportA)
  );

  const reportBLabel = buildReportLabel(
    getReportByRunId(reportB)
  );

  if (loadingReports) {
    return (
      <Container maxWidth="xl">
        <Box
          sx={{
            py: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="h6" fontWeight="bold">
            Loading reports...
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
                Compare Reports
              </Typography>
              <Typography sx={{ mt: 1, opacity: 0.9 }}>
                Compare KPI results between two performance reports.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                component={Link}
                to="/reports"
                variant="contained"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: "#0d47a1",
                  fontWeight: "bold",
                  borderRadius: 3,
                }}
              >
                Back to Reports
              </Button>

              <Button
                variant="contained"
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={loadReports}
                sx={{
                  color: "#0d47a1",
                  fontWeight: "bold",
                  borderRadius: 3,
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {reports.length < 2 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You need at least two reports to use the comparison page.
          </Alert>
        )}

        <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            Select Reports
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Choose two different reports. The comparison uses the 90th Percentil
            value from each report summary.
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <FormControl fullWidth>
              <InputLabel>Report A</InputLabel>
              <Select
                value={reportA}
                label="Report A"
                onChange={(event) => setReportA(event.target.value)}
              >
                {reports.map((report) => {
                  const runId = normalizeRunId(report);

                  return (
                    <MenuItem key={runId} value={runId}>
                      {buildReportLabel(report)}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Report B</InputLabel>
              <Select
                value={reportB}
                label="Report B"
                onChange={(event) => setReportB(event.target.value)}
              >
                {reports.map((report) => {
                  const runId = normalizeRunId(report);

                  return (
                    <MenuItem key={runId} value={runId}>
                      {buildReportLabel(report)}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<CompareArrowsIcon />}
              onClick={handleCompare}
              disabled={comparing || reports.length < 2}
              sx={{
                height: 56,
                minWidth: 180,
                borderRadius: 3,
                fontWeight: "bold",
                textTransform: "none",
              }}
            >
              {comparing ? "Comparing..." : "Compare"}
            </Button>
          </Stack>
        </Paper>

        {comparing && (
          <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={24} />
              <Typography color="text.secondary">
                Comparing selected reports...
              </Typography>
            </Stack>
          </Paper>
        )}

        {comparisonData && (
          <>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ mb: 4 }}
            >
              <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
                <Typography color="text.secondary" fontWeight="bold">
                  Compared Actions
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {totalCompared}
                </Typography>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
                <Typography color="text.secondary" fontWeight="bold">
                  Improved
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {totalImproved}
                </Typography>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
                <Typography color="text.secondary" fontWeight="bold">
                  Worse
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="error.main">
                  {totalWorse}
                </Typography>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
                <Typography color="text.secondary" fontWeight="bold">
                  Same
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="info.main">
                  {totalSame}
                </Typography>
              </Paper>
            </Stack>

            <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Selected Reports
              </Typography>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                divider={<Divider flexItem orientation="vertical" />}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight="bold" color="primary">
                    Report A
                  </Typography>
                  <Typography color="text.secondary">
                    {reportALabel}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight="bold" color="primary">
                    Report B
                  </Typography>
                  <Typography color="text.secondary">
                    {reportBLabel}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Filters
              </Typography>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  label="Search Action"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  fullWidth
                />

                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Result</InputLabel>
                  <Select
                    value={resultFilter}
                    label="Result"
                    onChange={(event) => setResultFilter(event.target.value)}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Improved">Improved</MenuItem>
                    <MenuItem value="Worse">Worse</MenuItem>
                    <MenuItem value="Same">Same</MenuItem>
                    <MenuItem value="N/A">N/A</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    setSearchText("");
                    setResultFilter("All");
                  }}
                  sx={{
                    height: 56,
                    minWidth: 120,
                    borderRadius: 3,
                    fontWeight: "bold",
                    textTransform: "none",
                  }}
                >
                  Clear
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ borderRadius: 4, overflow: "hidden" }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  KPI Comparison
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Differences are calculated using Report B compared to Report A.
                  Negative values mean improvement.
                </Typography>
              </Box>

              {comparisonRows.length === 0 ? (
                <Alert severity="info" sx={{ m: 3 }}>
                  No comparison rows found for the selected filters.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#eef3f8" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Action
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          KPI
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          Report A P90
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Report A Status
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          Report B P90
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Report B Status
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          Diff ms
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          Diff %
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Result
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {comparisonRows.map((row, index) => {
                        const reportAStatus =
                          row.report_a?.status || "NO KPI";

                        const reportBStatus =
                          row.report_b?.status || "NO KPI";

                        return (
                          <TableRow key={`${row.action}-${index}`} hover>
                            <TableCell>
                              <Typography fontWeight="bold">
                                {row.action || "-"}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              {formatNumber(row.kpi, 0)}
                            </TableCell>

                            <TableCell align="right">
                              {formatNumber(row.report_a?.p90)}
                            </TableCell>

                            <TableCell>
                              <Chip
                                size="small"
                                color={getStatusColor(reportAStatus)}
                                label={reportAStatus}
                                icon={getStatusIcon(reportAStatus)}
                              />
                            </TableCell>

                            <TableCell align="right">
                              {formatNumber(row.report_b?.p90)}
                            </TableCell>

                            <TableCell>
                              <Chip
                                size="small"
                                color={getStatusColor(reportBStatus)}
                                label={reportBStatus}
                                icon={getStatusIcon(reportBStatus)}
                              />
                            </TableCell>

                            <TableCell align="right">
                              {formatNumber(row.difference_ms)}
                            </TableCell>

                            <TableCell align="right">
                              {formatPercent(row.difference_percent)}
                            </TableCell>

                            <TableCell>
                              <Chip
                                size="small"
                                color={getResultColor(row.result)}
                                label={getResultLabel(row.result)}
                                sx={{ fontWeight: "bold" }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={1}
                sx={{ p: 2 }}
              >
                <Typography color="text.secondary">
                  Showing {comparisonRows.length} of {totalCompared} action(s)
                </Typography>

                <Typography color="text.secondary">
                  Ordered by regressions first, then highest percentage
                  difference.
                </Typography>
              </Stack>
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}

export default CompareReportsPage;