import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { paymentGateway, PaymentInitiateRequest, PaymentVerifyRequest } from '../services/paymentGateway';
import { Order } from '../types/order';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  order: Order;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  order,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobileProvider, setMobileProvider] = useState<'MTN' | 'VODACOM' | 'AIRTEL' | 'MPESA'>('MTN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const availableMethods = paymentGateway.getAvailablePaymentMethods();

  useEffect(() => {
    if (open) {
      setSelectedMethod('');
      setEmail('');
      setPhone('');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handlePaymentInitiation = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: PaymentInitiateRequest = {
        orderId: Number(order.id),
        amount: order.total_amount,
        email: email,
        phone: phone || undefined,
        callbackUrl: `${window.location.origin}/payment/callback`,
        metadata: {
          order_number: order.order_number,
          customer_name: order.customer.name,
        },
      };

      let response;

      if (selectedMethod === 'mobile_money' || selectedMethod === 'mpesa') {
        if (!phone) {
          throw new Error('Phone number is required for mobile money payments');
        }
        
        response = await paymentGateway.initiateMobileMoneyPayment({
          orderId: Number(order.id),
          amount: order.total_amount,
          phone: phone,
          provider: mobileProvider,
          callbackUrl: `${window.location.origin}/payment/callback`,
        });
      } else {
        response = await paymentGateway.initiatePayment(request);
      }

      if (response.status === 'success' && response.data) {
        setSuccess(true);
        
        // Store payment reference for verification
        localStorage.setItem('payment_reference', response.data.reference);
        
        // Redirect to payment page
        window.open(response.data.authorizationUrl, '_blank');
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initiation failed';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentVerification = async () => {
    const reference = localStorage.getItem('payment_reference');
    if (!reference) {
      setError('No payment reference found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: PaymentVerifyRequest = { reference };
      const response = await paymentGateway.verifyPayment(request);

      if (response.status === 'success' && response.data) {
        if (response.data.status === 'success') {
          onPaymentSuccess(response.data);
          onClose();
        } else {
          setError('Payment was not successful. Please try again.');
        }
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment verification failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const renderPaymentMethodCard = (method: any) => (
    <Card 
      key={method.id}
      sx={{ 
        mb: 2,
        border: selectedMethod === method.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
        cursor: 'pointer',
      }}
    >
      <CardActionArea onClick={() => setSelectedMethod(method.id)}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h4">{method.icon}</Typography>
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                {method.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {method.description}
              </Typography>
            </Box>
            {selectedMethod === method.id && (
              <CheckIcon color="primary" />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  const renderPaymentForm = () => {
    if (selectedMethod === 'mobile_money' || selectedMethod === 'mpesa') {
      return (
        <Box>
          <TextField
            fullWidth
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+27123456789"
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Mobile Money Provider</InputLabel>
            <Select
              value={mobileProvider}
              onChange={(e) => setMobileProvider(e.target.value as any)}
              label="Mobile Money Provider"
            >
              <MenuItem value="MTN">MTN Mobile Money</MenuItem>
              <MenuItem value="VODACOM">Vodacom M-Pesa</MenuItem>
              <MenuItem value="AIRTEL">Airtel Money</MenuItem>
              <MenuItem value="MPESA">M-Pesa</MenuItem>
            </Select>
          </FormControl>
        </Box>
      );
    }

    return (
      <TextField
        fullWidth
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="customer@example.com"
        margin="normal"
        required
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <PaymentIcon color="primary" />
          <Typography variant="h6">Complete Payment</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Payment initiated successfully! Please complete the payment in the new window.
          </Alert>
        )}

        {/* Order Summary */}
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Order Number:</Typography>
              <Typography fontWeight="bold">{order.order_number}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Customer:</Typography>
              <Typography>{order.customer.name}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Items:</Typography>
              <Typography>{order.items.length} items</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Total Amount:</Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(order.total_amount)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Typography variant="h6" gutterBottom>
          Select Payment Method
        </Typography>
        
        {availableMethods.map(renderPaymentMethodCard)}

        {/* Payment Form */}
        {selectedMethod && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Payment Details
            </Typography>
            {renderPaymentForm()}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        
        {success ? (
          <Button
            onClick={handlePaymentVerification}
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {isLoading ? 'Verifying...' : 'Verify Payment'}
          </Button>
        ) : (
          <Button
            onClick={handlePaymentInitiation}
            variant="contained"
            disabled={isLoading || !selectedMethod || !email}
            startIcon={isLoading ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {isLoading ? 'Processing...' : 'Pay Now'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal; 