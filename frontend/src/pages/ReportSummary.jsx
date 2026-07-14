import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
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

import TableChartIcon from "@mui/icons-material/TableChart";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";

import api from "../services/api";

function ReportSummary() {
  const { runId } = useParams();

  const [summary, setSummary] = useState([]);
  const [message, setMessage] = useState("");
  const [detailsCount, setDetailsCount] = useState(0);
  const [summaryCount, setSummaryCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSummary();
  }, [runId]);

  const loadSummary = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get(`/reports/actions/${runId}/summary`);

      const responseData = response.data;

      if (Array.isArray(responseData)) {
        setSummary(responseData);
        setSummaryCount(responseData.length);
        setDetailsCount(0);
        setMessage("Summary loaded successfully.");
      } else {
        setSummary(responseData.summary || []);
        setMessage(responseData.message || "");
        setDetailsCount(responseData.details_count || 0);
        setSummaryCount(responseData.summary_count || 0);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load report summary.");
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status) => {
    if (status === "PASS") {
      return <CheckCircleIcon />;
    }

    if (status === "FAIL") {
      return <ErrorIcon />;
    }

    return <WarningIcon />;
  };

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

          <Typography variant="h6" fontWeight="bold">
            Loading report summary...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
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
                Report Summary
              </Typography>

              <Typography sx={{ mt: 1, opacity: 0.9 }}>
                Compiled view for run: <strong>{runId}</strong>
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={Link}
                to={`/report/${runId}/details`}
                variant="contained"
                color="inherit"
                startIcon={<TableChartIcon />}
                sx={{
                  color: "#0d47a1",
                  fontWeight: "bold",
                  borderRadius: 3,
                }}
              >
                Expand Report
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
                Upload Files
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
            </Stack>
          </Stack>
        </Paper>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {message && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              Detailed Rows
            </Typography>

            <Typography variant="h3" fontWeight="bold">
              {detailsCount}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              Compiled Actions
            </Typography>

            <Typography variant="h3" fontWeight="bold">
              {summaryCount || summary.length}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              Failed Actions
            </Typography>

            <Typography variant="h3" fontWeight="bold" color="error.main">
              {summary.filter((item) => item.Status === "FAIL").length}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              Passed Actions
            </Typography>

            <Typography variant="h3" fontWeight="bold" color="success.main">
              {summary.filter((item) => item.Status === "PASS").length}
            </Typography>
          </Paper>
        </Stack>

        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            Compiled Actions Summary
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            One consolidated row per Action. Values are calculated across all
            hardwares in this run.
          </Typography>

          {summary.length === 0 ? (
            <Alert severity="warning">
              No summary data available for this run.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#eef3f8" }}>
                    <TableCell>
                      <strong>Action</strong>
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
                  {summary.map((row, index) => (
                    <TableRow key={`${row.Action}-${index}`} hover>
                      <TableCell>{row.Action}</TableCell>

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
                          color={getStatusColor(row.Status)}
                          label={row.Status}
                          icon={getStatusIcon(row.Status)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default ReportSummary;