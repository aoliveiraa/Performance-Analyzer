import {
  Box,
  Button,
  CssBaseline,
  Typography,
  Stack,
} from "@mui/material";

import { ThemeProvider } from "@mui/material/styles";
import {
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import theme from "./theme";

import ReportsHome from "./pages/ReportsHome";
import ReportsList from "./pages/ReportsList";
import ReportSummary from "./pages/ReportSummary";
import ReportDetails from "./pages/ReportDetails";
import ChartsPage from "./pages/ChartsPage";
import UploadPage from "./pages/UploadPage";
import KpiManagementPage from "./pages/KpiManagementPage";
import ProcessesPage from "./pages/ProcessesPage";
import CompareReportsPage from "./pages/CompareReportsPage";

function Sidebar() {
  const location = useLocation();
  const menuItems = [
  {
    label: "🏠 Home",
    path: "/",
  },
  {
    label: "📄 Reports",
    path: "/reports",
  },
  {
    label: "📊 Compare",
    path: "/reports/compare",
  },
  {
    label: "📤 Upload",
    path: "/upload",
  },
  {
    label: "⚙️ KPIs",
    path: "/kpis",
  },
];

  return (
    <Box
      sx={{
        width: 260,
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#1C2526 0%, #263238 100%)",
        color: "#fff",
        p: 3,
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >

<Box
  sx={{
    mb: 5,
    p: 3,
    borderRadius: 4,

    background:
      "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",

    boxShadow:
      "0 8px 24px rgba(76,175,80,0.35)",

    border:
      "1px solid rgba(255,255,255,0.15)",
  }}
>
  <Typography
    variant="h5"
    fontWeight="bold"
    sx={{
      color: "#FFFFFF",
      lineHeight: 1.2,
    }}
  >
    🚀 Performance
  </Typography>

  <Typography
    variant="h5"
    fontWeight="bold"
    sx={{
      color: "#FFFFFF",
      lineHeight: 1.2,
    }}
  >
    Analyzer
  </Typography>

  <Typography
    variant="body2"
    sx={{
      mt: 1,
      color: "rgba(255,255,255,0.85)",
    }}
  >
    Performance Testing Platform
  </Typography>
</Box>


      <Stack spacing={1}>
        {menuItems.map((item) => {
  const isActive =
    location.pathname === item.path;

  return (
<Button
  key={item.path}
  component={Link}
  to={item.path}
  fullWidth
  sx={{
    justifyContent: "flex-start",

    color: "#FFFFFF",

    py: 1.6,
    px: 2,

    mb: 1,

    borderRadius: 3,

    textTransform: "none",

    fontSize: "0.95rem",

    backgroundColor: isActive
      ? "#4CAF50"
      : "transparent",

    fontWeight: isActive
      ? 700
      : 500,

    boxShadow: isActive
      ? "0 4px 12px rgba(76,175,80,0.35)"
      : "none",

    "&:hover": {
      backgroundColor: isActive
        ? "#43A047"
        : "rgba(76,175,80,0.18)",
    },
  }}
>
  {item.label}
</Button>  );
})}
      </Stack>

      <Box sx={{ flexGrow: 1 }} />

      <Box
        sx={{
          mt: 8,
          pt: 3,
          borderTop:
            "1px solid rgba(255,255,255,0.08)",
        }}
      >

<Box
  sx={{
    mt: 8,
    pt: 3,
    borderTop:
      "1px solid rgba(255,255,255,0.10)",
  }}
>
  <Typography
    variant="body2"
    sx={{
      color: "#FFFFFF",
      fontWeight: 600,
    }}
  >
    Adrianne O.
  </Typography>

  <Typography
    variant="caption"
    sx={{
      color: "rgba(255,255,255,0.70)",
    }}
  >
    Performance Team
  </Typography>

  <Typography
    variant="caption"
    display="block"
    sx={{
      mt: 1,
      color: "#4CAF50",
      fontWeight: 600,
    }}
  >
    Version 1.0.0
  </Typography>
</Box>

      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
        }}
      >
        <Sidebar />

        <Box
          sx={{
            flex: 1,
            backgroundColor: "#F5F7FA",
            overflow: "auto",
          }}
        >
          <Routes>
            <Route
              path="/"
              element={<ReportsHome />}
            />

            <Route
              path="/reports"
              element={<ReportsList />}
            />

            <Route
              path="/reports/compare"
              element={<CompareReportsPage />}
            />

            <Route
              path="/report/:runId/summary"
              element={<ReportSummary />}
            />

            <Route
              path="/report/:runId/details"
              element={<ReportDetails />}
            />

            <Route
              path="/report/:runId/upload"
              element={<UploadPage />}
            />

            <Route
              path="/report/:runId/charts"
              element={<ChartsPage />}
            />

            <Route
              path="/report/:runId/processes"
              element={<ProcessesPage />}
            />

            <Route
              path="/upload"
              element={<UploadPage />}
            />

            <Route
              path="/kpis"
              element={<KpiManagementPage />}
            />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;