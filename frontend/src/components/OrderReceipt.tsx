import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { Order, OrderItem } from '../types/order';
import { logger } from '../utils/logger';

// Register font
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxM.woff2' },
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlfBBc9AMX6lJBP.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 24,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 16,
    borderBottom: '2px solid #333',
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#333',
    marginBottom: 4,
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontWeight: 700,
    color: '#333',
  },
  value: {
    color: '#333',
  },
  itemsHeader: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: 700,
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 12,
    color: '#333',
  },
  itemQty: {
    fontSize: 12,
    color: '#333',
  },
  itemTotal: {
    fontSize: 12,
    color: '#333',
  },
  total: {
    marginTop: 12,
    fontWeight: 700,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  footer: {
    marginTop: 24,
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
});

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    logger.error('Error formatting date', { error, date }, 'OrderReceipt');
    return 'Invalid date';
  }
};

interface OrderReceiptProps {
  order: Order;
  currency?: string;
}

const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, currency = 'ZAR' }) => {
  if (!order || !order.items || order.items.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Order Receipt</Text>
            <Text>No order data available</Text>
          </View>
        </Page>
      </Document>
    );
  }

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      logger.error('Error formatting currency', { error, amount }, 'OrderReceipt');
      return `${currency}${amount.toFixed(2)}`;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Order Receipt</Text>
          <Text>Order #: {order.order_number}</Text>
          <Text>Date: {formatDate(order.created_at)}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{order.customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Spaza Shop:</Text>
            <Text style={styles.value}>{order.spaza_id}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.itemsHeader}>Order Items</Text>
          {order.items.map((item: OrderItem) => (
            <View style={styles.itemRow} key={item.id}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemQty}>{item.quantity} × {formatCurrency(item.price)}</Text>
              <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.total}>
          <Text>Total: {formatCurrency(order.total_amount)}</Text>
        </View>
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{order.notes}</Text>
          </View>
        )}
        <View style={styles.footer}>
          <Text>Thank you for your order!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default OrderReceipt; 