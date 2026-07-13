import { useState } from "react";
import api from "../services/api";

import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";

function UploadFilesPanel({ onUploadSuccess }) {
  const [loadFile, setLoadFile] = useState(null);
  const [countersFile, setCountersFile] = useState(null);

  const [uploadingLoad, setUploadingLoad] = useState(false);
  const [uploadingCounters, setUploadingCounters] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const uploadLoadFile = async () => {
    if (!loadFile) {
      setErrorMessage("Please select a Load CSV file.");
      return;
    }

    setUploadingLoad(true);
    setMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", loadFile);

      await api.post("/upload-load", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Load CSV uploaded successfully.");
      setLoadFile(null);

      if (onUploadSuccess) {
        await onUploadSuccess();
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not upload Load CSV. Please check the backend.");
    } finally {
      setUploadingLoad(false);
    }
  };

  const uploadCountersFile = async () => {
    if (!countersFile) {
      setErrorMessage("Please select a Counters CSV file.");
      return;
    }

    setUploadingCounters(true);
    setMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", countersFile);

      await api.post("/upload-counters", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Counters CSV uploaded successfully.");
      setCountersFile(null);

      if (onUploadSuccess) {
        await onUploadSuccess();
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not upload Counters CSV. Please check the backend.");
    } finally {
      setUploadingCounters(false);
    }
  };

  return (
    <Paper sx={{ mt: 4, p: 3, borderRadius: 4 }}>
      <Typography variant="h4" fontWeight="bold">
        Upload Test Files
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Upload the Load CSV and Counters CSV files used by the dashboard.
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

      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Load CSV
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
              Select Load CSV
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={(event) => {
                  setLoadFile(event.target.files[0]);
                  setMessage("");
                  setErrorMessage("");
                }}
              />
            </Button>

            <Typography color="text.secondary">
              {loadFile ? loadFile.name : "No file selected"}
            </Typography>

            <Button
              variant="contained"
              onClick={uploadLoadFile}
              disabled={uploadingLoad}
              sx={{ borderRadius: 3, fontWeight: "bold" }}
            >
              {uploadingLoad ? "Uploading..." : "Upload Load"}
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Counters CSV
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
              Select Counters CSV
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={(event) => {
                  setCountersFile(event.target.files[0]);
                  setMessage("");
                  setErrorMessage("");
                }}
              />
            </Button>

            <Typography color="text.secondary">
              {countersFile ? countersFile.name : "No file selected"}
            </Typography>

            <Button
              variant="contained"
              onClick={uploadCountersFile}
              disabled={uploadingCounters}
              sx={{ borderRadius: 3, fontWeight: "bold" }}
            >
              {uploadingCounters ? "Uploading..." : "Upload Counters"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

export default UploadFilesPanel;