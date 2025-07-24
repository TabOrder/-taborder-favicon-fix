import axios from 'axios';

export interface SystemHealth {
  timestamp: string;
  session_health: {
    total_sessions: number;
    active_sessions: number;
    expired_sessions: number;
    expiry_rate: number;
  };
  order_health: {
    total_orders: number;
    pending_orders: number;
    failed_orders: number;
    failure_rate: number;
  };
  abnormal_patterns: {
    abuse_spazas: Array<{
      spaza_id: number;
      reason: string;
      type: string;
    }>;
    session_issues: {
      total_sessions: number;
      restart_sessions: number;
      restart_rate: number;
      slow_sessions: number;
      slow_rate: number;
      needs_attention: boolean;
    };
    delivery_issues: {
      total_orders: number;
      failed_deliveries: number;
      timeout_orders: number;
      failure_rate: number;
      needs_attention: boolean;
    };
  };
  system_healthy: boolean;
}

export interface MetricsSummary {
  timestamp: string;
  metrics: {
    active_sessions: number;
    expired_session_rate: number;
    orders_today: number;
    delivery_failures: number;
    abuse_spazas: number;
  };
  status: {
    sessions: string;
    delivery: string;
    abuse: string;
  };
}

export interface HistoricalMetrics {
  timestamp: string;
  metrics: {
    session_restart_rate: number;
    delivery_failure_rate: number;
    abuse_count: number;
  };
}

export interface AlertConfig {
  email?: string;
  slack?: string;
  thresholds: {
    session_restart_rate: number;
    delivery_failure_rate: number;
    abuse_threshold: number;
  };
}

export interface AbuseReview {
  status: 'flagged' | 'reviewed';
  reason?: string;
  metrics?: {
    total_orders: number;
    rejected_orders: number;
    rejection_rate: number;
  };
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const monitoringService = {
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await axios.get(`${API_BASE_URL}/api/monitoring/health`);
    return response.data;
  },

  async getMetricsSummary(): Promise<MetricsSummary> {
    const response = await axios.get(`${API_BASE_URL}/api/monitoring/metrics`);
    return response.data;
  },

  async getHistoricalMetrics(timeframe: '24h' | '7d' | '30d'): Promise<HistoricalMetrics[]> {
    const response = await axios.get(`${API_BASE_URL}/api/monitoring/history`, {
      params: { timeframe }
    });
    return response.data;
  },

  async configureAlerts(config: AlertConfig): Promise<{ status: string; message: string }> {
    const response = await axios.post(`${API_BASE_URL}/api/monitoring/alerts`, config);
    return response.data;
  },

  async reviewAbuseSpaza(spazaId: number): Promise<AbuseReview> {
    const response = await axios.post(`${API_BASE_URL}/api/monitoring/abuse/review/${spazaId}`);
    return response.data;
  }
}; 