import { useEffect, useMemo, useState } from "react";

import api from "../services/api";

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RefreshIcon from "@mui/icons-material/Refresh";

function RunUploadPanel({
  runId,
  onRunChange,
  onRunDataChanged,
}) {
  const [runs, setRuns] = useState([]);
  const [runsFilesMap, setRunsFilesMap] = useState({});

  const [loadFiles, setLoadFiles] = useState([]);
  const [countersFiles, setCountersFiles] = useState([]);
  const [runFiles, setRunFiles] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(runId || "");
  const [processesFile, setProcessesFile] = useState(null);

  const [uploadingProcesses, setUploadingProcesses] =
    useState(false);

  const [creatingRun, setCreatingRun] = useState(false);
  const [uploadingLoad, setUploadingLoad] = useState(false);
  const [uploadingCounters, setUploadingCounters] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadRuns();
  }, []);

  useEffect(() => {
  if (runId) {
    setSelectedRunId(runId);
  }
}, [runId]);

  useEffect(() => {
    if (runId && runId !== selectedRunId) {
      setSelectedRunId(runId);
      loadRunFiles(runId);
    }
  }, [runId]);

  useEffect(() => {
    if (selectedRunId) {
      loadRunFiles(selectedRunId);
    }
  }, [selectedRunId]);

  function normalizeRunId(run) {
    if (typeof run === "string") {
      return run;
    }

    return run?.run_id || run?.id || run?.name || "";
  }

  function extractRunNumber(currentRunId) {
    const match = String(currentRunId || "").match(/(\d+)/);

    if (!match) {
      return 0;
    }

    return Number(match[1]);
  }

  function sortRunsByNewest(runsData) {
    return [...runsData].sort((a, b) => {
      const runA = normalizeRunId(a);
      const runB = normalizeRunId(b);

      return extractRunNumber(runB) - extractRunNumber(runA);
    });
  }

  function getApiErrorMessage(error, fallbackMessage) {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (detail?.message) {
      return detail.message;
    }

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.message) {
      return `${fallbackMessage} Technical detail: ${error.message}`;
    }

    return fallbackMessage;
  }

  function formatDateFromRaw(dateRaw) {
    if (!dateRaw) {
      return "";
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
    const backendMetadata = files?.metadata || {};

    if (
      backendMetadata.version ||
      backendMetadata.build ||
      backendMetadata.suite ||
      backendMetadata.environment ||
      backendMetadata.date
    ) {
      return backendMetadata;
    }

    const firstLoadFile = files?.load_files?.[0];
    const firstCountersFile = files?.counters_files?.[0];
    const firstFile = firstLoadFile || firstCountersFile;

    return parseMetadataFromFilename(firstFile);
  }

  function hasMetadata(metadata) {
    return Boolean(
      metadata?.version ||
        metadata?.build ||
        metadata?.suite ||
        metadata?.environment ||
        metadata?.date
    );
  }

  const selectedFilesMetadata = useMemo(() => {
    const firstSelectedLoadFile = loadFiles?.[0]?.name;
    const firstSelectedCountersFile = countersFiles?.[0]?.name;

    const firstSelectedFile =
      firstSelectedLoadFile || firstSelectedCountersFile;

    return parseMetadataFromFilename(firstSelectedFile);
  }, [loadFiles, countersFiles]);

  const selectedReportMetadata = useMemo(() => {
    const metadataFromCurrentReport = getMetadataFromFiles(runFiles);

    if (hasMetadata(metadataFromCurrentReport)) {
      return metadataFromCurrentReport;
    }

    return selectedFilesMetadata;
  }, [runFiles, selectedFilesMetadata]);

  function buildReportLabel(run) {
    const currentRunId = normalizeRunId(run);

    if (!currentRunId) {
      return "Select a report";
    }

    const files = runsFilesMap[currentRunId];
    const metadata = getMetadataFromFiles(files);

    if (hasMetadata(metadata)) {
      return [
        metadata.version,
        metadata.build,
        metadata.suite,
        metadata.environment,
        metadata.date,
      ]
        .filter(Boolean)
        .join(" | ");
    }

    return `New Report (${currentRunId})`;
  }

  function addTemporaryRunToList(newRunId) {
    setRuns((currentRuns) => {
      const alreadyExists = currentRuns.some(
        (run) => normalizeRunId(run) === newRunId
      );

      if (alreadyExists) {
        return currentRuns;
      }

      return [
        { id: newRunId },
        ...currentRuns,
      ];
    });

    setRunsFilesMap((current) => ({
      ...current,
      [newRunId]: {
        run_id: newRunId,
        load_files: [],
        counters_files: [],
        metadata: {},
      },
    }));
  }

async function loadRuns(keepSelectedRunId = null) {
  try {
    const response = await api.get("/runs");

    const runsData = response.data || [];

    const orderedRuns = sortRunsByNewest(runsData);

    const filesMap = {};

    for (const run of orderedRuns) {
      const currentRunId = normalizeRunId(run);

      if (!currentRunId) {
        continue;
      }

      try {
        const filesResponse = await api.get(
          `/runs/${currentRunId}/files`
        );

        filesMap[currentRunId] = filesResponse.data;
      } catch (error) {
        console.error(
          `Could not load files for ${currentRunId}`,
          error
        );

        filesMap[currentRunId] = {
          run_id: currentRunId,
          load_files: [],
          counters_files: [],
          metadata: {},
        };
      }
    }

    setRunsFilesMap(filesMap);

    // IMPORTANT: update reports AFTER map
    setRuns(orderedRuns);

    // preserve selected report
    if (
      keepSelectedRunId &&
      orderedRuns.some(
        (r) =>
          normalizeRunId(r) === keepSelectedRunId
      )
    ) {
      setSelectedRunId(keepSelectedRunId);
    }

  } catch (error) {
    console.error(error);

    setErrorMessage(
      getApiErrorMessage(
        error,
        "Could not load reports."
      )
    );
  }
}

  async function loadRunFiles(currentRunId) {
    if (!currentRunId) {
      return;
    }

    try {
      const response = await api.get(`/runs/${currentRunId}/files`);

      setRunFiles(response.data);

      setRunsFilesMap((current) => ({
        ...current,
        [currentRunId]: response.data,
      }));
    } catch (error) {
      console.error(error);

      setRunFiles({
        run_id: currentRunId,
        load_files: [],
        counters_files: [],
        metadata: {},
      });
    }
  }

  async function createRun() {
  setCreatingRun(true);
  setMessage("");
  setErrorMessage("");

  try {
    const response = await api.post("/runs/create");

    const newRunId = response.data.run_id;

    addTemporaryRunToList(newRunId);

    setSelectedRunId(newRunId);

    setRunFiles({
      run_id: newRunId,
      load_files: [],
      counters_files: [],
      metadata: {},
    });

    setLoadFiles([]);
    setCountersFiles([]);
    setProcessesFile(null);

    if (onRunChange) {
      onRunChange(newRunId);
    }

    setMessage(
      "New report was prepared. Upload the first file to complete the report information."
    );

    await loadRuns(newRunId);
    await loadRunFiles(newRunId);

    setSelectedRunId(newRunId);

    // GARANTE QUE O NOVO REPORT CONTINUE SELECIONADO
    setSelectedRunId(newRunId);

    setRunFiles({
      run_id: newRunId,
      load_files: [],
      counters_files: [],
      metadata: {},
    });

  } catch (error) {
    console.error(error);

    setErrorMessage(
      getApiErrorMessage(
        error,
        "Could not prepare a new report."
      )
    );
    console.log(
        "NEW REPORT CREATED:",
        newRunId
      );

      console.log(
        "SELECTED REPORT:",
        newRunId
      );
  } finally {
    setCreatingRun(false);
  }
}

  async function ensureRunExists() {
    if (selectedRunId) {
      return selectedRunId;
    }

    const response = await api.post("/runs/create");
    const newRunId = response.data.run_id;

    addTemporaryRunToList(newRunId);

    setSelectedRunId(newRunId);

    setRunFiles({
      run_id: newRunId,
      load_files: [],
      counters_files: [],
      metadata: {},
    });

    setLoadFiles([]);
    setCountersFiles([]);
    setProcessesFile(null);

    if (onRunChange) {
      onRunChange(newRunId);
    }

    setMessage(
      "New report was created automatically. Upload completed using this report."
    );

    await loadRuns();
    await loadRunFiles(newRunId);

    return newRunId;
  }

  async function uploadLoadFiles() {
    if (!loadFiles || loadFiles.length === 0) {
      setErrorMessage("Please select at least one Load CSV file.");
      return;
    }

    const currentRunId = await ensureRunExists();

    setUploadingLoad(true);
    setMessage("");
    setErrorMessage("");

    try {
      for (const file of loadFiles) {
        const formData = new FormData();

        formData.append("file", file);

        await api.post(
        `/runs/${currentRunId}/upload/load`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      setMessage("Load files uploaded successfully.");
      setLoadFiles([]);

      await loadRunFiles(currentRunId);
      await loadRuns();

      setSelectedRunId(currentRunId);

      if (onRunChange) {
        onRunChange(currentRunId);
      }

      if (onRunDataChanged) {
        await onRunDataChanged(currentRunId);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        getApiErrorMessage(error, "Could not upload Load files.")
      );
    } finally {
      setUploadingLoad(false);
    }
  }

  async function uploadCountersFiles() {
    if (!countersFiles || countersFiles.length === 0) {
      setErrorMessage("Please select at least one Counters CSV file.");
      return;
    }

    const currentRunId = await ensureRunExists();

    setUploadingCounters(true);
    setMessage("");
    setErrorMessage("");

    try {
      for (const file of countersFiles) {
        const formData = new FormData();

        formData.append("file", file);

        await api.post(
          `/runs/${currentRunId}/upload/counters-file`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      setMessage("Counters files uploaded successfully.");
      setCountersFiles([]);

      await loadRunFiles(currentRunId);
      await loadRuns();

      setSelectedRunId(currentRunId);

      if (onRunChange) {
        onRunChange(currentRunId);
      }

      if (onRunDataChanged) {
        await onRunDataChanged(currentRunId);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        getApiErrorMessage(error, "Could not upload Counters files.")
      );
    } finally {
      setUploadingCounters(false);
    }
  }

  async function uploadProcessesFile() {
  if (!processesFile) {
    setErrorMessage(
      "Please select a Processes JSON file."
    );
    return;
  }

  const currentRunId =
    await ensureRunExists();

  setUploadingProcesses(true);

  setMessage("");
  setErrorMessage("");

  try {
    const formData = new FormData();

    formData.append(
      "file",
      processesFile
    );

    await api.post(
      `/runs/${currentRunId}/upload/processes-file`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    setMessage(
      "Processes JSON uploaded successfully."
    );

    setProcessesFile(null);

    await loadRunFiles(currentRunId);

    if (onRunDataChanged) {
      await onRunDataChanged(
        currentRunId
      );
    }
  } catch (error) {
    console.error(error);

    setErrorMessage(
      getApiErrorMessage(error, "Could not upload Processes JSON.")
    );
  } finally {
    setUploadingProcesses(false);
  }
}

  async function handleRunChange(currentSelectedRunId) {
    setSelectedRunId(currentSelectedRunId);

    if (onRunChange) {
      onRunChange(currentSelectedRunId);
    }

    await loadRunFiles(currentSelectedRunId);

    if (onRunDataChanged) {
      await onRunDataChanged(currentSelectedRunId);
    }
  }

  return (
    <Paper sx={{ mt: 4, p: 3, borderRadius: 4 }}>
      <Typography variant="h4" fontWeight="bold">
        Report Upload
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Create or select a report, then upload multiple Load and Counters CSV
        files. If something is wrong, the upload area will show the exact validation error.
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          alignItems: {
            xs: "stretch",
            md: "center",
          },
        }}
      >
        <Button
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={createRun}
          disabled={creatingRun}
          sx={{
            borderRadius: 3,
            fontWeight: "bold",
            height: 56,
          }}
        >
          {creatingRun ? "Preparing..." : "Generate New Report"}
        </Button>

        <FormControl sx={{ minWidth: 420, flex: 1 }}>
          <InputLabel>Selected Report</InputLabel>

          <Select
            value={selectedRunId || ""}
            label="Selected Report"
            onChange={(event) => handleRunChange(event.target.value)}
            renderValue={(selected) => {
              const selectedRun = runs.find(
                (run) => normalizeRunId(run) === selected
              );

              if (!selectedRun && selected) {
                return `New Report (${selected})`;
              }

              if (!selectedRun) {
                return "Select a report";
              }

              return buildReportLabel(selectedRun);
            }}
          >
            {runs.map((run) => {
              const currentRunId = normalizeRunId(run);

              return (
                <MenuItem key={currentRunId} value={currentRunId}>
                  {buildReportLabel(run)}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadRuns}
          sx={{
            borderRadius: 3,
            fontWeight: "bold",
            height: 56,
          }}
        >
          Refresh Reports
        </Button>
      </Stack>

      {hasMetadata(selectedReportMetadata) && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            backgroundColor: "#fafafa",
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Report Information
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{
              flexWrap: "wrap",
            }}
          >
            <Chip
              label={`Version: ${selectedReportMetadata.version || "-"}`}
              variant="outlined"
              color="primary"
            />

            <Chip
              label={`Build: ${selectedReportMetadata.build || "-"}`}
              variant="outlined"
              color="primary"
            />

            <Chip
              label={`Suite: ${selectedReportMetadata.suite || "-"}`}
              variant="outlined"
              color="secondary"
            />

            <Chip
              label={`Environment: ${
                selectedReportMetadata.environment || "-"
              }`}
              variant="outlined"
              color="secondary"
            />

            <Chip
              label={`Date: ${selectedReportMetadata.date || "-"}`}
              variant="outlined"
            />
          </Stack>

          {selectedReportMetadata.source_file && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Source file: {selectedReportMetadata.source_file}
            </Typography>
          )}
        </Paper>
      )}

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Load CSV files
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              alignItems: {
                xs: "stretch",
                md: "center",
              },
            }}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{
                borderRadius: 3,
                fontWeight: "bold",
              }}
            >
              Select Load CSVs

              <input
                type="file"
                hidden
                multiple
                accept=".csv"
                onChange={(event) => {
                  setLoadFiles(Array.from(event.target.files || []));
                  setMessage("");
                  setErrorMessage("");
                }}
              />
            </Button>

            <Typography color="text.secondary">
              {loadFiles.length > 0
                ? `${loadFiles.length} file(s) selected`
                : "No files selected"}
            </Typography>

            <Button
              variant="contained"
              onClick={uploadLoadFiles}
              disabled={uploadingLoad}
              sx={{
                borderRadius: 3,
                fontWeight: "bold",
              }}
            >
              {uploadingLoad ? "Uploading..." : "Upload Load Files"}
            </Button>
          </Stack>
        </Box>

        {loadFiles.length > 0 && (
          <Box>
            {loadFiles.map((file) => (
              <Chip
                key={file.name}
                label={file.name}
                sx={{ mr: 1, mb: 1 }}
                variant="outlined"
              />
            ))}
          </Box>
        )}

        <Divider />

        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Counters CSV files
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              alignItems: {
                xs: "stretch",
                md: "center",
              },
            }}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{
                borderRadius: 3,
                fontWeight: "bold",
              }}
            >
              Select Counters CSVs

              <input
                type="file"
                hidden
                multiple
                accept=".csv"
                onChange={(event) => {
                  setCountersFiles(Array.from(event.target.files || []));
                  setMessage("");
                  setErrorMessage("");
                }}
              />
            </Button>

            <Typography color="text.secondary">
              {countersFiles.length > 0
                ? `${countersFiles.length} file(s) selected`
                : "No files selected"}
            </Typography>

            <Button
              variant="contained"
              onClick={uploadCountersFiles}
              disabled={uploadingCounters}
              sx={{
                borderRadius: 3,
                fontWeight: "bold",
              }}
            >
              {uploadingCounters ? "Uploading..." : "Upload Counters Files"}
            </Button>
          </Stack>
        </Box>

