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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
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

  const [versionFilter, setVersionFilter] =
  useState("ALL");

const [buildFilter, setBuildFilter] =
  useState("ALL");

const [suiteFilter, setSuiteFilter] =
  useState("ALL");

const [environmentFilter, setEnvironmentFilter] =
  useState("ALL");

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

      // Reset screen
      setReportA("");
      setReportB("");

      setReportSearchA("");
      setReportSearchB("");

      setVersionFilter("ALL");
      setBuildFilter("ALL");
      setSuiteFilter("ALL");
      setEnvironmentFilter("ALL");

      setComparisonData(null);

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

function filterReportsBySearch(
  sourceReports,
  searchValue
) {

  const search =
    String(searchValue || "")
      .trim()
      .toLowerCase();

  if (!search) {
    return sourceReports;
  }

  return sourceReports.filter(
    (report) =>
      buildReportSearchText(report)
        .includes(search)
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

  function exportExcel() {

  if (!comparisonRows.length) {
    return;
  }

  const rows = comparisonRows.map(
    (row) => ({
      Action: row.action,
      KPI: row.kpi,

      Report_A_P90:
        row.report_a?.p90,

      Report_A_Status:
        row.report_a?.status,

      Report_B_P90:
        row.report_b?.p90,

      Report_B_Status:
        row.report_b?.status,

      Diff_ms:
        row.difference_ms,

      Diff_Percent:
        row.difference_percent,

      Result:
        row.result,
    })
  );

  const worksheet =
    XLSX.utils.json_to_sheet(rows);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Comparison"
  );

  const excelBuffer =
    XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

  const blob = new Blob(
    [excelBuffer],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );

  saveAs(
    blob,
    `Compare_${reportA}_vs_${reportB}.xlsx`
  );
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

  const availableVersions =
  useMemo(() => {

    return [
      ...new Set(
        reports
          .map(
            r =>
              r.version ||
              r.Version
          )
          .filter(Boolean)
      ),
    ].sort();

  }, [reports]);

const availableBuilds =
  useMemo(() => {

    return [
      ...new Set(
        reports
          .map(
            r =>
              r.build ||
              r.Build
          )
          .filter(Boolean)
      ),
    ].sort();

  }, [reports]);

const availableSuites =
  useMemo(() => {

    return [
      ...new Set(
        reports
          .map(
            r =>
              r.suite ||
              r.Suite
          )
          .filter(Boolean)
      ),
    ].sort();

  }, [reports]);

const availableEnvironments =
  useMemo(() => {

    return [
      ...new Set(
        reports
          .map(
            r =>
              r.environment ||
              r.Environment
          )
          .filter(Boolean)
      ),
    ].sort();

  }, [reports]);

const metadataFilteredReports = useMemo(() => {

    return reports.filter(
      (report) => {

        const version =
          report.version ||
          report.Version;

        const build =
          report.build ||
          report.Build;

        const suite =
          report.suite ||
          report.Suite;

        const environment =
          report.environment ||
          report.Environment;

        return (
          (versionFilter === "ALL" ||
            version === versionFilter) &&

          (buildFilter === "ALL" ||
            build === buildFilter) &&

          (suiteFilter === "ALL" ||
            suite === suiteFilter) &&

          (environmentFilter === "ALL" ||
            environment === environmentFilter)

        );
      }
    );

  }, [
    reports,
    versionFilter,
    buildFilter,
    suiteFilter,
    environmentFilter,
  ]);

    const filteredReportsA =
  useMemo(
    () =>
      filterReportsBySearch(
        metadataFilteredReports,
        reportSearchA
      ),
    [
      metadataFilteredReports,
      reportSearchA,
    ]
  );
    

const filteredReportsB =
  useMemo(
    () =>
      filterReportsBySearch(
        metadataFilteredReports,
        reportSearchB
      ),
    [
      metadataFilteredReports,
      reportSearchB,
    ]
  );


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
          resultFilter === "All" || row.result === resultFilter;

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
                Compare KPI results between two performance reports.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/reports")}
                sx={{
                  backgroundColor: "#FFFFFF",
                  color: "#2E7D32",
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

  setSuccessMessage("");
  setErrorMessage("");
}}
                sx={{
                  backgroundColor: "#FFFFFF",
                  color: "#2E7D32",
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
            value from each report summary.
          </Typography>

          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
            {reports.length} report(s) available. Type version, bundle, suite,
            environment, date or run id to find a report faster.
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >

            <Stack
  direction={{
    xs: "column",
    md: "row",
  }}
  spacing={2}
  sx={{ mb: 3 }}
>

  {/* Version */}
  <FormControl fullWidth>
    <InputLabel>
      Version
    </InputLabel>

    <Select
      value={versionFilter}
      label="Version"
      onChange={(event) =>
        setVersionFilter(
          event.target.value
        )
      }
    >
      <MenuItem value="ALL">
        All
      </MenuItem>

      {availableVersions.map(
        (item) => (
          <MenuItem
            key={item}
            value={item}
          >
            {item}
          </MenuItem>
        )
      )}
    </Select>
  </FormControl>

  {/* Build */}
  <FormControl fullWidth>
    <InputLabel>
      Build
    </InputLabel>

    <Select
      value={buildFilter}
      label="Build"
      onChange={(event) =>
        setBuildFilter(
          event.target.value
        )
      }
    >
      <MenuItem value="ALL">
        All
      </MenuItem>

      {availableBuilds.map(
        (item) => (
          <MenuItem
            key={item}
            value={item}
          >
            {item}
          </MenuItem>
        )
      )}
    </Select>
  </FormControl>

  {/* Suite */}
  <FormControl fullWidth>
    <InputLabel>
      Suite
    </InputLabel>

    <Select
      value={suiteFilter}
      label="Suite"
      onChange={(event) =>
        setSuiteFilter(
          event.target.value
        )
      }
    >
      <MenuItem value="ALL">
        All
      </MenuItem>

      {availableSuites.map(
        (item) => (
          <MenuItem
            key={item}
            value={item}
          >
            {item}
          </MenuItem>
        )
      )}
    </Select>
  </FormControl>

  {/* Environment */}
  <FormControl fullWidth>
    <InputLabel>
      Environment
    </InputLabel>

    <Select
      value={environmentFilter}
      label="Environment"
      onChange={(event) =>
        setEnvironmentFilter(
          event.target.value
        )
      }
    >
      <MenuItem value="ALL">
        All
      </MenuItem>

      {availableEnvironments.map(
        (item) => (
          <MenuItem
            key={item}
            value={item}
          >
            {item}
          </MenuItem>
        )
      )}
    </Select>
  </FormControl>

</Stack>

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
                setReportA(selectedReport ? normalizeRunId(selectedReport) : "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Report A"
                  placeholder="Search by version, bundle, SESRM, environment or date"
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
                setReportB(selectedReport ? normalizeRunId(selectedReport) : "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Report B"
                  placeholder="Search by version, bundle, SESRM, environment or date"
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
                "&:hover": {
                  backgroundColor: "#43A047",
                },
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

                <Button
                  variant="contained"
                  color="success"
                  onClick={exportExcel}
                  disabled={!comparisonRows.length}
                >
                  Export Excel
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
                        <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
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
                        <TableCell sx={{ fontWeight: "bold" }}>Result</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {comparisonRows.map((row, index) => {
                        const reportAStatus = row.report_a?.status || "NO KPI";
                        const reportBStatus = row.report_b?.status || "NO KPI";

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
                  Ordered by regressions first, then highest percentage difference.
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