import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { Order, OrderStatus } from '../types/order';
import ErrorBoundary from './ErrorBoundary';
import { logger } from '../utils/logger';
import OrderStatusChip from './OrderStatusChip';

interface OrderTableProps {
  orders: Order[];
  totalOrders: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onViewOrder: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  onDeleteOrder?: (order: Order) => void;
  onStatusChange?: (order: Order, newStatus: OrderStatus) => void;
  onInitiatePayment?: (order: Order) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  totalOrders,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  onInitiatePayment,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    try {
      setMenuAnchorEl(event.currentTarget);
      setSelectedOrder(order);
      logger.info('Order menu opened', { orderId: order.id }, 'OrderTable');
    } catch (error) {
      logger.error('Error opening order menu', { error, orderId: order.id }, 'OrderTable');
    }
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedOrder(null);
    logger.debug('Order menu closed', null, 'OrderTable');
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    try {
      if (selectedOrder && onStatusChange) {
        onStatusChange(selectedOrder, newStatus);
        logger.info('Order status changed', {
          orderId: selectedOrder.id,
          oldStatus: selectedOrder.status,
          newStatus
        }, 'OrderTable');
      }
      handleMenuClose();
    } catch (error) {
      logger.error('Error changing order status', {
        error,
        orderId: selectedOrder?.id,
        newStatus
      }, 'OrderTable');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      logger.error('Error formatting date', { error, dateString }, 'OrderTable');
      return 'Invalid date';
    }
  };

  return (
    <ErrorBoundary>
      <Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Spaza Shop</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {order.order_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.customer.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.spaza_id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.items.length} items
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(order.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <OrderStatusChip status={order.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(order.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onViewOrder(order)}
                          aria-label="view order"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, order)}
                          aria-label="more"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalOrders}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          {onEditOrder && (
            <MenuItem onClick={() => {
              if (selectedOrder) onEditOrder(selectedOrder);
              handleMenuClose();
            }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
          )}
          {onInitiatePayment && selectedOrder && selectedOrder.status !== 'paid' && (
            <MenuItem onClick={() => {
              if (selectedOrder) onInitiatePayment(selectedOrder);
              handleMenuClose();
            }}>
              <PaymentIcon fontSize="small" sx={{ mr: 1 }} />
              Process Payment
            </MenuItem>
          )}
          {onDeleteOrder && (
            <MenuItem onClick={() => {
              if (selectedOrder) onDeleteOrder(selectedOrder);
              handleMenuClose();
            }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          )}
          {onStatusChange && selectedOrder && (
            <MenuItem onClick={() => handleStatusChange('delivered')}>
              Mark as Delivered
            </MenuItem>
          )}
        </Menu>
      </Box>
    </ErrorBoundary>
  );
};

export default OrderTable;