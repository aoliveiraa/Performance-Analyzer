import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import ActionTrendChart from "../components/ActionTrendChart";
import MemoryTrendChart from "../components/MemoryTrendChart";

function Dashboard() {
  const [data, setData] = useState(null);
  const [actions, setActions] = useState([]);
  const [memoryLeaks, setMemoryLeaks] = useState([]);
  const [counters, setCounters] = useState([]);

  const [selectedAction, setSelectedAction] =
    useState("ALL");

  const [selectedHardware, setSelectedHardware] =
    useState("ALL");

  useEffect(() => {
    loadDashboard();
    loadActions();
    loadMemoryLeaks();
    loadCounters();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get("/dashboard/full");
      setData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadActions = async () => {
    try {
      const response = await api.get("/reports/actions");
      setActions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadMemoryLeaks = async () => {
    try {
      const response = await api.get("/reports/memory-leaks");
      setMemoryLeaks(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCounters = async () => {
    try {
      const response = await api.get("/reports/counters");
      setCounters(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!data) {
    return <h2>Carregando...</h2>;
  }

  const availableActions = [
    "ALL",
    ...new Set(actions.map((item) => item.Action)),
  ];

  const availableHardware = [
    "ALL",
    ...new Set(actions.map((item) => item.Hardware)),
  ];

  const filteredActions = actions.filter((item) => {
    const actionMatch =
      selectedAction === "ALL" ||
      item.Action === selectedAction;

    const hardwareMatch =
      selectedHardware === "ALL" ||
      item.Hardware === selectedHardware;

    return actionMatch && hardwareMatch;
  });

  const groupedActions =
    filteredActions.reduce((groups, item) => {
      const action = item.Action;

      if (!groups[action]) {
        groups[action] = [];
      }

      groups[action].push(item);

      return groups;
    }, {});

  const totalPass = actions.filter(
    (item) => item.Average <= item.KPI
  ).length;

  const totalFail = actions.filter(
    (item) => item.Average > item.KPI
  ).length;

  const successRate =
    actions.length > 0
      ? (
          (totalPass / actions.length) *
          100
        ).toFixed(2)
      : 0;

  return (
    <Container maxWidth="xl">
      <Typography
        variant="h2"
        sx={{
          mt: 3,
          mb: 4,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Performance Analyzer
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">
                Total Actions
              </Typography>

              <Typography variant="h3">
                {data.summary.total_actions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">
                Average Response
              </Typography>

              <Typography variant="h3">
                {data.summary.average_response_time.toFixed(
                  2
                )}{" "}
                ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">
                Max Response
              </Typography>

              <Typography variant="h3">
                {data.summary.max_response_time.toFixed(
                  2
                )}{" "}
                ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">
                PASS Actions
              </Typography>

              <Typography
                variant="h3"
                color="success.main"
              >
                {totalPass}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">
                FAIL Actions
              </Typography>

              <Typography
                variant="h3"
                color="error.main"
              >
                {totalFail}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">
                Success Rate
              </Typography>

              <Typography
                variant="h3"
                color="primary"
              >
                {successRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 5, p: 3 }}>
        <Typography
          variant="h5"
          sx={{ mb: 2 }}
        >
          Filters
        </Typography>

        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Action</InputLabel>

          <Select
            value={selectedAction}
            label="Action"
            onChange={(e) =>
              setSelectedAction(
                e.target.value
              )
            }
          >
            {availableActions.map((action) => (
              <MenuItem
                key={action}
                value={action}
              >
                {action}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          sx={{
            minWidth: 250,
            ml: 2,
          }}
        >
          <InputLabel>
            Hardware
          </InputLabel>

          <Select
            value={selectedHardware}
            label="Hardware"
            onChange={(e) =>
              setSelectedHardware(
                e.target.value
              )
            }
          >
            {availableHardware.map(
              (hardware) => (
                <MenuItem
                  key={hardware}
                  value={hardware}
                >
                  {hardware}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
      </Paper>

      {Object.entries(groupedActions).map(
        ([actionName, actionRows]) => (
          <Paper
            key={actionName}
            sx={{ mt: 5, p: 3 }}
          >
            <Typography
              variant="h4"
              sx={{
                mb: 3,
                color: "#1976d2",
              }}
            >
              Action: {actionName}
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Hardware
                    </TableCell>

                    <TableCell>
                      Average
                    </TableCell>

                    <TableCell>P90</TableCell>

                    <TableCell>KPI</TableCell>

                    <TableCell>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {actionRows.map(
                    (row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {row.Hardware}
                        </TableCell>

                        <TableCell>
                          {row.Average}
                        </TableCell>

                        <TableCell>
                          {row.P90}
                        </TableCell>

                        <TableCell>
                          {row.KPI}
                        </TableCell>

                        <TableCell>
                          <span
                            style={{
                              color:
                                row.Average <=
                                row.KPI
                                  ? "green"
                                  : "red",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {row.Average <=
                            row.KPI
                              ? "PASS ✅"
                              : "FAIL 🔴"}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )
      )}

      <Paper sx={{ mt: 5, p: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, textAlign: "center" }}
        >
          Memory Leak Analysis
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Process</TableCell>
                <TableCell>Counter</TableCell>
                <TableCell>Growth %</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {memoryLeaks.map(
                (row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {row.Process}
                    </TableCell>

                    <TableCell>
                      {row.Counter}
                    </TableCell>

                    <TableCell>
                      {
                        row["Growth %"]
                      }
                    </TableCell>

                    <TableCell>
                      <span
                        style={{
                          color:
                            row.Status ===
                            "POSSIBLE_MEMORY_LEAK"
                              ? "red"
                              : "green",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {row.Status}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ mt: 5, p: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, textAlign: "center" }}
        >
          Resource Consumption Report
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Process</TableCell>
                <TableCell>Counter</TableCell>
                <TableCell>Average</TableCell>
                <TableCell>Max</TableCell>
                <TableCell>Growth %</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {counters
                .slice(0, 25)
                .map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {row.Process}
                    </TableCell>

                    <TableCell>
                      {row.Counter}
                    </TableCell>

                    <TableCell>
                      {row.Average}
                    </TableCell>

                    <TableCell>
                      {row.Max}
                    </TableCell>

                    <TableCell>
                      {
                        row["Growth %"]
                      }
                    </TableCell>

                    <TableCell>
                      <span
                        style={{
                          color:
                            row[
                              "Growth %"
                            ] > 20
                              ? "red"
                              : "green",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {row[
                          "Growth %"
                        ] > 20
                          ? "ATTENTION 🔴"
                          : "NORMAL 🟢"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ mt: 5, p: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, textAlign: "center" }}
        >
          Action Response Trend
        </Typography>

        <ActionTrendChart />
      </Paper>

      <Paper sx={{ mt: 5, p: 3, mb: 5 }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, textAlign: "center" }}
        >
          Memory Consumption Trend
        </Typography>

        <MemoryTrendChart />
      </Paper>
    </Container>
  );
}

export default Dashboard;