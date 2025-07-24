import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const MonitoringDashboard: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Monitoring Dashboard
        </Typography>
        <Typography variant="body1">
          Welcome to the monitoring dashboard. This page is under construction.
        </Typography>
      </Box>
    </Container>
  );
};

export default MonitoringDashboard; 