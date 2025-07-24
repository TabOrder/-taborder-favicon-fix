import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Order, OrderStatus, OrderStatusHistory } from '../types/order';
import OrderReceipt from './OrderReceipt';
import StatusChangeDialog from './StatusChangeDialog';
import OrderStatusChip from './OrderStatusChip';
import OrderItemList from './OrderItemList';

// Temporarily mock PDFDownloadLink for testing
const PDFDownloadLink = ({ children, ...props }: any) => {
  return <div data-testid="pdf-download-link">{children({ loading: false })}</div>;
};

interface OrderDetailsProps {
  order: Order;
  onStatusChange: (status: OrderStatus, notes?: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const formatCurrency = (amount: number, currency: string = 'ZAR') => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  onStatusChange,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [statusNotes, setStatusNotes] = useState('');

  const fetchStatusHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${order.id}/status-history`);
      if (!response.ok) {
        throw new Error('Failed to fetch status history');
      }
      const data = await response.json();
      setStatusHistory(data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status history');
    } finally {
      setLoading(false);
    }
  }, [order.id]);

  useEffect(() => {
    if (order.id) {
      fetchStatusHistory();
    }
  }, [order.id, fetchStatusHistory]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusClick = (status: OrderStatus) => {
    setSelectedStatus(status);
    setStatusNotes('');
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
    setSelectedStatus(null);
    setStatusNotes('');
  };

  const handleStatusChange = () => {
    if (!selectedStatus) {
      return;
    }
    onStatusChange(selectedStatus, statusNotes || undefined);
    handleStatusDialogClose();
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case 'pending':
        return ['confirmed', 'cancelled', 'failed'];
      case 'confirmed':
        return ['processing', 'cancelled', 'failed'];
      case 'processing':
        return ['shipped', 'cancelled', 'failed'];
      case 'shipped':
        return ['delivered', 'cancelled', 'failed'];
      case 'delivered':
        return [];
      case 'cancelled':
        return [];
      case 'failed':
        return ['pending', 'cancelled'];
      default:
        return [];
    }
  };

  const renderStatusTimeline = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Typography color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      );
    }

    return (
      <List>
        {statusHistory.map((entry) => (
          <React.Fragment key={entry.id}>
            <ListItem>
              <ListItemText
                primary={`Status changed from ${entry.from_status} to ${entry.to_status}`}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.secondary">
                      {formatDate(entry.created_at)}
                    </Typography>
                    {entry.notes && (
                      <Typography component="div" variant="body2" color="text.secondary">
                        Note: {entry.notes}
                      </Typography>
                    )}
                    {entry.changed_by_name && (
                      <Typography component="div" variant="body2" color="text.secondary">
                        Changed by: {entry.changed_by_name}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Order #{order.order_number}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <PDFDownloadLink
                document={<OrderReceipt order={order} currency={order.currency || 'ZAR'} />}
                fileName={`order-${order.order_number}.pdf`}
              >
                {({ loading }: { loading: boolean }) => (
                  <Button
                    variant="outlined"
                    startIcon={<ReceiptIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Generating...' : 'Download Receipt'}
                  </Button>
                )}
              </PDFDownloadLink>
              <IconButton onClick={handleMenuClick} aria-label="more">
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Customer Information</Typography>
          <Typography>Name: {order.customer.name}</Typography>
          <Typography>Email: {order.customer.email}</Typography>
          <Typography>Phone: {order.customer.phone}</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Order Information</Typography>
          <Typography component="div">Status: <OrderStatusChip status={order.status} /></Typography>
          <Typography>Date: {formatDate(order.created_at)}</Typography>
          <Typography>Total: {formatCurrency(order.total_amount, order.currency)}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>Order Items</Typography>
          <OrderItemList items={order.items} currency={order.currency} />
        </Grid>

        {order.notes && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Notes</Typography>
            <Typography>{order.notes}</Typography>
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>Status History</Typography>
          {renderStatusTimeline()}
        </Grid>
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {getNextStatus(order.status).map((status) => (
          <MenuItem key={status} onClick={() => handleStatusClick(status)}>
            Change to {status.charAt(0).toUpperCase() + status.slice(1)}
          </MenuItem>
        ))}
        <MenuItem onClick={onEdit}>
          <EditIcon sx={{ mr: 1 }} /> Edit Order
        </MenuItem>
        <MenuItem onClick={onDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete Order
        </MenuItem>
      </Menu>

      <StatusChangeDialog
        open={statusDialogOpen}
        status={selectedStatus || null}
        notes={statusNotes}
        onNotesChange={setStatusNotes}
        onClose={handleStatusDialogClose}
        onConfirm={handleStatusChange}
      />
    </Paper>
  );
};

export default OrderDetails; 