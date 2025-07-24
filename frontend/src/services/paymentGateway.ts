import axios from 'axios';

// Payment Gateway Types
export interface PaymentInitiateRequest {
  orderId: number;
  amount: number;
  email: string;
  phone?: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitiateResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    authorizationUrl: string;
    reference: string;
    accessCode: string;
  };
}

export interface PaymentVerifyRequest {
  reference: string;
}

export interface PaymentVerifyResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    status: 'success' | 'failed' | 'pending';
    gateway_response: string;
    paid_at: string;
    metadata: Record<string, any>;
  };
}

export interface MobileMoneyRequest {
  orderId: number;
  amount: number;
  phone: string;
  provider: 'MTN' | 'VODACOM' | 'AIRTEL' | 'MPESA';
  callbackUrl: string;
}

// Payment Gateway Configuration
const PAYMENT_CONFIG = {
  paystack: {
    publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || '',
    secretKey: process.env.REACT_APP_PAYSTACK_SECRET_KEY || '',
    baseUrl: 'https://api.paystack.co',
  },
  flutterwave: {
    publicKey: process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY || '',
    secretKey: process.env.REACT_APP_FLUTTERWAVE_SECRET_KEY || '',
    baseUrl: 'https://api.flutterwave.com/v3',
  },
};

// Payment Gateway Service
export class PaymentGatewayService {
  private static instance: PaymentGatewayService;
  private currentProvider: 'paystack' | 'flutterwave' = 'paystack';

  static getInstance(): PaymentGatewayService {
    if (!PaymentGatewayService.instance) {
      PaymentGatewayService.instance = new PaymentGatewayService();
    }
    return PaymentGatewayService.instance;
  }

