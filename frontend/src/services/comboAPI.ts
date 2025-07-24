import axios from 'axios';

// Types
export interface ComboItem {
  id?: number;
  name: string;
  brand?: string;
  size?: string;
  price: number;
  quantity: number;
  stock_id?: string;
  stock_item_id?: string;
}

export interface ComboData {
  id?: number;
  name: string;
  description: string;
  price: number;
  combo_price?: number;
  original_total?: number;
  discount_amount?: number;
  discount_percentage?: number;
  commission_amount?: number;
  commission_percentage?: number;
  category?: string;
  is_active?: boolean;
  items: ComboItem[];
}

export interface ComboResponse {
  success: boolean;
  message: string;
  combo?: ComboData;
  combos?: ComboData[];
  count?: number;
}

export interface ComboStats {
  total_combos: number;
  active_combos: number;
  total_items: number;
  categories: number;
}

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const comboAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
comboAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
comboAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const comboService = {
  // Get all combos
  async getAll(): Promise<ComboResponse> {
    const response = await comboAPI.get('/combos/');
    return response.data;
  },

  // Get a specific combo
  async getById(id: number): Promise<ComboResponse> {
    const response = await comboAPI.get(`/combos/${id}`);
    return response.data;
  },

  // Create a new combo
  async create(data: ComboData): Promise<ComboResponse> {
    const response = await comboAPI.post('/combos/', data);
    return response.data;
  },

  // Update a combo
  async update(id: number, data: ComboData): Promise<ComboResponse> {
    const response = await comboAPI.put(`/combos/${id}`, data);
    return response.data;
  },

  // Delete a combo
  async delete(id: number): Promise<ComboResponse> {
    const response = await comboAPI.delete(`/combos/${id}`);
    return response.data;
  },

  // Toggle combo active status
  async toggle(id: number): Promise<ComboResponse> {
    const response = await comboAPI.post(`/combos/${id}/toggle`);
    return response.data;
  },

  // Get combo statistics
  async getStats(): Promise<ComboStats> {
    const response = await comboAPI.get('/combos/stats');
    return response.data;
  },

  // Add item to combo
  async addItem(comboId: number, itemData: { stock_item_id: string; quantity: number }): Promise<ComboResponse> {
    const response = await comboAPI.post(`/combos/${comboId}/items`, itemData);
    return response.data;
  },

  // Remove item from combo
  async removeItem(comboId: number, itemId: number): Promise<ComboResponse> {
    const response = await comboAPI.delete(`/combos/${comboId}/items/${itemId}`);
    return response.data;
  },

  // Get combo audit log
  async getAuditLog(comboId: number): Promise<{ success: boolean; combo_name: string; audit_log: any[] }> {
    const response = await comboAPI.get(`/combos/${comboId}/audit-log`);
    return response.data;
  }
};

export default comboService; 