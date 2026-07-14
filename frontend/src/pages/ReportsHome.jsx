import { Box, Button, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

function ReportsHome() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
          Performance Analyzer
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Main page with all performance reports and executions.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h5" fontWeight="bold">
                Reports
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                View existing executions and open summaries.
              </Typography>

              <Button
                component={Link}
                to="/reports"
                variant="contained"
                fullWidth
              >
                Open Reports
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h5" fontWeight="bold">
                Upload Files
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Create runs and upload Load/Counters CSV files.
              </Typography>

              <Button
                component={Link}
                to="/upload"
                variant="contained"
                fullWidth
              >
                Open Upload
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography variant="h5" fontWeight="bold">
                KPI Management
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Register and update KPIs used by reports.
              </Typography>

              <Button
                component={Link}
                to="/kpis"
                variant="contained"
                fullWidth
              >
                Open KPIs
              </Button>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 4, p: 3, borderRadius: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight="bold">
              Temporary Access
            </Typography>

            <Typography color="text.secondary">
              The current dashboard is still available while we migrate the features to separated pages.
            </Typography>

            <Button
              component={Link}
              to="/dashboard"
              variant="outlined"
              sx={{ width: 220 }}
            >
              Open Current Dashboard
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}

export default ReportsHome;