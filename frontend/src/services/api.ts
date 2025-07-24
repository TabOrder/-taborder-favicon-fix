import axios, { AxiosError } from 'axios';

// Types
interface VendorProfile {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  business_name?: string;
  business_type?: string;
}

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

interface SpazaData {
  name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  zone_id: number;
  role_type: string;
  status: string;
  commission_rate?: number;
  performance_tier?: string;
}

interface ZoneData {
  name: string;
  code: string;
  description?: string;
  status: string;
  delivery_fee: number;
}

interface VendorData {
  vendor_id: string;
  name: string;
  email: string;
  phone: string;
  zone_id: number;
  status: string;
}

interface ApiErrorResponse {
  message: string;
  error?: string;
}

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
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

// ===== VENDOR MANAGEMENT =====
export const vendorAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/vendor/me');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch vendor profile'));
    }
  },

  updateProfile: async (data: VendorProfile) => {
    try {
      const response = await api.put('/vendor/profile', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update vendor profile'));
    }
  },

  getDashboard: async () => {
    try {
      const response = await api.get('/vendor/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch dashboard data'));
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

  getStats: async () => {
    try {
      const response = await api.get('/orders/stats');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch order statistics'));
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

  getSpazaCommission: async (params?: { page?: number; per_page?: number; start_date?: string; end_date?: string; paid?: boolean }) => {
    try {
      const response = await api.get('/payments/mobile-money/spaza-commission', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch spaza commission'));
    }
  },
};

// ===== SPAZA SHOP MANAGEMENT =====
export const spazaAPI = {
  getAll: async (params?: { page?: number; per_page?: number; status?: string; zone_id?: number }) => {
    try {
      const response = await api.get('/spaza-shops', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch spaza shops'));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/spaza-shops/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch spaza shop'));
    }
  },

  create: async (data: SpazaData) => {
    try {
      const response = await api.post('/spaza-shops', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create spaza shop'));
    }
  },

  update: async (id: number, data: Partial<SpazaData>) => {
    try {
      const response = await api.patch(`/spaza-shops/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update spaza shop'));
    }
  },

  delete: async (id: number) => {
    try {
      const response = await api.delete(`/spaza-shops/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete spaza shop'));
    }
  },
};

// ===== ZONE MANAGEMENT =====
export const zoneAPI = {
  getAll: async (params?: { status?: string }) => {
    try {
      const response = await api.get('/zones', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch zones'));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/zones/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch zone'));
    }
  },

  create: async (data: ZoneData) => {
    try {
      const response = await api.post('/zones', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create zone'));
    }
  },

  update: async (id: number, data: Partial<ZoneData>) => {
    try {
      const response = await api.put(`/zones/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update zone'));
    }
  },

  delete: async (id: number) => {
    try {
      const response = await api.delete(`/zones/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete zone'));
    }
  },
};

// ===== VENDOR MANAGEMENT =====
export const vendorManagementAPI = {
  getAll: async (params?: { page?: number; per_page?: number; status?: string; zone_id?: number }) => {
    try {
      const response = await api.get('/vendors', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch vendors'));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/vendors/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch vendor'));
    }
  },

  create: async (data: VendorData) => {
    try {
      const response = await api.post('/vendors', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create vendor'));
    }
  },

  update: async (id: number, data: Partial<VendorData>) => {
    try {
      const response = await api.put(`/vendors/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update vendor'));
    }
  },

  delete: async (id: number) => {
    try {
      const response = await api.delete(`/vendors/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete vendor'));
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

// Legacy functions for backward compatibility
export const getVendorMe = async () => {
  try {
    const response = await api.get('/vendor/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    throw error;
  }
};

export const updateVendorProfile = async (data: VendorProfile) => {
  try {
    const response = await api.put('/vendor/profile', data);
    return response.data;
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    throw error;
  }
};

export const getProducts = async () => {
  try {
    const response = await api.get('/vendor/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const createProduct = async (data: ProductData) => {
  try {
    const response = await api.post('/vendor/products', data);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (id: number, data: ProductData) => {
  try {
    const response = await api.put(`/vendor/products/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id: number) => {
  try {
    const response = await api.delete(`/vendor/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const getOrders = async () => {
  try {
    const response = await api.get('/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrder = async (id: number) => {
  try {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id: number, status: string) => {
  try {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// ===== HEALTH MONITORING =====
export const healthAPI = {
  getSystemHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch system health'));
    }
  },

  getSessionHealth: async () => {
    try {
      const response = await api.get('/health/sessions');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch session health'));
    }
  },
};

export default api; 