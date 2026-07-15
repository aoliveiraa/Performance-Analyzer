import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
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

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import api from "../services/api";

function ProcessesPage() {
  const { runId } = useParams();

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
  loadPersistedProcesses();
}, [runId]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) {
      return rows;
    }

    const text = search.trim().toLowerCase();

    return rows.filter((row) => {
      return (
        String(row.instance || "")
          .toLowerCase()
          .includes(text) ||
        String(row.process_id || "")
          .toLowerCase()
          .includes(text) ||
        String(row.process_name || "")
          .toLowerCase()
          .includes(text) ||
        String(row.process_running || "")
          .toLowerCase()
          .includes(text)
      );
    });
  }, [rows, search]);

  const loadPersistedProcesses = async () => {
  if (!runId) {
    return;
  }

  try {
    const response = await api.get(
      `/runs/${runId}/processes`
    );

    const data = response.data;

    if (
      data &&
      Array.isArray(data.records)
    ) {
      setRows(data.records);

      if (data.records.length > 0) {
        setSuccessMessage(
          `${data.records.length} persisted process record(s) loaded.`
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
};

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setSelectedFile(file || null);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a JSON file before uploading.");
      return;
    }

    setUploading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await api.post(`/runs/${runId}/upload/processes-file`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (
  response.data &&
  Array.isArray(response.data.records)
) {
  setRows(response.data.records);

  setSuccessMessage(
    `JSON uploaded successfully. ${response.data.records.length} process record(s) loaded.`
  );
} else if (response.data?.error) {
        setRows([]);
        setErrorMessage(response.data.error);
      } else {
        setRows([]);
        setErrorMessage("Unexpected response from backend.");
      }
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorMessage(
        "Could not upload/process JSON. Please check if backend endpoint /processes/upload is working."
      );
    } finally {
      setUploading(false);
    }
  };

  const clearFilter = () => {
    setSearch("");
  };

  const clearAll = () => {
    setRows([]);
    setSearch("");
    setSelectedFile(null);
    setSuccessMessage("");
    setErrorMessage("");
  };

  return (
    <Box sx={{ backgroundColor: "#f4f6f8", minHeight: "100vh", py: 4 }}>
      <Box sx={{ maxWidth: "1600px", mx: "auto", px: 2 }}>
        <Paper
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 4,
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            Processes Analysis
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Run: {runId}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{
                borderRadius: 3,
                fontWeight: "bold",
                minWidth: 180,
              }}
            >
              Select JSON
              <input
                hidden
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
              />
            </Button>

            <Typography color="text.secondary" sx={{ flex: 1 }}>
              {selectedFile ? selectedFile.name : "No file selected"}
            </Typography>

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              sx={{
                borderRadius: 3,
                fontWeight: "bold",
                minWidth: 160,
              }}
            >
              {uploading ? "Uploading..." : "Upload JSON"}
            </Button>

            <Button
              variant="outlined"
              color="warning"
              onClick={clearAll}
              sx={{
                borderRadius: 3,
                fontWeight: "bold",
                minWidth: 120,
              }}
            >
              Clear
            </Button>
          </Stack>

          {uploading && (
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mt: 3 }}
            >
              <CircularProgress size={22} />

              <Typography color="text.secondary">
                Processing JSON file...
              </Typography>
            </Stack>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mt: 3 }}>
              {successMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {errorMessage}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              fullWidth
              label="Search by Instance, Process ID, Process Name or Running Process"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={rows.length === 0}
              InputProps={{
                startAdornment: (
                  <SearchIcon
                    color="action"
                    sx={{ mr: 1 }}
                  />
                ),
              }}
            />

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilter}
              disabled={!search}
              sx={{
                borderRadius: 3,
                fontWeight: "bold",
                minWidth: 150,
                height: 56,
              }}
            >
              Clear Filter
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: 2 }}
          >
            <Chip
              label={`Total records: ${rows.length}`}
              color="primary"
              variant="outlined"
            />

            <Chip
              label={`Filtered records: ${filteredRows.length}`}
              color={search ? "secondary" : "default"}
              variant="outlined"
            />

            {search && (
              <Chip
                label={`Filter: ${search}`}
                color="secondary"
                variant="filled"
              />
            )}
          </Stack>
        </Paper>

        {rows.length === 0 ? (
          <Alert severity="info">
  No Processes JSON found for this report.
  Upload a file from Upload Report or use the button above.
</Alert>
        ) : filteredRows.length === 0 ? (
          <Alert severity="warning">
            No process records found for the current filter.
          </Alert>
        ) : (
          <Paper sx={{ borderRadius: 4 }}>
            <TableContainer sx={{ maxHeight: 720 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#eef3f8" }}>
                    <TableCell>
                      <strong>Instance</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Process ID</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Process Name</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Process Running</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRows.map((row, index) => (
                    <TableRow
                      key={`${row.instance}-${row.process_id}-${index}`}
                      hover
                    >
                      <TableCell>
                        {row.instance || "-"}
                      </TableCell>

                      <TableCell>
                        {row.process_id || "-"}
                      </TableCell>

                      <TableCell>
                        {row.process_name || "-"}
                      </TableCell>

                      <TableCell
                        sx={{
                          minWidth: 600,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {row.process_running || "-"}
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
                Showing {filteredRows.length} of {rows.length} record(s)
              </Typography>

              <Typography color="text.secondary">
                Search: {search || "None"}
              </Typography>
            </Stack>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default ProcessesPage;