import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { useNavigate } from "react-router-dom";
import api from "../services/api";

function CompareReportsPage() {
  const navigate = useNavigate();

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

  const [reportSearchA, setReportSearchA] = useState("");
  const [reportSearchB, setReportSearchB] = useState("");

  const [versionFilter, setVersionFilter] = useState("ALL");
  const [buildFilter, setBuildFilter] = useState("ALL");
  const [suiteFilter, setSuiteFilter] = useState("ALL");
  const [environmentFilter, setEnvironmentFilter] = useState("ALL");

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

      setReportA("");
      setReportB("");
      setReportSearchA("");
      setReportSearchB("");

      setVersionFilter("ALL");
      setBuildFilter("ALL");
      setSuiteFilter("ALL");
      setEnvironmentFilter("ALL");

      setSearchText("");
      setResultFilter("All");

      setComparisonData(null);
      setSuccessMessage("");
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

    return report?.run_id || report?.runId || report?.id || report?.name || "";
  }

  function buildReportLabel(report) {
    if (!report) {
      return "Unknown report";
    }

    const runId = normalizeRunId(report);

    const version = report.version || report.Version || "-";
    const build = report.build || report.Build || "-";
    const suite = report.suite || report.Suite || "-";
    const environment = report.environment || report.Environment || "-";
    const date = report.date || report.Date || "-";

    const hasMetadata =
      version !== "-" ||
      build !== "-" ||
      suite !== "-" ||
      environment !== "-" ||
      date !== "-";

    if (!hasMetadata) {
      return runId;
    }

    return [version, build, suite, environment, date]
      .filter(Boolean)
      .join(" | ");
  }

  function buildReportSearchText(report) {
    const runId = normalizeRunId(report);
    const label = buildReportLabel(report);

    return [
      runId,
      label,
      report?.version,
      report?.Version,
      report?.build,
      report?.Build,
      report?.suite,
      report?.Suite,
      report?.environment,
      report?.Environment,
      report?.date,
      report?.Date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function getReportByRunId(runId) {
    return reports.find((report) => normalizeRunId(report) === runId) || null;
  }

  function filterReportsBySearch(sourceReports, searchValue) {
    const search = String(searchValue || "")
      .trim()
      .toLowerCase();

    if (!search) {
      return sourceReports;
    }

    return sourceReports.filter((report) =>
      buildReportSearchText(report).includes(search)
    );
  }

  function getNumber(value) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  function getSafeNumber(value, fallback = 0) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
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

  function getComparisonResult(differencePercent) {
    const value = getSafeNumber(differencePercent, 0);

    if (value < -0.01) {
      return "Improved";
    }

    if (value > 0.01) {
      return "Worse";
    }

    return "Same";
  }

  function normalizeComparisonResponse(rawData) {
    if (!rawData) {
      return {
        comparison: [],
        total_actions: 0,
      };
    }

    if (rawData.error || rawData.traceback || rawData.context === "compare") {
      throw new Error(
        rawData.error ||
          "Backend returned an error while comparing reports."
      );
    }

    const rawRows =
      rawData.comparison ||
      rawData.comparisons ||
      rawData.records ||
      rawData.rows ||
      rawData.data ||
      [];

    const rows = Array.isArray(rawRows) ? rawRows : [];

    const normalizedRows = rows.map((row) => {
      const action =
        row.action ||
        row.Action ||
        row.ActionName ||
        row.action_name ||
        "-";

      const hardware =
        row.hardware ||
        row.Hardware ||
        row.HardwareName ||
        row.Machine ||
        row.Device ||
        row.Client ||
        "Unknown Hardware";

      const kpi =
        row.kpi ??
        row.KPI ??
        row.Kpi ??
        row.KPI_A ??
        row.KPI_B ??
        0;

      const reportAP90 = getSafeNumber(
        row.report_a?.p90 ??
          row.P90_A ??
          row.ReportA_P90 ??
          row.Report_A_P90 ??
          row["Report A P90"] ??
          row["90th Percentil_A"] ??
          row["90th Percentile_A"] ??
          row.p90_a,
        0
      );

      const reportBP90 = getSafeNumber(
        row.report_b?.p90 ??
          row.P90_B ??
          row.ReportB_P90 ??
          row.Report_B_P90 ??
          row["Report B P90"] ??
          row["90th Percentil_B"] ??
          row["90th Percentile_B"] ??
          row.p90_b,
        0
      );

      const differenceMs = reportBP90 - reportAP90;

      const differencePercent =
        reportAP90 > 0
          ? ((reportBP90 - reportAP90) / reportAP90) * 100
          : 0;

      const result = getComparisonResult(differencePercent);

      return {
        action,
        hardware,
        kpi,
        report_a: {
          p90: reportAP90,
        },
        report_b: {
          p90: reportBP90,
        },
        difference_ms: differenceMs,
        difference_percent: differencePercent,
        result,
        raw: row,
      };
    });

    return {
      ...rawData,
      comparison: normalizedRows,
      total_actions:
        rawData.total_actions ??
        rawData.totalActions ??
        rawData.total ??
        normalizedRows.length,
    };
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
    setComparisonData(null);

    try {
      const response = await api.get("/reports/compare", {
        params: {
          report_a: reportA,
          report_b: reportB,
        },
      });

      console.log("COMPARE RAW RESPONSE:", response.data);

      const normalizedData = normalizeComparisonResponse(response.data);

      console.log("COMPARE NORMALIZED RESPONSE:", normalizedData);

      setComparisonData(normalizedData);

      if (!normalizedData.comparison.length) {
        setSuccessMessage("");
        setErrorMessage(
          "Compare completed, but no comparison rows were available to display."
        );
        return;
      }

      setSuccessMessage("Reports compared successfully.");
    } catch (error) {
      console.error("COMPARE ERROR:", error);

      setComparisonData(null);
      setSuccessMessage("");

      const detail = error?.response?.data?.detail;

      const message =
        typeof detail === "string"
          ? detail
          : detail?.error ||
            detail?.message ||
            error.message ||
            "Could not compare reports. Please check if the backend endpoint /reports/compare is working.";

      setErrorMessage(message);
    } finally {
      setComparing(false);
    }
  }

  function exportExcel() {
    if (!comparisonRows.length) {
      return;
    }

    const rows = comparisonRows.map((row) => ({
      Action: row.action,
      Hardware: row.hardware,
      KPI: row.kpi,
      Report_A_P90: row.report_a?.p90,
      Report_B_P90: row.report_b?.p90,
      Diff_ms: row.difference_ms,
      Diff_Percent: row.difference_percent,
      Result: row.result,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Comparison");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `Compare_${reportA}_vs_${reportB}.xlsx`);
  }

  const availableVersions = useMemo(() => {
    return [
      ...new Set(
        reports.map((report) => report.version || report.Version).filter(Boolean)
      ),
    ].sort();
  }, [reports]);

  const availableBuilds = useMemo(() => {
    return [
      ...new Set(
        reports.map((report) => report.build || report.Build).filter(Boolean)
      ),
    ].sort();
  }, [reports]);

  const availableSuites = useMemo(() => {
    return [
      ...new Set(
        reports.map((report) => report.suite || report.Suite).filter(Boolean)
      ),
    ].sort();
  }, [reports]);

  const availableEnvironments = useMemo(() => {
    return [
      ...new Set(
        reports
          .map((report) => report.environment || report.Environment)
          .filter(Boolean)
      ),
    ].sort();
  }, [reports]);

  const metadataFilteredReports = useMemo(() => {
    return reports.filter((report) => {
      const version = report.version || report.Version;
      const build = report.build || report.Build;
      const suite = report.suite || report.Suite;
      const environment = report.environment || report.Environment;

      return (
        (versionFilter === "ALL" || version === versionFilter) &&
        (buildFilter === "ALL" || build === buildFilter) &&
        (suiteFilter === "ALL" || suite === suiteFilter) &&
        (environmentFilter === "ALL" || environment === environmentFilter)
      );
    });
  }, [
    reports,
    versionFilter,
    buildFilter,
    suiteFilter,
    environmentFilter,
  ]);

  const filteredReportsA = useMemo(
    () => filterReportsBySearch(metadataFilteredReports, reportSearchA),
    [metadataFilteredReports, reportSearchA]
  );

  const filteredReportsB = useMemo(
    () => filterReportsBySearch(metadataFilteredReports, reportSearchB),
    [metadataFilteredReports, reportSearchB]
  );

  const comparisonRows = useMemo(() => {
    const rows = comparisonData?.comparison || [];
    const search = searchText.trim().toLowerCase();

    return rows
      .filter((row) => {
        const searchableText = `${row.action || ""} ${row.hardware || ""}`
          .toLowerCase();

        const searchMatch = !search || searchableText.includes(search);

        const resultMatch =
          resultFilter === "All" || row.result === resultFilter;

        return searchMatch && resultMatch;
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

  const groupedComparison = useMemo(() => {
    const groups = {};

    comparisonRows.forEach((row) => {
      const action = row.action || "Unknown Action";

      if (!groups[action]) {
        groups[action] = [];
      }

      groups[action].push(row);
    });

    return groups;
  }, [comparisonRows]);

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

  const reportALabel = buildReportLabel(getReportByRunId(reportA));
  const reportBLabel = buildReportLabel(getReportByRunId(reportB));

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
    <Box
      sx={{
        background: "linear-gradient(135deg,#FFFFFF 0%, #F1F8E9 100%)",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Paper
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 8,
            background: "linear-gradient(135deg,#FFFFFF 0%, #F8FBF8 100%)",
            border: "1px solid #E8F5E9",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  color: "#1C2526",
                }}
              >
                Compare Reports
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: "#607D8B",
                }}
              >
                Compare KPI results between two performance reports by Action
                and Hardware.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/reports")}
                sx={{
                  backgroundColor: "#FFFFFF",
                  color: "#2E7D32",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#F1F8E9",
                  },
                }}
              >
                Back to Reports
              </Button>

              <Button
                startIcon={<RefreshIcon />}
                onClick={() => {
                  loadReports();

                  setComparisonData(null);

                  setReportA("");
                  setReportB("");

                  setReportSearchA("");
                  setReportSearchB("");

                  setVersionFilter("ALL");
                  setBuildFilter("ALL");
                  setSuiteFilter("ALL");
                  setEnvironmentFilter("ALL");

                  setSearchText("");
                  setResultFilter("All");

                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                sx={{
                  backgroundColor: "#FFFFFF",
                  color: "#2E7D32",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#F1F8E9",
                  },
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

          <Typography color="text.secondary" sx={{ mb: 1 }}>
            Choose two different reports. The comparison uses the 90th Percentil
            value from each report grouped by Action and Hardware.
          </Typography>

          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
            {reports.length} report(s) available. Type version, bundle, suite,
            environment, date or run id to find a report faster.
          </Typography>

          <Stack spacing={3}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Version</InputLabel>

                <Select
                  value={versionFilter}
                  label="Version"
                  onChange={(event) => setVersionFilter(event.target.value)}
                >
                  <MenuItem value="ALL">All</MenuItem>

                  {availableVersions.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Build</InputLabel>

                <Select
                  value={buildFilter}
                  label="Build"
                  onChange={(event) => setBuildFilter(event.target.value)}
                >
                  <MenuItem value="ALL">All</MenuItem>

                  {availableBuilds.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Suite</InputLabel>

                <Select
                  value={suiteFilter}
                  label="Suite"
                  onChange={(event) => setSuiteFilter(event.target.value)}
                >
                  <MenuItem value="ALL">All</MenuItem>

                  {availableSuites.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>

                <Select
                  value={environmentFilter}
                  label="Environment"
                  onChange={(event) => setEnvironmentFilter(event.target.value)}
                >
                  <MenuItem value="ALL">All</MenuItem>

                  {availableEnvironments.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Autocomplete
                fullWidth
                options={filteredReportsA}
                value={getReportByRunId(reportA)}
                inputValue={reportSearchA}
                getOptionLabel={(option) => buildReportLabel(option)}
                isOptionEqualToValue={(option, value) =>
                  normalizeRunId(option) === normalizeRunId(value)
                }
                noOptionsText="No reports found"
                onInputChange={(_, newInputValue) => {
                  setReportSearchA(newInputValue);
                }}
                onChange={(_, selectedReport) => {
                  setReportA(
                    selectedReport ? normalizeRunId(selectedReport) : ""
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Report A"
                    placeholder="Select Report A"
                  />
                )}
              />

              <Autocomplete
                fullWidth
                options={filteredReportsB}
                value={getReportByRunId(reportB)}
                inputValue={reportSearchB}
                getOptionLabel={(option) => buildReportLabel(option)}
                isOptionEqualToValue={(option, value) =>
                  normalizeRunId(option) === normalizeRunId(value)
                }
                noOptionsText="No reports found"
                onInputChange={(_, newInputValue) => {
                  setReportSearchB(newInputValue);
                }}
                onChange={(_, selectedReport) => {
                  setReportB(
                    selectedReport ? normalizeRunId(selectedReport) : ""
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Report B"
                    placeholder="Select Report B"
                  />
                )}
              />

              <Button
                onClick={handleCompare}
                disabled={comparing || reports.length < 2}
                startIcon={<CompareArrowsIcon />}
                sx={{
                  backgroundColor: "#4CAF50",
                  color: "#FFFFFF",
                  minWidth: 160,
                  height: 56,
                  textTransform: "none",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#43A047",
                  },
                }}
              >
                {comparing ? "Comparing..." : "Compare"}
              </Button>
            </Stack>
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
                  Compared Rows
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

                  <Typography color="text.secondary">{reportALabel}</Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight="bold" color="primary">
                    Report B
                  </Typography>

                  <Typography color="text.secondary">{reportBLabel}</Typography>
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
                  label="Search Action or Hardware"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  fullWidth
                />

                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Change</InputLabel>

                  <Select
                    value={resultFilter}
                    label="Change"
                    onChange={(event) => setResultFilter(event.target.value)}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Improved">Improved</MenuItem>
                    <MenuItem value="Worse">Worse</MenuItem>
                    <MenuItem value="Same">Same</MenuItem>
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

                <Button
                  variant="contained"
                  color="success"
                  onClick={exportExcel}
                  disabled={!comparisonRows.length}
                  sx={{
                    height: 56,
                    minWidth: 140,
                    borderRadius: 3,
                    fontWeight: "bold",
                    textTransform: "none",
                  }}
                >
                  Export Excel
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ borderRadius: 4, overflow: "hidden" }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  KPI Comparison by Action and Hardware
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Differences are calculated using Report B compared to Report A.
                  Negative values (green) indicate improvement. Positive values
                  (red) indicate regression.
                </Typography>
              </Box>

              {comparisonRows.length === 0 ? (
                <Alert severity="info" sx={{ m: 3 }}>
                  No comparison rows found for the selected filters.
                </Alert>
              ) : (
                <Box sx={{ p: 2 }}>
                  {Object.entries(groupedComparison).map(([action, rows]) => (
                    <Paper
                      key={action}
                      sx={{
                        mb: 4,
                        p: 3,
                        borderRadius: 4,
                        backgroundColor: "#ffffff",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          color="success.main"
                        >
                          {action}
                        </Typography>

                        <Chip
                          label={`${rows.length} hardware result(s)`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Stack>

                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Comparison results for this action.
                      </Typography>

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
                                <strong>Report A P90</strong>
                              </TableCell>

                              <TableCell align="right">
                                <strong>Report B P90</strong>
                              </TableCell>

                              <TableCell align="right">
                                <strong>Diff ms</strong>
                              </TableCell>

                              <TableCell align="right">
                                <strong>Diff %</strong>
                              </TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {rows.map((row, index) => (
                              <TableRow
                                key={`${row.action}-${row.hardware}-${index}`}
                                hover
                              >
                                <TableCell>{row.hardware || "-"}</TableCell>

                                <TableCell align="right">
                                  {formatNumber(row.kpi, 0)}
                                </TableCell>

                                <TableCell align="right">
                                  {formatNumber(row.report_a?.p90)}
                                </TableCell>

                                <TableCell align="right">
                                  {formatNumber(row.report_b?.p90)}
                                </TableCell>

                                <TableCell
                                  align="right"
                                  sx={{
                                    color:
                                      row.difference_ms > 0
                                        ? "error.main"
                                        : row.difference_ms < 0
                                        ? "success.main"
                                        : "text.primary",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {formatNumber(row.difference_ms)}
                                </TableCell>

                                <TableCell
                                  align="right"
                                  sx={{
                                    color:
                                      row.difference_percent > 0
                                        ? "error.main"
                                        : row.difference_percent < 0
                                        ? "success.main"
                                        : "text.primary",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {formatPercent(row.difference_percent)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  ))}
                </Box>
              )}

              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={1}
                sx={{ p: 2 }}
              >
                <Typography color="text.secondary">
                  Showing {comparisonRows.length} of {totalCompared} row(s)
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