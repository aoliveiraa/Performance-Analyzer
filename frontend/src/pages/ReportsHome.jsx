import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Paper,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

export default function ReportsHome() {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Create Report",
      description:
        "Create a new report and upload performance files.",
      icon: "📄",
      action: () => navigate("/upload"),
    },
    {
      title: "Open Reports",
      description:
        "View all available reports and investigate results.",
      icon: "📂",
      action: () => navigate("/reports"),
    },
    {
      title: "Compare Reports",
      description:
        "Compare KPI trends between different executions.",
      icon: "📊",
      action: () => navigate("/compare"),
    },
    {
      title: "KPI Settings",
      description:
        "Manage thresholds and KPI configurations.",
      icon: "⚙️",
      action: () => navigate("/kpis"),
    },
  ];

  return (
    <Box
      sx={{
        p: 4,
        backgroundColor: "#F5F7FA",
        minHeight: "100vh",
      }}
    >
      {/* HERO */}

      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          gutterBottom
        >
          Performance Analyzer
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
        >
          Analyze, compare and investigate performance
          reports faster and with more confidence.
        </Typography>
      </Box>

      {/* QUICK ACTIONS */}

      <Typography
        variant="h5"
        fontWeight="bold"
        gutterBottom
      >
        Quick Actions
      </Typography>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {quickActions.map((item) => (
          <Grid
            item
            xs={12}
            md={6}
            lg={3}
            key={item.title}
          >
            <Card
              onClick={item.action}
              sx={{
                height: "100%",
                borderRadius: 4,
                cursor: "pointer",
                transition: "0.2s",

                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    fontSize: 48,
                    mb: 2,
                  }}
                >
                  {item.icon}
                </Box>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  {item.title}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* MAIN CONTENT */}

      <Grid container spacing={3}>
        {/* HOW IT WORKS */}

        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
              height: "100%",
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
            >
              How It Works
            </Typography>

            <Stack spacing={4} sx={{ mt: 3 }}>
              <Box>
                <Typography fontWeight="bold">
                  1. Create Report
                </Typography>

                <Typography color="text.secondary">
                  Create a new report container to organize
                  and store your uploads.
                </Typography>
              </Box>

              <Box>
                <Typography fontWeight="bold">
                  2. Upload Files
                </Typography>

                <Typography color="text.secondary">
                  Upload Load CSV, Counters CSV and
                  Processes JSON files.
                </Typography>
              </Box>

              <Box>
                <Typography fontWeight="bold">
                  3. Analyze Results
                </Typography>

                <Typography color="text.secondary">
                  Review Summary, Details, Charts and
                  Processes information.
                </Typography>
              </Box>

              <Box>
                <Typography fontWeight="bold">
                  4. Compare Reports
                </Typography>

                <Typography color="text.secondary">
                  Compare reports side-by-side and identify
                  performance trends.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* SUPPORTED FILES */}

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
              height: "100%",
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
            >
              Supported Files
            </Typography>

            <Stack spacing={3} sx={{ mt: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 32 }}>
                  📄
                </Typography>

                <Typography fontWeight="bold">
                  Load CSV
                </Typography>

                <Typography color="text.secondary">
                  Apache JMeter load test results.
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 32 }}>
                  📄
                </Typography>

                <Typography fontWeight="bold">
                  Counters CSV
                </Typography>

                <Typography color="text.secondary">
                  Performance counters collected during tests.
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 32 }}>
                  📄
                </Typography>

                <Typography fontWeight="bold">
                  Processes JSON
                </Typography>

                <Typography color="text.secondary">
                  Process monitoring information.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}