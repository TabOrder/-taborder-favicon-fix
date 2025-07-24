import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Grid,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  PieLabelRenderProps,
} from 'recharts';
import axios, { AxiosError } from 'axios';

interface SystemHealth {
  status: string;
  message: string;
  timestamp: string;
  components: {
    database: { status: string };
    cache: { status: string };
    api: { status: string };
  };
}

interface OrderHealth {
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  failed_orders: number;
  average_processing_time: number;
}

interface VendorHealth {
  total_vendors: number;
  active_vendors: number;
  total_products: number;
  low_stock_products: number;
}

interface SpazaHealth {
  total_shops: number;
  active_shops: number;
  total_customers: number;
  active_customers: number;
}

interface ApiError {
  message: string;
}

interface PieData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ResponsiveContainerComponent = ResponsiveContainer as unknown as React.ComponentType<{ width: string; height: string; children: React.ReactNode }>;
const PieChartComponent = PieChart as unknown as React.ComponentType<{ children: React.ReactNode }>;
const PieComponent = Pie as unknown as React.ComponentType<{
  data: PieData[];
  cx: string;
  cy: string;
  labelLine: boolean;
  label: (props: PieLabelRenderProps) => string;
  outerRadius: number;
  fill: string;
  dataKey: string;
  children: React.ReactNode;
}>;
const CellComponent = Cell as unknown as React.ComponentType<{ key: string; fill: string }>;
const TooltipComponent = Tooltip as unknown as React.ComponentType;
const BarChartComponent = BarChart as unknown as React.ComponentType<{ data: PieData[]; children: React.ReactNode }>;
const CartesianGridComponent = CartesianGrid as unknown as React.ComponentType<{ strokeDasharray: string }>;
const XAxisComponent = XAxis as unknown as React.ComponentType<{ dataKey: string }>;
const YAxisComponent = YAxis as unknown as React.ComponentType;
const LegendComponent = Legend as unknown as React.ComponentType;
const BarComponent = Bar as unknown as React.ComponentType<{ dataKey: string; fill: string }>;

const AnalyticsDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [orderHealth, setOrderHealth] = useState<OrderHealth | null>(null);
  const [vendorHealth, setVendorHealth] = useState<VendorHealth | null>(null);
  const [spazaHealth, setSpazaHealth] = useState<SpazaHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('today');

  const fetchHealthData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [systemRes, orderRes, vendorRes, spazaRes] = await Promise.all([
        axios.get<SystemHealth>('/api/health'),
        axios.get<OrderHealth>('/api/health/orders'),
        axios.get<VendorHealth>('/api/health/vendors'),
        axios.get<SpazaHealth>('/api/health/spazas'),
      ]);

      setSystemHealth(systemRes.data);
      setOrderHealth(orderRes.data);
      setVendorHealth(vendorRes.data);
      setSpazaHealth(spazaRes.data);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message || 'Failed to fetch health data');
      console.error('Health data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchHealthData, timeRange]);

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const orderData = orderHealth ? [
    { name: 'Active', value: orderHealth.active_orders },
    { name: 'Completed', value: orderHealth.completed_orders },
    { name: 'Failed', value: orderHealth.failed_orders },
  ] : [];

  const vendorData = vendorHealth ? [
    { name: 'Active Vendors', value: vendorHealth.active_vendors },
    { name: 'Total Products', value: vendorHealth.total_products },
    { name: 'Low Stock', value: vendorHealth.low_stock_products },
  ] : [];

  const renderPieLabel = ({ name, percent = 0 }: PieLabelRenderProps) => {
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">System Analytics</Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* System Health */}
        <Grid component="div" item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Health</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography>
                  Status: <span style={{ color: systemHealth?.status === 'healthy' ? 'green' : 'red' }}>
                    {systemHealth?.status}
                  </span>
                </Typography>
                <Typography>Last Updated: {new Date(systemHealth?.timestamp || '').toLocaleString()}</Typography>
                <Typography>Database: {systemHealth?.components.database.status}</Typography>
                <Typography>Cache: {systemHealth?.components.cache.status}</Typography>
                <Typography>API: {systemHealth?.components.api.status}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Health */}
        <Grid component="div" item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Order Health</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography>Total Orders: {orderHealth?.total_orders}</Typography>
                <Typography>Active Orders: {orderHealth?.active_orders}</Typography>
                <Typography>Completed Orders: {orderHealth?.completed_orders}</Typography>
                <Typography>Failed Orders: {orderHealth?.failed_orders}</Typography>
                <Typography>Avg Processing Time: {orderHealth?.average_processing_time.toFixed(2)}s</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Distribution Chart */}
        <Grid component="div" item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Order Distribution</Typography>
              <Box height={300}>
                <ResponsiveContainerComponent width="100%" height="100%">
                  <PieChartComponent>
                    <PieComponent
                      data={orderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderPieLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderData.map((entry, index) => (
                        <CellComponent key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </PieComponent>
                    <TooltipComponent />
                  </PieChartComponent>
                </ResponsiveContainerComponent>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Vendor Health */}
        <Grid component="div" item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Vendor Health</Typography>
              <Box height={300}>
                <ResponsiveContainerComponent width="100%" height="100%">
                  <BarChartComponent data={vendorData}>
                    <CartesianGridComponent strokeDasharray="3 3" />
                    <XAxisComponent dataKey="name" />
                    <YAxisComponent />
                    <TooltipComponent />
                    <LegendComponent />
                    <BarComponent dataKey="value" fill="#8884d8" />
                  </BarChartComponent>
                </ResponsiveContainerComponent>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Spaza Health */}
        <Grid component="div" item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Spaza Shop Health</Typography>
              <Grid container spacing={2}>
                <Grid component="div" item xs={6} md={3}>
                  <Typography variant="subtitle2">Total Shops</Typography>
                  <Typography variant="h4">{spazaHealth?.total_shops}</Typography>
                </Grid>
                <Grid component="div" item xs={6} md={3}>
                  <Typography variant="subtitle2">Active Shops</Typography>
                  <Typography variant="h4">{spazaHealth?.active_shops}</Typography>
                </Grid>
                <Grid component="div" item xs={6} md={3}>
                  <Typography variant="subtitle2">Total Customers</Typography>
                  <Typography variant="h4">{spazaHealth?.total_customers}</Typography>
                </Grid>
                <Grid component="div" item xs={6} md={3}>
                  <Typography variant="subtitle2">Active Customers</Typography>
                  <Typography variant="h4">{spazaHealth?.active_customers}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 