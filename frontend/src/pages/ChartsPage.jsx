import { Box, Container, Paper, Typography } from "@mui/material";
import { useParams } from "react-router-dom";

function ChartsPage() {
  const { runId } = useParams();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Charts
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 2 }}>
            This page will show charts for run: {runId}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default ChartsPage;