import { Box, Container, Paper, Typography } from "@mui/material";
import { useParams } from "react-router-dom";

function ReportDetails() {
  const { runId } = useParams();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Expanded Report by Hardware
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 2 }}>
            This page will show detailed results by hardware for run: {runId}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default ReportDetails;