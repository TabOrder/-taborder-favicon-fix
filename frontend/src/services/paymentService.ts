import axios from 'axios';
import { Order } from '../types/order';

export interface PaymentResponse {
  success: boolean;
  reference: string;
  authorization_url?: string;
  access_code?: string;
  message?: string;
}

export interface PaymentVerification {
  success: boolean;
  reference: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  message?: string;
}

export interface VendorPayment {
  id: number;
  vendor_id: number;
  vendor_name: string;
  total_orders: number;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  reference: string;
  bank_account?: string;
  mobile_wallet?: string;
}

export interface PaymentHistoryItem {
  id: number;
  orderId: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  type: 'order' | 'commission' | 'payout';
  reference: string;
  created_at: string;
  updated_at: string;
  payment_date?: string;
  provider?: string;
  metadata?: {
    spazaId?: number;
    spazaName?: string;
    commissionAmount?: number;
    payoutAmount?: number;
    payoutStatus?: 'pending' | 'completed' | 'failed';
    payoutReference?: string;
  };
}

class PaymentService {
  private static instance: PaymentService;
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  private async request<T>(
    method: string,
    url: string,
    options: { data?: unknown; params?: Record<string, unknown> } = {}
  ): Promise<T> {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${url}`,
        data: options.data,
        params: options.params,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Token might be expired, try to refresh
          await this.refreshToken();
          return this.request(method, url, options);
        }
        const errorData = error.response?.data as { message?: string } | undefined;
        throw new Error(errorData?.message || error.message);
      }
      throw error;
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${this.baseUrl}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      localStorage.setItem('token', response.data.token);
    } catch (error) {
      // If refresh fails, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  public async initializePayment(order: Order): Promise<PaymentResponse> {
    return this.request<PaymentResponse>('POST', '/payments/initialize', {
      data: {
        order_id: order.id,
        amount: order.total_amount,
        email: order.customer?.email || 'customer@taborder.com',
        callback_url: `${window.location.origin}/orders/${order.id}/payment/verify`,
      }
    });
  }

  public async verifyPayment(reference: string): Promise<PaymentVerification> {
    return this.request<PaymentVerification>('GET', `/payments/verify/${reference}`);
  }

  public async getPaymentHistory(orderId: number): Promise<PaymentHistoryItem[]> {
    return this.request<PaymentHistoryItem[]>('GET', `/payments/history/${orderId}`);
  }

  public async getSpazaCommission(spazaId: number): Promise<{
    totalCommission: number;
    pendingCommission: number;
    transactions: PaymentHistoryItem[];
  }> {
    const url = spazaId === 0 ? '/payments/commission' : `/payments/spaza/${spazaId}/commission`;
    return this.request<{
      totalCommission: number;
      pendingCommission: number;
      transactions: PaymentHistoryItem[];
    }>('GET', url);
  }

  public async processCommissionPayout(transactionIds: number[], amount: number): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/payments/mobile-money/process-commission', {
      data: { transactionIds, amount }
    });
  }

  public async getPaymentStatus(reference: string): Promise<{
    status: string;
    amount: number;
    created_at: string;
    payment_date?: string;
  }> {
    return this.request('GET', `/payments/status/${reference}`);
  }

  public async cancelPayment(reference: string): Promise<{ success: boolean; message: string }> {
    return this.request('POST', `/payments/cancel/${reference}`);
  }

  public async getVendorPayments(filters?: Record<string, unknown>): Promise<VendorPayment[]> {
    return this.request<VendorPayment[]>('GET', '/payments/vendor', { params: filters });
  }

  public async processVendorPayout(paymentId: number, amount: number): Promise<void> {
    await this.request('POST', `/payments/vendor/${paymentId}/payout`, {
      data: { amount }
    });
  }
}

export const paymentService = PaymentService.getInstance();