import React from 'react';
import { Button, Alert } from '@mui/material';
import { Payment as PaymentIcon } from '@mui/icons-material';
import { Order } from '../types/order';

interface PaymentButtonProps {
  order: Order;
}

const PaymentButton: React.FC<PaymentButtonProps> = () => {
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<PaymentIcon />}
        disabled
      >
        Payment Unavailable
      </Button>
      <Alert severity="info" sx={{ mt: 2 }}>
        Payment functionality is currently unavailable.
      </Alert>
    </>
  );
};

export default PaymentButton; 