<Divider />

<Box>
  <Typography
    variant="h6"
    fontWeight="bold"
    sx={{ mb: 1 }}
  >
    Processes JSON
  </Typography>

  <Stack
    direction={{
      xs: "column",
      md: "row",
    }}
    spacing={2}
    alignItems={{
      xs: "stretch",
      md: "center",
    }}
  >
    <Button
      variant="outlined"
      component="label"
      startIcon={<CloudUploadIcon />}
      sx={{
        borderRadius: 3,
        fontWeight: "bold",
      }}
    >
      Select Processes JSON

      <input
        hidden
        type="file"
        accept=".json"
        onChange={(event) => {
          setProcessesFile(
            event.target.files?.[0] || null
          );

          setMessage("");
          setErrorMessage("");
        }}
      />
    </Button>

    <Typography color="text.secondary">
      {processesFile
        ? processesFile.name
        : "No file selected"}
    </Typography>

    <Button
      variant="contained"
      onClick={uploadProcessesFile}
      disabled={uploadingProcesses}
      sx={{
        borderRadius: 3,
        fontWeight: "bold",
      }}
    >
      {uploadingProcesses
        ? "Uploading..."
        : "Upload Processes"}
    </Button>
  </Stack>
</Box>

        {countersFiles.length > 0 && (
          <Box>
            {countersFiles.map((file) => (
              <Chip
                key={file.name}
                label={file.name}
                sx={{ mr: 1, mb: 1 }}
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Stack>

      {runFiles && (
        <>
          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Files uploaded to selected report
          </Typography>

          <Typography fontWeight="bold">Load files:</Typography>

          <Box sx={{ mt: 1, mb: 2 }}>
            {runFiles.load_files && runFiles.load_files.length > 0 ? (
              runFiles.load_files.map((file) => (
                <Chip
                  key={file}
                  label={file}
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))
            ) : (
              <Typography color="text.secondary">
                No Load files uploaded yet.
              </Typography>
            )}
          </Box>

          <Typography fontWeight="bold">Counters files:</Typography>

          <Box sx={{ mt: 1 }}>
            {runFiles.counters_files &&
            runFiles.counters_files.length > 0 ? (
              runFiles.counters_files.map((file) => (
                <Chip
                  key={file}
                  label={file}
                  color="secondary"
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))
            ) : (
              <Typography color="text.secondary">
                No Counters files uploaded yet.
              </Typography>
            )}
          </Box>

          <Typography
            fontWeight="bold"
            sx={{ mt: 2 }}
          >
            Processes JSON:
          </Typography>

          <Box sx={{ mt: 1 }}>
            {runFiles?.has_processes_file ? (
              <Chip
                color="success"
                label="processes.json"
                variant="outlined"
              />
            ) : (
              <Typography
                color="text.secondary"
              >
                No Processes JSON uploaded yet.
              </Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}

export default RunUploadPanel;