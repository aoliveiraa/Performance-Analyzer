import { Box, Container, Paper, Typography } from "@mui/material";

function KpiManagementPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            KPI Management
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 2 }}>
            This page will contain the KPI registration and update form.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default KpiManagementPage;