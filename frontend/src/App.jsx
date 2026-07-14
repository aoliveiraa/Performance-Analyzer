import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { Link, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReportsHome from "./pages/ReportsHome";
import ReportsList from "./pages/ReportsList";
import ReportSummary from "./pages/ReportSummary";
import ReportDetails from "./pages/ReportDetails";
import ChartsPage from "./pages/ChartsPage";
import UploadPage from "./pages/UploadPage";
import KpiManagementPage from "./pages/KpiManagementPage";
import ProcessesPage from "./pages/ProcessesPage";
import CompareReportsPage from "./pages/CompareReportsPage";

function App() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Performance Analyzer
          </Typography>

          <Button color="inherit" component={Link} to="/">
            Home
          </Button>

          <Button color="inherit" component={Link} to="/reports">
            Reports
          </Button>

          <Button color="inherit" component={Link} to="/reports/compare">
            Compare
          </Button>

          <Button color="inherit" component={Link} to="/upload">
            Upload
          </Button>

          <Button color="inherit" component={Link} to="/kpis">
            KPIs
          </Button>

          <Button color="inherit" component={Link} to="/dashboard">
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<ReportsHome />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/compare" element={<CompareReportsPage />} />

        <Route path="/report/:runId/summary" element={<ReportSummary />} />
        <Route path="/report/:runId/details" element={<ReportDetails />} />
        <Route path="/report/:runId/upload" element={<UploadPage />} />
        <Route path="/report/:runId/charts" element={<ChartsPage />} />
        <Route path="/report/:runId/processes" element={<ProcessesPage />} />

        <Route path="/upload" element={<UploadPage />} />
        <Route path="/kpis" element={<KpiManagementPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Box>
  );
}

export default App;