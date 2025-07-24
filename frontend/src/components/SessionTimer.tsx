import React from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import { useTokenTimer } from '../hooks/useTokenTimer';
import { useAuth } from '../contexts/AuthContext';

const SessionTimer: React.FC = () => {
  const { timeLeft, formattedTimeLeft, showWarning } = useTokenTimer();
  const { logout } = useAuth();

  if (!timeLeft) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
      {showWarning ? (
        <Alert
          severity="warning"
          sx={{ mb: 1 }}
          action={
            <Button color="inherit" size="small" onClick={logout}>
              Logout Now
            </Button>
          }
        >
          Your session will expire in {formattedTimeLeft}
        </Alert>
      ) : (
        <Typography
          variant="caption"
          sx={{
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          Session: {formattedTimeLeft}
        </Typography>
      )}
    </Box>
  );
};

export default SessionTimer; 