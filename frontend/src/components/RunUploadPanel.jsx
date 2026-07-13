import { useEffect, useState } from "react";
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
  selectedRunId,
  onRunChange,
  onRunDataChanged,
}) {
  const [runs, setRuns] = useState([]);
  const [loadFiles, setLoadFiles] = useState([]);
  const [countersFiles, setCountersFiles] = useState([]);

  const [runFiles, setRunFiles] = useState(null);

  const [creatingRun, setCreatingRun] = useState(false);
  const [uploadingLoad, setUploadingLoad] = useState(false);
  const [uploadingCounters, setUploadingCounters] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadRuns();
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      loadRunFiles(selectedRunId);
    }
  }, [selectedRunId]);

  const loadRuns = async () => {
    try {
      const response = await api.get("/runs");
      setRuns(response.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load runs.");
    }
  };

  const loadRunFiles = async (runId) => {
    if (!runId) {
      return;
    }

    try {
      const response = await api.get(`/runs/${runId}/files`);
      setRunFiles(response.data);
    } catch (error) {
      console.error(error);
      setRunFiles(null);
    }
  };

  const createRun = async () => {
    setCreatingRun(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await api.post("/runs/create");
      const newRunId = response.data.run_id;

      setMessage(`Run created successfully: ${newRunId}`);

      await loadRuns();

      if (onRunChange) {
        onRunChange(newRunId);
      }

      await loadRunFiles(newRunId);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not create run.");
    } finally {
      setCreatingRun(false);
    }
  };

  const uploadLoadFiles = async () => {
    if (!selectedRunId) {
      setErrorMessage("Please select or create a run first.");
      return;
    }

    if (!loadFiles || loadFiles.length === 0) {
      setErrorMessage("Please select at least one Load CSV file.");
      return;
    }

    setUploadingLoad(true);
    setMessage("");
    setErrorMessage("");

    try {
      for (const file of loadFiles) {
        const formData = new FormData();
        formData.append("file", file);

        await api.post(
          `/runs/${selectedRunId}/upload/load-file`,
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

      await loadRunFiles(selectedRunId);

      if (onRunDataChanged) {
        await onRunDataChanged(selectedRunId);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not upload Load files.");
    } finally {
      setUploadingLoad(false);
    }
  };

  const uploadCountersFiles = async () => {
    if (!selectedRunId) {
      setErrorMessage("Please select or create a run first.");
      return;
    }

    if (!countersFiles || countersFiles.length === 0) {
      setErrorMessage("Please select at least one Counters CSV file.");
      return;
    }

    setUploadingCounters(true);
    setMessage("");
    setErrorMessage("");

    try {
      for (const file of countersFiles) {
        const formData = new FormData();
        formData.append("file", file);

        await api.post(
          `/runs/${selectedRunId}/upload/counters-file`,
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

      await loadRunFiles(selectedRunId);

      if (onRunDataChanged) {
        await onRunDataChanged(selectedRunId);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not upload Counters files.");
    } finally {
      setUploadingCounters(false);
    }
  };

  const handleRunChange = async (runId) => {
    if (onRunChange) {
      onRunChange(runId);
    }

    await loadRunFiles(runId);

    if (onRunDataChanged) {
      await onRunDataChanged(runId);
    }
  };

  return (
    <Paper sx={{ mt: 4, p: 3, borderRadius: 4 }}>
      <Typography variant="h4" fontWeight="bold">
        Runs Management
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Create or select a test execution, then upload multiple Load and
        Counters CSV files for that execution.
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: 3 }}
      >
        <Button
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={createRun}
          disabled={creatingRun}
          sx={{ borderRadius: 3, fontWeight: "bold", height: 56 }}
        >
          {creatingRun ? "Creating..." : "Create New Run"}
        </Button>

        <FormControl sx={{ minWidth: 280 }}>
          <InputLabel>Selected Run</InputLabel>

          <Select
            value={selectedRunId || ""}
            label="Selected Run"
            onChange={(event) => handleRunChange(event.target.value)}
          >
            {runs.map((run) => {
              const runId =
                typeof run === "string"
                  ? run
                  : run.run_id || run.id || run.name;

              return (
                <MenuItem key={runId} value={runId}>
                  {runId}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadRuns}
          sx={{ borderRadius: 3, fontWeight: "bold", height: 56 }}
        >
          Refresh Runs
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Load CSV files
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ borderRadius: 3, fontWeight: "bold" }}
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
              sx={{ borderRadius: 3, fontWeight: "bold" }}
            >
              {uploadingLoad ? "Uploading..." : "Upload Load Files"}
            </Button>
          </Stack>
        </Box>

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

        <Divider />

        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Counters CSV files
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ borderRadius: 3, fontWeight: "bold" }}
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
              sx={{ borderRadius: 3, fontWeight: "bold" }}
            >
              {uploadingCounters ? "Uploading..." : "Upload Counters Files"}
            </Button>
          </Stack>
        </Box>

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
      </Stack>

      {runFiles && (
        <>
          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Files uploaded to {runFiles.run_id}
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
            {runFiles.counters_files && runFiles.counters_files.length > 0 ? (
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
        </>
      )}
    </Paper>
  );
}

export default RunUploadPanel;