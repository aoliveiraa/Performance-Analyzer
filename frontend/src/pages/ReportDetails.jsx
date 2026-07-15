import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import MemoryIcon from "@mui/icons-material/Memory";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

import api from "../services/api";

function ReportDetails() {
  const { runId } = useParams();

  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportMetadata, setReportMetadata] = useState(null);

  useEffect(() => {
    loadDetails();
    loadMetadata();
  }, [runId]);

  const loadDetails = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get(`/reports/actions/${runId}`);

      if (Array.isArray(response.data)) {
        setActions(response.data);
      } else if (response.data?.records) {
        setActions(response.data.records);
      } else {
        setActions([]);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Could not load expanded report. Please check if the backend endpoint /reports/actions/{runId} is working."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
  try {
    const response = await api.get(
      `/runs/${runId}/files`
    );

    setReportMetadata(
      response.data?.metadata || null
    );
  } catch (error) {
    console.error(error);
  }
};

  const getNumber = (value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  const formatNumber = (value, decimals = 2) => {
    return getNumber(value).toFixed(decimals);
  };

  const getStatusColor = (status) => {
    if (status === "PASS") {
      return "success";
    }

    if (status === "FAIL") {
      return "error";
    }

    return "warning";
  };

  const groupedActions = useMemo(() => {
    return actions.reduce((groups, item) => {
      const actionName = item.Action || "Unknown Action";

      if (!groups[actionName]) {
        groups[actionName] = [];
      }

      groups[actionName].push(item);

      return groups;
    }, {});
  }, [actions]);

  const totalPass = actions.filter((item) => item.Status === "PASS").length;
  const totalFail = actions.filter((item) => item.Status === "FAIL").length;
  const totalNoKpi = actions.filter((item) => item.Status === "NO KPI").length;

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
          <CircularProgress />

          <Typography variant="h6" fontWeight="bold">
            Loading expanded report...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#f4f6f8", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        <Paper
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
                Expanded Report
              </Typography>

              <Typography sx={{ mt: 1, opacity: 0.9 }}>
                {reportMetadata
                  ? [
                      reportMetadata.version,
                      reportMetadata.build,
                      reportMetadata.suite,
                      reportMetadata.environment,
                      reportMetadata.date,
                    ]
                      .filter(Boolean)
                      .join(" | ")
                  : "Loading report information..."}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                component={Link}
                to={`/report/${runId}/summary`}
                variant="contained"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: "#0d47a1",
                  fontWeight: "bold",
                  borderRadius: 3,
                }}
              >
                Back to Summary
              </Button>

              <Button
                component={Link}
                to={`/report/${runId}/upload`}
                variant="contained"
                color="inherit"
                startIcon={<UploadFileIcon />}
                sx={{
                  color: "#0d47a1",
                  fontWeight: "bold",
                  borderRadius: 3,
                }}
              >
                Upload
              </Button>

              <Button
                component={Link}
                to={`/report/${runId}/charts`}
                variant="contained"
                color="inherit"
                startIcon={<InsertChartIcon />}
                sx={{
                  color: "#0d47a1",
                  fontWeight: "bold",
                  borderRadius: 3,
                }}
              >
                Charts
              </Button>
              <Button
                component={Link}
                to={`/report/${runId}/processes`}
                variant="contained"
                color="inherit"
                startIcon={<MemoryIcon />}
                sx={{
                  color: "#0d47a1",
                  fontWeight: "bold",
                  borderRadius: 3,
                }}
              >
                Processes
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              Total Rows
            </Typography>

            <Typography variant="h3" fontWeight="bold">
              {actions.length}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              PASS
            </Typography>

            <Typography variant="h3" fontWeight="bold" color="success.main">
              {totalPass}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              FAIL
            </Typography>

            <Typography variant="h3" fontWeight="bold" color="error.main">
              {totalFail}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              NO KPI
            </Typography>

            <Typography variant="h3" fontWeight="bold" color="warning.main">
              {totalNoKpi}
            </Typography>
          </Paper>
        </Stack>

        {actions.length === 0 && !errorMessage && (
          <Alert severity="info">
            No expanded data found for this run. Please upload Load files for
            this report.
          </Alert>
        )}

        {Object.entries(groupedActions).map(([actionName, rows]) => (
          <Paper key={actionName} sx={{ p: 3, mb: 4, borderRadius: 4 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {actionName}
                </Typography>

                <Typography color="text.secondary">
                  Expanded hardware results for this action.
                </Typography>
              </Box>

              <Chip
                label={`${rows.length} hardware result(s)`}
                color="primary"
                variant="outlined"
              />
            </Stack>

            <Divider sx={{ mb: 2 }} />

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
                  {rows.map((row, index) => {
                    const status = row.Status || "NO KPI";

                    return (
                      <TableRow key={`${row.Hardware}-${index}`} hover>
                        <TableCell>{row.Hardware || "-"}</TableCell>

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
                            color={getStatusColor(status)}
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
          </Paper>
        ))}
      </Container>
    </Box>
  );
}

export default ReportDetails;