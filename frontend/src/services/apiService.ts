import axios, { AxiosError } from 'axios';

// Types
interface ProductData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string;
  sku?: string;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  zone: string;
}

interface OrderData {
  customer_id: number;
  spaza_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    notes?: string;
  }>;
  notes?: string;
}

interface UserData {
  name: string;
  email: string;
  role: 'admin' | 'vendor' | 'spaza';
  status: 'active' | 'inactive';
  password?: string;
}

interface ApiErrorResponse {
  message: string;
  error?: string;
}

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic error handler
const handleApiError = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data as { message?: string } | undefined;
    return errorData?.message || error.message || defaultMessage;
  }
  return defaultMessage;
};

// ===== AUTHENTICATION =====
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Login failed'));
    }
  },

  register: async (userData: UserData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Registration failed'));
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to get user info'));
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Token refresh failed'));
    }
  },
};

// ===== PRODUCT MANAGEMENT =====
export const productAPI = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch products'));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch product'));
    }
  },

  create: async (data: ProductData) => {
    try {
      const response = await api.post('/products', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create product'));
    }
  },

  update: async (id: number, data: ProductData) => {
    try {
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update product'));
    }
  },

  delete: async (id: number) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete product'));
    }
  },

  bulkImport: async (products: ProductData[]) => {
    try {
      const response = await api.post('/products/bulk', { products });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to import products'));
    }
  },
};

// ===== ORDER MANAGEMENT =====
export const orderAPI = {
  getAll: async (params?: { page?: number; per_page?: number; status?: string }) => {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch orders'));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch order'));
    }
  },

  create: async (data: OrderData) => {
    try {
      const response = await api.post('/orders', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create order'));
    }
  },

  updateStatus: async (id: number, status: string) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update order status'));
    }
  },

  delete: async (id: number) => {
    try {
      const response = await api.delete(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete order'));
    }
  },
};

// ===== CUSTOMER MANAGEMENT =====
export const customerAPI = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    try {
      const response = await api.get('/customers', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch customers'));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch customer'));
    }
  },

  create: async (data: CustomerData) => {
    try {
      const response = await api.post('/customers', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create customer'));
    }
  },

  update: async (id: number, data: CustomerData) => {
    try {
      const response = await api.put(`/customers/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update customer'));
    }
  },

  delete: async (id: number) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete customer'));
    }
  },
};

// ===== USER MANAGEMENT =====
export const userAPI = {
  getAll: async (params?: { page?: number; per_page?: number; role?: string }) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch users'));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch user'));
    }
  },

  create: async (data: UserData) => {
    try {
      const response = await api.post('/users', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create user'));
    }
  },

  update: async (id: number, data: Partial<UserData>) => {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update user'));
    }
  },

  delete: async (id: number) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete user'));
    }
  },
};

// ===== PAYMENT MANAGEMENT =====
export const paymentAPI = {
  getHistory: async (params?: { page?: number; per_page?: number; status?: string }) => {
    try {
      const response = await api.get('/payments/history', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch payment history'));
    }
  },

  initializePayment: async (orderId: number, amount: number) => {
    try {
      const response = await api.post('/payments/initialize', { order_id: orderId, amount });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to initialize payment'));
    }
  },

  verifyPayment: async (reference: string) => {
    try {
      const response = await api.get(`/payments/verify/${reference}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to verify payment'));
    }
  },

  getVendorPayments: async (params?: { page?: number; per_page?: number }) => {
    try {
      const response = await api.get('/payments/vendor', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch vendor payments'));
    }
  },
};

// ===== DASHBOARD & ANALYTICS =====
export const dashboardAPI = {
  getMetrics: async () => {
    try {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch dashboard metrics'));
    }
  },

  getActivityLogs: async (params?: { page?: number; per_page?: number }) => {
    try {
      const response = await api.get('/dashboard/activity-logs', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch activity logs'));
    }
  },
};

export default api; 