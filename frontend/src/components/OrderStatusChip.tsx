import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { OrderStatus } from '../types/order';

interface OrderStatusChipProps extends Omit<ChipProps, 'color'> {
  status: OrderStatus;
}

const getStatusColor = (status: OrderStatus): ChipProps['color'] => {
  switch (status) {
    case 'pending':
      return 'default';  // grey
    case 'confirmed':
      return 'info';     // blue
    case 'processing':
      return 'primary';  // blue
    case 'shipped':
      return 'secondary'; // purple
    case 'delivered':
      return 'success';  // green
    case 'cancelled':
      return 'error';    // red
    case 'failed':
      return 'warning';  // orange
    case 'paid':
      return 'success';  // green
    default:
      return 'default';
  }
};

const OrderStatusChip: React.FC<OrderStatusChipProps> = ({
  status,
  ...props
}) => {
  return (
    <Chip
      label={status.toUpperCase()}
      color={getStatusColor(status)}
      sx={{
        textTransform: 'uppercase',
        fontWeight: 'medium',
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default OrderStatusChip;