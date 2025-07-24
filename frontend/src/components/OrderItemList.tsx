import React from 'react';
import {
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { OrderItem } from '../types/order';
import { logger } from '../utils/logger';

interface OrderItemListProps {
  items: OrderItem[];
  currency?: string;
}

const OrderItemList: React.FC<OrderItemListProps> = ({ items, currency = 'ZAR' }) => {
  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      logger.error('Error formatting currency', { error, amount }, 'OrderItemList');
      return `${currency}${amount.toFixed(2)}`;
    }
  };

  if (!items || items.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No items in this order
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {items.map((item, index) => (
        <React.Fragment key={item.id || index}>
          <Box sx={{ py: 1 }}>
            <Typography variant="body1">
              {item.product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.total)}
            </Typography>
            {item.notes && (
              <Typography variant="body2" color="text.secondary">
                Notes: {item.notes}
              </Typography>
            )}
          </Box>
          {index < items.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default OrderItemList; 