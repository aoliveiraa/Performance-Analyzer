import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";

function KpisPage() {
  const [kpis, setKpis] = useState([]);
  const [actionName, setActionName] = useState("");
  const [kpiMs, setKpiMs] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadKpis();
  }, []);

  async function loadKpis() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:8000/kpis");

      if (!response.ok) {
        throw new Error("Could not load KPIs.");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
  const sortedKpis = [...data].sort((a, b) => {
    const actionA = (
      a.Action ||
      a.action ||
      a.action_name ||
      ""
    ).toLowerCase();

    const actionB = (
      b.Action ||
      b.action ||
      b.action_name ||
      ""
    ).toLowerCase();

    return actionA.localeCompare(actionB);
  });

  setKpis(sortedKpis);
} else {
  setKpis([]);
}
    } catch (err) {
      console.error(err);
      setError("Could not load registered KPIs.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKpi(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const cleanActionName = actionName.trim();
    const numericKpi = Number(kpiMs);

    if (!cleanActionName) {
      setError("Please enter the Action name.");
      return;
    }

    if (!kpiMs || Number.isNaN(numericKpi) || numericKpi <= 0) {
      setError("Please enter a valid KPI value in milliseconds.");
      return;
    }

    try {
      setSaving(true);

      const params = new URLSearchParams();

      params.append("action_name", cleanActionName);
      params.append("kpi_ms", numericKpi);

      const response = await fetch(
        `http://localhost:8000/kpis?${params.toString()}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Could not save KPI.");
      }

      await response.json();

      setSuccessMessage("KPI saved successfully.");
      setActionName("");
      setKpiMs("");

      await loadKpis();
    } catch (err) {
      console.error(err);
      setError("Could not save KPI. Please check backend logs.");
    } finally {
      setSaving(false);
    }
  }

  function handleEditKpi(kpi) {
    setActionName(kpi.Action || kpi.action || "");
    setKpiMs(kpi.KPI || kpi.kpi_ms || "");
    setSuccessMessage("");
    setError("");
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ mb: 1 }}
          >
            KPIs
          </Typography>

          <Typography color="text.secondary">
            Register and manage response time KPIs by Action.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
          >
            {successMessage}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 2fr",
            },
            gap: 3,
          }}
        >
          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 2 }}
            >
              Register KPI
            </Typography>

            <Box
              component="form"
              onSubmit={handleSaveKpi}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <TextField
                label="Action name"
                value={actionName}
                onChange={(event) =>
                  setActionName(event.target.value)
                }
                fullWidth
                placeholder="Example: Exact Cash"
              />

              <TextField
                label="KPI in milliseconds"
                value={kpiMs}
                onChange={(event) =>
                  setKpiMs(event.target.value)
                }
                fullWidth
                type="number"
                placeholder="Example: 2000"
              />

              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  mt: 1,
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                {saving ? "Saving..." : "Save KPI"}
              </Button>

              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setActionName("");
                  setKpiMs("");
                  setError("");
                  setSuccessMessage("");
                }}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                Clear
              </Button>
            </Box>
          </Paper>

          <Paper
            sx={{
              p: 3,
              borderRadius: 4,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                gap: 2,
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Registered KPIs
              </Typography>

              <Button
                variant="outlined"
                onClick={loadKpis}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                Refresh
              </Button>
            </Box>

            {loading ? (
              <Alert severity="info">
                Loading KPIs...
              </Alert>
            ) : kpis.length === 0 ? (
              <Alert severity="info">
                No KPIs registered yet.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Action</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>KPI ms</strong>
                      </TableCell>

                      <TableCell align="right">
                        <strong>Actions</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {kpis.map((kpi, index) => {
                      const action =
                        kpi.Action ||
                        kpi.action ||
                        kpi.action_name ||
                        "";

                      const value =
                        kpi.KPI ||
                        kpi.kpi_ms ||
                        kpi.kpi ||
                        "";

                      return (
                        <TableRow key={`${action}-${index}`}>
                          <TableCell>
                            {action}
                          </TableCell>

                          <TableCell align="right">
                            {value}
                          </TableCell>

                          <TableCell align="right">
                            <Button
                              variant="text"
                              onClick={() =>
                                handleEditKpi(kpi)
                              }
                              sx={{
                                textTransform: "none",
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}

export default KpisPage;