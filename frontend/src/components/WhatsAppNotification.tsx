import React from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { OrderStatus } from '../types/order';

interface WhatsAppNotificationProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  phoneNumber: string;
}

const getStatusMessage = (status: OrderStatus, notes?: string): string => {
  const baseMessages = {
    pending: 'Your order has been received and is pending confirmation.',
    confirmed: 'Your order has been confirmed and is being prepared.',
    processing: 'Your order is now being processed.',
    shipped: 'Your order is on its way!',
    delivered: 'Your order has been delivered.',
    cancelled: 'Your order has been cancelled.',
    failed: 'There was an issue with your order.',
    paid: 'Payment for your order has been completed successfully.',
  };

  const baseMessage = baseMessages[status] || 'Your order status has been updated.';
  return notes ? `${baseMessage}\n\nNote: ${notes}` : baseMessage;
};

const WhatsAppNotification: React.FC<WhatsAppNotificationProps> = ({
  enabled,
  onToggle,
  phoneNumber,
}) => {
  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(event.target.checked);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={handleToggle}
            color="primary"
          />
        }
        label="Enable WhatsApp Notifications"
      />
      {enabled && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Notifications will be sent to: {phoneNumber}
        </Typography>
      )}
    </Box>
  );
};

export default WhatsAppNotification;
export { getStatusMessage }; 