  // Initialize payment with Paystack
  async initiatePaystackPayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    try {
      const response = await axios.post(
        `${PAYMENT_CONFIG.paystack.baseUrl}/transaction/initialize`,
        {
          amount: request.amount * 100, // Convert to kobo (smallest currency unit)
          email: request.email,
          reference: `TABORDER_${request.orderId}_${Date.now()}`,
          callback_url: request.callbackUrl,
          metadata: {
            order_id: request.orderId,
            ...request.metadata,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${PAYMENT_CONFIG.paystack.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status) {
        return {
          status: 'success',
          message: 'Payment initiated successfully',
          data: {
            authorizationUrl: response.data.data.authorization_url,
            reference: response.data.data.reference,
            accessCode: response.data.data.access_code,
          },
        };
      } else {
        throw new Error(response.data.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Paystack payment initiation error:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Payment initiation failed',
      };
    }
  }

  // Verify payment with Paystack
  async verifyPaystackPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const response = await axios.get(
        `${PAYMENT_CONFIG.paystack.baseUrl}/transaction/verify/${request.reference}`,
        {
          headers: {
            'Authorization': `Bearer ${PAYMENT_CONFIG.paystack.secretKey}`,
          },
        }
      );

      if (response.data.status) {
        const transaction = response.data.data;
        return {
          status: 'success',
          message: 'Payment verified successfully',
          data: {
            reference: transaction.reference,
            amount: transaction.amount / 100, // Convert from kobo
            currency: transaction.currency,
            channel: transaction.channel,
            status: transaction.status === 'success' ? 'success' : 'failed',
            gateway_response: transaction.gateway_response,
            paid_at: transaction.paid_at,
            metadata: transaction.metadata,
          },
        };
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Paystack payment verification error:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }
  }

  // Initialize payment with Flutterwave
  async initiateFlutterwavePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    try {
      const response = await axios.post(
        `${PAYMENT_CONFIG.flutterwave.baseUrl}/payments`,
        {
          tx_ref: `TABORDER_${request.orderId}_${Date.now()}`,
          amount: request.amount,
          currency: 'ZAR',
          redirect_url: request.callbackUrl,
          customer: {
            email: request.email,
            phone_number: request.phone,
          },
          customizations: {
            title: 'TabOrder Payment',
            description: `Payment for Order #${request.orderId}`,
            logo: 'https://your-logo-url.com/logo.png',
          },
          meta: {
            order_id: request.orderId,
            ...request.metadata,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${PAYMENT_CONFIG.flutterwave.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        return {
          status: 'success',
          message: 'Payment initiated successfully',
          data: {
            authorizationUrl: response.data.data.link,
            reference: response.data.data.tx_ref,
            accessCode: response.data.data.flw_ref,
          },
        };
      } else {
        throw new Error(response.data.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Flutterwave payment initiation error:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Payment initiation failed',
      };
    }
  }

  // Verify payment with Flutterwave
  async verifyFlutterwavePayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const response = await axios.get(
        `${PAYMENT_CONFIG.flutterwave.baseUrl}/transactions/${request.reference}/verify`,
        {
          headers: {
            'Authorization': `Bearer ${PAYMENT_CONFIG.flutterwave.secretKey}`,
          },
        }
      );

      if (response.data.status === 'success') {
        const transaction = response.data.data;
        return {
          status: 'success',
          message: 'Payment verified successfully',
          data: {
            reference: transaction.tx_ref,
            amount: transaction.amount,
            currency: transaction.currency,
            channel: transaction.payment_type,
            status: transaction.status === 'successful' ? 'success' : 'failed',
            gateway_response: transaction.processor_response,
            paid_at: transaction.created_at,
            metadata: transaction.meta,
          },
        };
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Flutterwave payment verification error:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }
  }

  // Initialize mobile money payment
  async initiateMobileMoneyPayment(request: MobileMoneyRequest): Promise<PaymentInitiateResponse> {
    try {
      // This would integrate with your backend's mobile money service
      const response = await axios.post('/api/payments/mobile-money/initialize', {
        order_id: request.orderId,
        amount: request.amount,
        phone: request.phone,
        provider: request.provider,
        callback_url: request.callbackUrl,
      });

      if (response.data.status === 'success') {
        return {
          status: 'success',
          message: 'Mobile money payment initiated',
          data: {
            authorizationUrl: response.data.data.payment_url,
            reference: response.data.data.reference,
            accessCode: response.data.data.access_code,
          },
        };
      } else {
        throw new Error(response.data.message || 'Mobile money payment failed');
      }
    } catch (error) {
      console.error('Mobile money payment error:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Mobile money payment failed',
      };
    }
  }

  // Generic payment initiation (auto-selects provider)
  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    // Try Paystack first, fallback to Flutterwave
    const paystackResult = await this.initiatePaystackPayment(request);
    
    if (paystackResult.status === 'success') {
      this.currentProvider = 'paystack';
      return paystackResult;
    }

    // Fallback to Flutterwave
    const flutterwaveResult = await this.initiateFlutterwavePayment(request);
    if (flutterwaveResult.status === 'success') {
      this.currentProvider = 'flutterwave';
      return flutterwaveResult;
    }

    return {
      status: 'failed',
      message: 'All payment providers are currently unavailable',
    };
  }

  // Generic payment verification
  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    if (this.currentProvider === 'paystack') {
      return this.verifyPaystackPayment(request);
    } else if (this.currentProvider === 'flutterwave') {
      return this.verifyFlutterwavePayment(request);
    }

    return {
      status: 'failed',
      message: 'No payment provider selected',
    };
  }

  // Get available payment methods
  getAvailablePaymentMethods(): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }> {
    return [
      {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay with Visa, Mastercard, or other cards',
        icon: '💳',
      },
      {
        id: 'bank',
        name: 'Bank Transfer',
        description: 'Direct bank transfer',
        icon: '🏦',
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        description: 'Pay with MTN, Vodacom, or Airtel Money',
        icon: '📱',
      },
      {
        id: 'mpesa',
        name: 'M-Pesa',
        description: 'Pay with M-Pesa mobile money',
        icon: '📱',
      },
    ];
  }
}

// Export singleton instance
export const paymentGateway = PaymentGatewayService.getInstance(); 