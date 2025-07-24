import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as ShippingIcon,
  Store as StoreIcon,
  ShoppingCart as CartIcon,
  Assignment as AssignmentIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { OrderStatusHistory, OrderStatus } from '../types/order';
import { logger } from '../utils/logger';

interface OrderTimelineProps {
  history: OrderStatusHistory[];
}

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return <CartIcon />;
    case 'confirmed':
      return <CheckCircleIcon />;
    case 'processing':
      return <AssignmentIcon />;
    case 'shipped':
      return <ShippingIcon />;
    case 'delivered':
      return <StoreIcon />;
    case 'cancelled':
      return <CancelIcon />;
    case 'failed':
      return <ErrorIcon />;
    case 'paid':
      return <CheckCircleIcon />;
    default:
      return <CartIcon />;
  }
};

const getStatusColor = (status: OrderStatus): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'grey' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'info';
    case 'processing':
      return 'primary';
    case 'shipped':
      return 'secondary';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'failed':
      return 'error';
    case 'paid':
      return 'success';
    default:
      return 'grey';
  }
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    logger.error('Error formatting date', { error, dateString }, 'OrderTimeline');
    return 'Invalid date';
  }
};

const OrderTimeline: React.FC<OrderTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Order Timeline
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No status history available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Order Timeline
      </Typography>
      <Timeline>
        {history.map((entry) => (
          <TimelineItem key={entry.id}>
            <TimelineOppositeContent>
              {formatDate(entry.created_at)}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={getStatusColor(entry.to_status) as 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'grey'}>
                {getStatusIcon(entry.to_status)}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle1">
                Status changed from {entry.from_status} to {entry.to_status}
              </Typography>
              {entry.notes && (
                <Typography variant="body2" color="text.secondary">
                  {entry.notes}
                </Typography>
              )}
              {entry.changed_by_name && (
                <Typography variant="caption" color="text.secondary">
                  Changed by: {entry.changed_by_name}
                </Typography>
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
};

export default OrderTimeline; 