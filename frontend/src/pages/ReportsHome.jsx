import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Divider,
} from "@mui/material";

import {
  Assessment,
  UploadFile,
  Speed,
  CompareArrows,
  PlayArrow,
} from "@mui/icons-material";

import { Link } from "react-router-dom";

function ReportsHome() {
  const quickActions = [
    {
      title: "Generate Report",
      description:
        "Upload Load, Counters and Processes files and generate a new report automatically.",
      icon: <UploadFile color="primary" sx={{ fontSize: 42 }} />,
      link: "/upload",
      button: "Open Upload",
    },
    {
      title: "Reports",
      description:
        "Browse existing reports, review KPIs and investigate performance issues.",
      icon: <Assessment color="primary" sx={{ fontSize: 42 }} />,
      link: "/reports",
      button: "Open Reports",
    },
    {
      title: "Compare Reports",
      description:
        "Compare KPI evolution between reports and quickly identify regressions.",
      icon: <CompareArrows color="primary" sx={{ fontSize: 42 }} />,
      link: "/reports/compare",
      button: "Compare",
    },
    {
      title: "KPI Management",
      description:
        "Register and maintain KPI targets used by PASS/FAIL evaluations.",
      icon: <Speed color="primary" sx={{ fontSize: 42 }} />,
      link: "/kpis",
      button: "Open KPIs",
    },
  ];

  const quickStart = [
    {
      step: "1. Generate Report",
      description:
        "Upload Load, Counters and Processes files.",
    },
    {
      step: "2. Review Summary",
      description:
        "Validate KPIs and PASS/FAIL status.",
    },
    {
      step: "3. Expanded Report",
      description:
        "Analyze response times and percentiles.",
    },
    {
      step: "4. Charts",
      description:
        "Review Memory, CPU and IO trends.",
    },
    {
      step: "5. Compare Reports",
      description:
        "Identify regressions between builds.",
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>

        {/* HERO */}

        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 3,
              md: 5,
            },
            mb: 4,
            borderRadius: 4,
            background:
              "linear-gradient(135deg, #455A64 0%, #607D8B 100%)",
            color: "white",
          }}
        >
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: {
                xs: "2rem",
                sm: "2.5rem",
                md: "3rem",
              },
            }}
          >
            Performance Analyzer
          </Typography>

          <Typography
            sx={{
              mt: 2,
              opacity: 0.9,
              maxWidth: 900,
              fontSize: {
                xs: "1rem",
                md: "1.15rem",
              },
            }}
          >
            Analyze performance reports,
            compare executions, identify regressions
            and investigate resource consumption
            through interactive dashboards and KPIs.
          </Typography>
        </Paper>

        {/* QUICK ACTIONS */}

        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ mb: 3 }}
        >
          Quick Actions
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              xl: "repeat(4, 1fr)",
            },
            gap: 3,
            mb: 5,
          }}
        >
          {quickActions.map((item) => (
            <Paper
              key={item.title}
              sx={{
                p: 3,
                borderRadius: 4,
                transition:
                  "all .25s ease",
                display: "flex",
                flexDirection: "column",

                "&:hover": {
                  transform:
                    "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
              <Stack
                spacing={2}
                alignItems="center"
                textAlign="center"
                sx={{ flexGrow: 1 }}
              >
                {item.icon}

                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  {item.title}
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  {item.description}
                </Typography>
              </Stack>

              <Button
                component={Link}
                to={item.link}
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  borderRadius: 2,
                }}
              >
                {item.button}
              </Button>
            </Paper>
          ))}
        </Box>

        {/* QUICK START */}

        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
          >
            Quick Start Guide
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Follow the steps below to analyze a new
            performance execution.
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(3, 1fr)",
                xl: "repeat(5, 1fr)",
              },
              gap: 3,
            }}
          >
            {quickStart.map((item) => (
              <Paper
                key={item.step}
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  textAlign: "center",
                  transition:
                    "all .2s ease",

                  "&:hover": {
                    boxShadow: 4,
                    transform:
                      "translateY(-3px)",
                  },
                }}
              >
                <PlayArrow
                  color="primary"
                  sx={{
                    fontSize: 40,
                  }}
                />

                <Typography
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {item.step}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {item.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Paper>

      </Box>
    </Container>
  );
}

export default ReportsHome;