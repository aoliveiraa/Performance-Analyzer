import { useState } from "react";

import { Box, Container, Typography } from "@mui/material";

import RunUploadPanel from "../components/RunUploadPanel";

function UploadPage() {
  const [selectedRunId, setSelectedRunId] = useState("");
  
  const handleRunDataChanged = async (runId) => {
    setSelectedRunId(runId);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
          Upload Run Files
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Create/select a run and upload multiple Load and Counters CSV files.
        </Typography>

        <RunUploadPanel
          runId={selectedRunId}
          onRunChange={setSelectedRunId}
          onRunDataChanged={handleRunDataChanged}
        />
      </Box>
    </Container>
  );
}

export default UploadPage;