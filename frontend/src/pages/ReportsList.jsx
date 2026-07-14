import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
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
  Tooltip,
  Typography,
} from "@mui/material";

import AssessmentIcon from "@mui/icons-material/Assessment";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import TableChartIcon from "@mui/icons-material/TableChart";
import MemoryIcon from "@mui/icons-material/Memory";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

import api from "../services/api";

function ReportsList() {
  const [runs, setRuns] = useState([]);
  const [runFiles, setRunFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [versionFilter, setVersionFilter] = useState("All");
  const [buildFilter, setBuildFilter] = useState("All");
  const [suiteFilter, setSuiteFilter] = useState("All");
  const [environmentFilter, setEnvironmentFilter] = useState("All");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadRuns();
  }, []);

  function normalizeRunId(run) {
    if (typeof run === "string") {
      return run;
    }

    return run.run_id || run.id || run.name;
  }

  function extractRunNumber(runId) {
    const match = String(runId || "").match(/(\d+)/);

    if (!match) {
      return 0;
    }

    return Number(match[1]);
  }

  function formatDateFromRaw(dateRaw) {
    if (!dateRaw) {
      return "-";
    }

    const cleanDate = String(dateRaw).trim();

    if (cleanDate.length !== 8 || !/^\d+$/.test(cleanDate)) {
      return cleanDate;
    }

    const year = cleanDate.slice(0, 4);
    const month = cleanDate.slice(4, 6);
    const day = cleanDate.slice(6, 8);

    return `${Number(month)}/${Number(day)}/${year}`;
  }

  function parseMetadataFromFilename(filename) {
    if (!filename) {
      return {};
    }

    const cleanFilename = filename.replace(/\.[^/.]+$/, "");
    const parts = cleanFilename.split("_");

    const version = parts[0]?.trim() || "";
    const build = parts[1]?.trim() || "";
    const suiteRaw = parts[2]?.trim() || "";
    const environment = parts[3]?.trim() || "";
    const dateRaw = parts[4]?.trim() || "";

    const suite = suiteRaw.split(" - ")[0]?.trim() || suiteRaw;

    return {
      version,
      build,
      suite,
      environment,
      date_raw: dateRaw,
      date: formatDateFromRaw(dateRaw),
      source_file: filename,
    };
  }

  function getMetadataFromFiles(files) {
    const backendMetadata = files.metadata || {};

    if (
      backendMetadata.version ||
      backendMetadata.build ||
      backendMetadata.suite ||
      backendMetadata.environment ||
      backendMetadata.date
    ) {
      return backendMetadata;
    }

    const firstLoadFile = files.load_files?.[0];
    const firstCountersFile = files.counters_files?.[0];
    const firstFile = firstLoadFile || firstCountersFile;

    return parseMetadataFromFilename(firstFile);
  }

  async function loadRuns() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get("/runs");
      const runsData = response.data || [];

      setRuns(runsData);

      const filesMap = {};

      for (const run of runsData) {
        const runId = normalizeRunId(run);

        if (!runId) {
          continue;
        }

        try {
          const filesResponse = await api.get(`/runs/${runId}/files`);

          filesMap[runId] = filesResponse.data;
        } catch (error) {
          console.error(`Could not load files for ${runId}`, error);

          filesMap[runId] = {
            run_id: runId,
            load_files: [],
            counters_files: [],
            metadata: {},
          };
        }
      }

      setRunFiles(filesMap);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load reports/runs.");
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => {
    return runs
      .map((run) => {
        const runId = normalizeRunId(run);
        const files = runFiles[runId] || {};
        const metadata = getMetadataFromFiles(files);

        const loadCount = files.load_files?.length || 0;
        const countersCount = files.counters_files?.length || 0;
        const totalFiles = loadCount + countersCount;

        return {
          runId,
          version: metadata.version || run.version || run.Version || "-",
          build: metadata.build || run.build || run.Build || runId,
          suite: metadata.suite || run.suite || run.Suite || "-",
          environment:
            metadata.environment ||
            run.environment ||
            run.Environment ||
            "-",
          date: metadata.date || run.date || run.Date || "-",
          dateRaw: metadata.date_raw || "",
          status: totalFiles > 0 ? "Executed" : "Pending",
          loadCount,
          countersCount,
          totalFiles,
        };
      })
      .sort((a, b) => extractRunNumber(b.runId) - extractRunNumber(a.runId));
  }, [runs, runFiles]);

  const availableVersions = useMemo(() => {
    return [
      "All",
      ...new Set(rows.map((row) => row.version).filter(Boolean)),
    ];
  }, [rows]);

  const availableBuilds = useMemo(() => {
    return [
      "All",
      ...new Set(rows.map((row) => row.build).filter(Boolean)),
    ];
  }, [rows]);

  const availableSuites = useMemo(() => {
    return [
      "All",
      ...new Set(rows.map((row) => row.suite).filter(Boolean)),
    ];
  }, [rows]);

  const availableEnvironments = useMemo(() => {
    return [
      "All",
      ...new Set(rows.map((row) => row.environment).filter(Boolean)),
    ];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const versionMatch =
        versionFilter === "All" || row.version === versionFilter;

      const buildMatch =
        buildFilter === "All" || row.build === buildFilter;

      const suiteMatch =
        suiteFilter === "All" || row.suite === suiteFilter;

      const environmentMatch =
        environmentFilter === "All" ||
        row.environment === environmentFilter;

      let fromDateMatch = true;
      let toDateMatch = true;

      if (row.dateRaw && fromDate) {
        const rowDate = row.dateRaw;
        const from = fromDate.replaceAll("-", "");

        fromDateMatch = rowDate >= from;
      }

      if (row.dateRaw && toDate) {
        const rowDate = row.dateRaw;
        const to = toDate.replaceAll("-", "");

        toDateMatch = rowDate <= to;
      }

      const textMatch =
        !search ||
        String(row.runId || "").toLowerCase().includes(search) ||
        String(row.version || "").toLowerCase().includes(search) ||
        String(row.build || "").toLowerCase().includes(search) ||
        String(row.suite || "").toLowerCase().includes(search) ||
        String(row.environment || "").toLowerCase().includes(search) ||
        String(row.date || "").toLowerCase().includes(search) ||
        String(row.status || "").toLowerCase().includes(search);

      return (
        versionMatch &&
        buildMatch &&
        suiteMatch &&
        environmentMatch &&
        fromDateMatch &&
        toDateMatch &&
        textMatch
      );
    });
  }, [
    rows,
    fromDate,
    toDate,
    versionFilter,
    buildFilter,
    suiteFilter,
    environmentFilter,
    searchText,
  ]);

  function clearFilters() {
    setFromDate("");
    setToDate("");
    setVersionFilter("All");
    setBuildFilter("All");
    setSuiteFilter("All");
    setEnvironmentFilter("All");
    setSearchText("");
  }

  if (loading) {
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

          <Typography>
            Loading reports...
          </Typography>
        </Box>
      </Container>
    );
  }

  async function handleDelete(runId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this report?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/runs/${runId}`);

    await loadRuns();
  } catch (error) {
    console.error(error);

    alert("Could not delete report.");
  }
}

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Software
            </Typography>

            <Typography color="text.secondary">
              Performance report executions list.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadRuns}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Refresh
            </Button>

            <Button
              component={Link}
              to="/reports/compare"
              variant="outlined"
              startIcon={<CompareArrowsIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Compare Reports
            </Button>

            <Button
              component={Link}
              to="/upload"
              variant="contained"
              startIcon={<UploadFileIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Generate Report
            </Button>
          </Stack>
        </Stack>

        {errorMessage && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Filter Report
          </Typography>

          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <TextField
              label="From"
              type="date"
              size="small"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ minWidth: 150 }}
            />

            <TextField
              label="To"
              type="date"
              size="small"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ minWidth: 150 }}
            />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Version</InputLabel>

              <Select
                value={versionFilter}
                label="Version"
                onChange={(event) => setVersionFilter(event.target.value)}
              >
                {availableVersions.map((version) => (
                  <MenuItem key={version} value={version}>
                    {version}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Build</InputLabel>

              <Select
                value={buildFilter}
                label="Build"
                onChange={(event) => setBuildFilter(event.target.value)}
              >
                {availableBuilds.map((build) => (
                  <MenuItem key={build} value={build}>
                    {build}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Suite</InputLabel>

              <Select
                value={suiteFilter}
                label="Suite"
                onChange={(event) => setSuiteFilter(event.target.value)}
              >
                {availableSuites.map((suite) => (
                  <MenuItem key={suite} value={suite}>
                    {suite}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Environment</InputLabel>

              <Select
                value={environmentFilter}
                label="Environment"
                onChange={(event) =>
                  setEnvironmentFilter(event.target.value)
                }
              >
                {availableEnvironments.map((environment) => (
                  <MenuItem key={environment} value={environment}>
                    {environment}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              sx={{ minWidth: 220 }}
            />

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              sx={{
                height: 40,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Search
            </Button>

            <Button
              variant="outlined"
              color="warning"
              onClick={clearFilters}
              sx={{
                height: 40,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Clear
            </Button>
          </Stack>
        </Paper>

        {runs.length === 0 ? (
          <Alert severity="info">
            No reports found yet. Click <strong>Generate Report</strong> to
            upload files and create the first report automatically.
          </Alert>
        ) : (
          <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Version
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold", minWidth: 300 }}>
                      Build
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold" }}>
                      Suite
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold" }}>
                      Environment
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold" }}>
                      Date
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold" }}>
                      Files
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold" }}>
                      Status
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold", minWidth: 240 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.runId} hover>
                      <TableCell>
                        {row.version}
                      </TableCell>

                      <TableCell>
                        <Typography fontWeight="bold">
                          {row.build}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {row.suite}
                      </TableCell>

                      <TableCell>
                        {row.environment}
                      </TableCell>

                      <TableCell>
                        {row.date}
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Chip
                            size="small"
                            label={`${row.loadCount} Load`}
                            color="primary"
                            variant="outlined"
                          />

                          <Chip
                            size="small"
                            label={`${row.countersCount} Counters`}
                            color="secondary"
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={row.status}
                          color={row.status === "Executed" ? "success" : "warning"}
                          sx={{
                            fontWeight: "bold",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Open Summary">
                            <IconButton
                              component={Link}
                              to={`/report/${row.runId}/summary`}
                              color="primary"
                              size="small"
                            >
                              <AssessmentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Expand Report">
                            <IconButton
                              component={Link}
                              to={`/report/${row.runId}/details`}
                              color="primary"
                              size="small"
                            >
                              <TableChartIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Upload Files">
                            <IconButton
                              component={Link}
                              to={`/report/${row.runId}/upload`}
                              color="primary"
                              size="small"
                            >
                              <UploadFileIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Charts">
                            <IconButton
                              component={Link}
                              to={`/report/${row.runId}/charts`}
                              color="primary"
                              size="small"
                            >
                              <InsertChartIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Processes">
                            <IconButton
                              component={Link}
                              to={`/report/${row.runId}/processes`}
                              color="primary"
                              size="small"
                            >
                              <MemoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <span>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(row.runId)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={1}
              sx={{ p: 2 }}
            >
              <Typography color="text.secondary">
                Showing {filteredRows.length} of {rows.length} report(s)
              </Typography>

              <Typography color="text.secondary">
                Metadata is loaded from metadata.json or parsed from uploaded file names.
              </Typography>
            </Stack>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default ReportsList;