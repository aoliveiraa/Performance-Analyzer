import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import AssessmentIcon from "@mui/icons-material/Assessment";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertChartIcon from "@mui/icons-material/InsertChart";

import api from "../services/api";

function ReportsList() {
  const [runs, setRuns] = useState([]);
  const [runFiles, setRunFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadRuns();
  }, []);

  const normalizeRunId = (run) => {
    if (typeof run === "string") {
      return run;
    }

    return run.run_id || run.id || run.name;
  };

  const loadRuns = async () => {
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
          <Typography>Loading reports...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h3" fontWeight="bold">
              Reports
            </Typography>

            <Typography color="text.secondary">
              Main page compiling all performance test executions.
            </Typography>
          </Box>

          <Button
            component={Link}
            to="/upload"
            variant="contained"
            startIcon={<UploadFileIcon />}
            sx={{ borderRadius: 3, fontWeight: "bold" }}
          >
            New Upload
          </Button>
        </Stack>

        {errorMessage && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {runs.length === 0 ? (
          <Alert severity="info">
            No reports found yet. Click <strong>New Upload</strong> to upload
            files and create the first report automatically.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {runs.map((run) => {
              const runId = normalizeRunId(run);
              const files = runFiles[runId] || {};
              const loadCount = files.load_files?.length || 0;
              const countersCount = files.counters_files?.length || 0;

              return (
                <Grid item xs={12} md={6} lg={4} key={runId}>
                  <Card sx={{ borderRadius: 4, height: "100%" }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <AssessmentIcon color="primary" />

                          <Typography variant="h5" fontWeight="bold">
                            {runId}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={`${loadCount} Load file(s)`}
                            color="primary"
                            variant="outlined"
                          />

                          <Chip
                            label={`${countersCount} Counters file(s)`}
                            color="secondary"
                            variant="outlined"
                          />
                        </Stack>

                        <Stack spacing={1}>
                          <Button
                            component={Link}
                            to={`/report/${runId}/summary`}
                            variant="contained"
                            fullWidth
                          >
                            Open Report
                          </Button>

                          <Button
                            component={Link}
                            to={`/report/${runId}/upload`}
                            variant="outlined"
                            fullWidth
                          >
                            Upload Files
                          </Button>

                          <Button
                            component={Link}
                            to={`/report/${runId}/charts`}
                            variant="outlined"
                            startIcon={<InsertChartIcon />}
                            fullWidth
                          >
                            Open Charts
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default ReportsList;