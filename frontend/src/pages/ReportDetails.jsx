import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

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
import AssessmentIcon from "@mui/icons-material/Assessment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ErrorIcon from "@mui/icons-material/Error";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import MemoryIcon from "@mui/icons-material/Memory";
import SummarizeIcon from "@mui/icons-material/Summarize";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import api from "../services/api";

function ReportDetails() {
  const { runId } = useParams();

  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [metadata, setMetadata] = useState({});

  useEffect(() => {
    loadDetails();
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

const filesResponse = await api.get(
  `/runs/${runId}/files`
);

console.log("FILES RESPONSE", filesResponse.data);

setMetadata(
  filesResponse.data?.metadata || {}
);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Could not load expanded report. Please check if the backend endpoint /reports/actions/{runId} is working."
      );
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
  const totalActions = Object.keys(groupedActions).length;

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
    <Box
      sx={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #F1F8E9 100%)",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 5,
            backgroundColor: "#ffffff",
            border: "1px solid #E8F5E9",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "flex-start" }}
            spacing={3}
          >
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    backgroundColor: "#E8F5E9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2E7D32",
                  }}
                >
                  <FactCheckIcon sx={{ fontSize: 34 }} />
                </Box>

                <Box>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    sx={{
                      color: "#1C2526",
                      lineHeight: 1.1,
                    }}
                  >
                    Expanded Report
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      color: "#607D8B",
                    }}
                  >
                    Detailed results grouped by Action and Hardware.
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 2 }}
              >
<Stack
  direction="row"
  spacing={1}
  useFlexGap
  flexWrap="wrap"
  sx={{ mt: 2 }}
>
  <Chip
    label={metadata?.version}
    color="success"
    variant="outlined"
  />

  <Chip
    label={metadata?.build}
    color="primary"
    variant="outlined"
  />

  <Chip
    label={metadata?.suite}
    color="secondary"
    variant="outlined"
  />

  <Chip
    label={metadata?.environment}
    color="info"
    variant="outlined"
  />

  <Chip
    label={metadata?.date}
    color="warning"
    variant="outlined"
  />
</Stack>
              </Stack>
            </Box>

            <Button
              component={Link}
              to={`/report/${runId}/summary`}
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: "bold",
                color: "#2E7D32",
                borderColor: "#4CAF50",
                backgroundColor: "#FFFFFF",
                "&:hover": {
                  borderColor: "#2E7D32",
                  backgroundColor: "#F1F8E9",
                },
              }}
            >
              Back to Summary
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              component={Link}
              to={`/report/${runId}/summary`}
              startIcon={<SummarizeIcon />}
              variant="text"
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                color: "#263238",
              }}
            >
              Summary
            </Button>

            <Button
              component={Link}
              to={`/report/${runId}/details`}
              startIcon={<AssessmentIcon />}
              variant="contained"
              color="success"
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: 3,
              }}
            >
              Details
            </Button>

            <Button
              component={Link}
              to={`/report/${runId}/upload`}
              startIcon={<UploadFileIcon />}
              variant="text"
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                color: "#263238",
              }}
            >
              Upload
            </Button>

            <Button
              component={Link}
              to={`/report/${runId}/charts`}
              startIcon={<InsertChartIcon />}
              variant="text"
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                color: "#263238",
              }}
            >
              Charts
            </Button>

            <Button
              component={Link}
              to={`/report/${runId}/processes`}
              startIcon={<MemoryIcon />}
              variant="text"
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                color: "#263238",
              }}
            >
              Processes
            </Button>

            <Button
              component={Link}
              to="/compare"
              startIcon={<CompareArrowsIcon />}
              variant="text"
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                color: "#263238",
              }}
            >
              Compare
            </Button>
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
              Actions
            </Typography>

            <Typography variant="h4" fontWeight="bold">
              {totalActions}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              Hardware Rows
            </Typography>

            <Typography variant="h4" fontWeight="bold">
              {actions.length}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              PASS
            </Typography>

            <Typography variant="h4" fontWeight="bold" color="success.main">
              {totalPass}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              FAIL
            </Typography>

            <Typography variant="h4" fontWeight="bold" color="error.main">
              {totalFail}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 4, flex: 1 }}>
            <Typography color="text.secondary" fontWeight="bold">
              NO KPI
            </Typography>

            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {totalNoKpi}
            </Typography>
          </Paper>
        </Stack>

        {actions.length === 0 && !errorMessage && (
          <Alert severity="info">
            No expanded data found for this run. Please upload Load files for this report.
          </Alert>
        )}

        {actions.length > 0 && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
              Results by Action and Hardware
            </Typography>

            <Typography color="text.secondary">
              The results below keep the current detailed structure: each Action has one table with its Hardware rows.
            </Typography>
          </Paper>
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
                sx={{ borderRadius: 2, fontWeight: "bold" }}
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
