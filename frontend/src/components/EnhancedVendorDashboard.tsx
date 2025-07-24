import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  Switch,
  FormControlLabel,
  FormControl,
  Select,
  InputLabel,
  MenuItem as MuiMenuItem,
  ListItemAvatar,
} from '@mui/material';
import WhatsAppChatbot from './WhatsAppChatbot.tsx';
import ComboManagement from './ComboManagement.tsx';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Store as StoreIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  ShoppingCart,
  People as CustomersIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Print as PrintIcon,
  Print,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Upload as UploadIcon,
  Logout,
} from '@mui/icons-material';

// Interfaces
interface StockItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  wholesale_price: number;
  quantity: number;
  size: string;
  status: string;
  suggested_retail_price: number;
  platform_discount: number;
  min_stock_alert: number;
  margin_percentage: number;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'packed' | 'fulfilled' | 'cancelled';
  payment_method: string;
  pickup_point: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  total_spent: number;
  orders_count: number;
  last_order_date: string;
}

interface VendorAnalytics {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  total_value: number;
  orders_today: number;
  invoices_sent: number;
  earnings_today: number;
  fulfillment_rate: number;
  avg_pack_time: number;
  period: string;
}

interface Notification {
  id: string;
  type: 'order' | 'stock' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface VendorData {
  access_token: string;
  vendor_id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

interface EnhancedVendorDashboardProps {
  vendorData: VendorData;
  onLogout: () => void;
  apiBaseUrl: string;
}

const EnhancedVendorDashboard: React.FC<EnhancedVendorDashboardProps> = ({ 
  vendorData, 
  onLogout, 
  apiBaseUrl 
}) => {
  // State management
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI States
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);

  // Form states
  const [stockForm, setStockForm] = useState({
    name: '',
    category: '',
    brand: '',
    price: '',
    wholesale_price: '',
    quantity: '',
    size: '',
    suggested_retail_price: '',
    platform_discount: '',
    min_stock_alert: '',
    margin_percentage: '',
  });

  const [vendorSettings, setVendorSettings] = useState({
    business_name: 'TabOrder Vendor',
    vendor_code: 'V001',
    bank_details: '',
    email_notifications: true,
    whatsapp_notifications: true,
    sms_notifications: false,
    pickup_locations: ['Main Store', 'Warehouse A'],
  });

  useEffect(() => {
    loadDashboardData();
    loadNotifications();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStockItems(),
        loadOrders(),
        loadCustomers(),
        loadAnalytics(),
      ]);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStockItems = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/vendor/products`, {
        headers: {
          'Authorization': `Bearer ${vendorData.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStockItems(data.data || []);
      }
    } catch (err) {
      console.error('Error loading stock items:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/orders`, {
        headers: {
          'Authorization': `Bearer ${vendorData.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/spaza-customers`, {
        headers: {
          'Authorization': `Bearer ${vendorData.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/vendor/products/analytics`, {
        headers: {
          'Authorization': `Bearer ${vendorData.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const loadNotifications = async () => {
    // Mock notifications for now
    setNotifications([
      {
        id: '1',
        type: 'order',
        title: 'New Order Received',
        message: 'Order TO358899 - 3 items - R280.00',
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: '2',
        type: 'stock',
        title: 'Low Stock Alert',
        message: 'Sugar 2kg is running low (5 units remaining)',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
      },
      {
        id: '3',
        type: 'payment',
        title: 'Payment Received',
        message: 'R1,250.00 received for order TO358812',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
      },
    ]);
  };

  const handleStockSubmit = async () => {
    try {
      const stockData = {
        name: stockForm.name,
        category: stockForm.category,
        brand: stockForm.brand,
        price: parseFloat(stockForm.price),
        wholesale_price: parseFloat(stockForm.wholesale_price),
        quantity: parseInt(stockForm.quantity),
        size: stockForm.size,
        suggested_retail_price: parseFloat(stockForm.suggested_retail_price),
        platform_discount: parseFloat(stockForm.platform_discount),
        min_stock_alert: parseInt(stockForm.min_stock_alert),
        margin_percentage: parseFloat(stockForm.margin_percentage),
      };

      const url = editingStock ? `${apiBaseUrl}/vendor/products/${editingStock.id}` : `${apiBaseUrl}/vendor/products`;
      const method = editingStock ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vendorData.access_token}`,
        },
        body: JSON.stringify(stockData),
      });

      if (response.ok) {
        setOpenStockDialog(false);
        setEditingStock(null);
        resetStockForm();
        loadStockItems();
        loadAnalytics();
      } else {
        setError('Failed to save stock item');
      }
    } catch (err) {
      setError('Error saving stock item');
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vendorData.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadOrders();
        setOpenOrderDialog(false);
        setSelectedOrder(null);
      } else {
        setError('Failed to update order status');
      }
    } catch (err) {
      setError('Error updating order status');
    }
  };

  const handleEditStock = (item: StockItem) => {
    setEditingStock(item);
    setStockForm({
      name: item.name,
      category: item.category,
      brand: item.brand,
      price: item.price.toString(),
      wholesale_price: item.wholesale_price.toString(),
      quantity: item.quantity.toString(),
      size: item.size,
      suggested_retail_price: item.suggested_retail_price?.toString() || '',
      platform_discount: item.platform_discount.toString(),
      min_stock_alert: item.min_stock_alert.toString(),
      margin_percentage: item.margin_percentage?.toString() || '',
    });
    setOpenStockDialog(true);
  };

  const handleDeleteStock = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`${apiBaseUrl}/vendor/products/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vendorData.access_token}`,
          },
        });
        if (response.ok) {
          loadStockItems();
          loadAnalytics();
        } else {
          setError('Failed to delete stock item');
        }
      } catch (err) {
        setError('Error deleting stock item');
      }
    }
  };

  const resetStockForm = () => {
    setStockForm({
      name: '',
      category: '',
      brand: '',
      price: '',
      wholesale_price: '',
      quantity: '',
      size: '',
      suggested_retail_price: '',
      platform_discount: '',
      min_stock_alert: '',
      margin_percentage: '',
    });
  };

  const getStockStatusColor = (quantity: number, minAlert: number) => {
    if (quantity <= 0) return 'error';
    if (quantity <= minAlert) return 'warning';
    return 'success';
  };

  const getStockStatusText = (quantity: number, minAlert: number) => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= minAlert) return 'Low Stock';
    return 'In Stock';
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'packed': return 'info';
      case 'fulfilled': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const renderDashboard = () => (
    <Box>
      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ShoppingCart color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{analytics?.orders_today || 0}</Typography>
                  <Typography color="textSecondary">Orders Today</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Print color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{analytics?.invoices_sent || 0}</Typography>
                  <Typography color="textSecondary">Invoices Sent</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">R{(analytics?.earnings_today || 0).toFixed(2)}</Typography>
                  <Typography color="textSecondary">Earnings Today</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <InventoryIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{analytics?.low_stock_products || 0}</Typography>
                  <Typography color="textSecondary">Low Stock Items</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notifications */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="🔔 Notifications"
          action={
            <Button size="small" onClick={() => setCurrentPage('notifications')}>
              View All
            </Button>
          }
        />
        <CardContent>
          <List>
            {notifications.slice(0, 3).map((notification) => (
              <ListItem key={notification.id}>
                <ListItemIcon>
                  {notification.type === 'order' && <ShoppingCart color="primary" />}
                  {notification.type === 'stock' && <WarningIcon color="warning" />}
                  {notification.type === 'payment' && <MoneyIcon color="success" />}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={notification.message}
                />
                <Typography variant="caption" color="textSecondary">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </Typography>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Performance Snapshot */}
      <Card>
        <CardHeader title="📊 Performance Snapshot" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" gutterBottom>Fulfillment Rate</Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" color="primary" sx={{ mr: 2 }}>
                    {(analytics?.fulfillment_rate || 92).toFixed(0)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={analytics?.fulfillment_rate || 92}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" gutterBottom>Average Pack Time</Typography>
                <Typography variant="h4" color="secondary">
                  {analytics?.avg_pack_time || 15} min
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderOrders = () => (
    <Box>
      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search orders by number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MuiMenuItem value="all">All Status</MuiMenuItem>
                <MuiMenuItem value="pending">Pending</MuiMenuItem>
                <MuiMenuItem value="packed">Packed</MuiMenuItem>
                <MuiMenuItem value="fulfilled">Fulfilled</MuiMenuItem>
                <MuiMenuItem value="cancelled">Cancelled</MuiMenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              fullWidth
            >
              More Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.order_number}</TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>{order.items.length} items</TableCell>
                <TableCell>R{order.total_amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getOrderStatusColor(order.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedOrder(order);
                        setOpenOrderDialog(true);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Print Invoice">
                    <IconButton size="small">
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderInventory = () => (
    <Box>
      {/* Header Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">📦 Inventory Management</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            sx={{ mr: 1 }}
          >
            Bulk Upload CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingStock(null);
              resetStockForm();
              setOpenStockDialog(true);
            }}
          >
            Add New Item
          </Button>
        </Box>
      </Box>

      {/* Inventory Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Price (R)</TableCell>
              <TableCell>Wholesale (R)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.brand}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>R{item.price.toFixed(2)}</TableCell>
                <TableCell>R{item.wholesale_price.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={getStockStatusText(item.quantity, item.min_stock_alert)}
                    color={getStockStatusColor(item.quantity, item.min_stock_alert) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(item.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEditStock(item)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDeleteStock(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderCustomers = () => (
    <Box>
      <Typography variant="h5" gutterBottom>👥 Customers & Insights</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top Customers (Last 30 days)" />
            <CardContent>
              <List>
                {customers.slice(0, 5).map((customer, index) => (
                  <ListItem key={customer.id}>
                    <ListItemAvatar>
                      <Avatar>{index + 1}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={customer.name}
                      secondary={`${customer.phone} - R${customer.total_spent.toFixed(2)}`}
                    />
                    <Typography variant="body2" color="textSecondary">
                      {customer.orders_count} orders
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Popular Products" />
            <CardContent>
              <List>
                {stockItems.slice(0, 5).map((item, index) => (
                  <ListItem key={item.id}>
                    <ListItemIcon>
                      <InventoryIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.quantity} units in stock`}
                    />
                    <Typography variant="body2" color="textSecondary">
                      R{item.price.toFixed(2)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderSettings = () => (
    <Box>
      <Typography variant="h5" gutterBottom>🛠️ Settings</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Business Information" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={vendorSettings.business_name}
                    onChange={(e) => setVendorSettings({
                      ...vendorSettings,
                      business_name: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Vendor Code"
                    value={vendorSettings.vendor_code}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bank Details"
                    multiline
                    rows={3}
                    value={vendorSettings.bank_details}
                    onChange={(e) => setVendorSettings({
                      ...vendorSettings,
                      bank_details: e.target.value
                    })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Notification Preferences" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={vendorSettings.email_notifications}
                    onChange={(e) => setVendorSettings({
                      ...vendorSettings,
                      email_notifications: e.target.checked
                    })}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={vendorSettings.whatsapp_notifications}
                    onChange={(e) => setVendorSettings({
                      ...vendorSettings,
                      whatsapp_notifications: e.target.checked
                    })}
                  />
                }
                label="WhatsApp Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={vendorSettings.sms_notifications}
                    onChange={(e) => setVendorSettings({
                      ...vendorSettings,
                      sms_notifications: e.target.checked
                    })}
                  />
                }
                label="SMS Notifications"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
            <StoreIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div">
              {vendorSettings.business_name}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Switch Location
            </Typography>
            <Select size="small" value="main" sx={{ minWidth: 120 }}>
              <MuiMenuItem value="main">Main Store</MuiMenuItem>
              <MuiMenuItem value="warehouse">Warehouse A</MuiMenuItem>
            </Select>
          </Box>

          <IconButton
            color="inherit"
            onClick={(e) => setNotificationsAnchor(e.currentTarget)}
          >
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <PersonIcon />
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Navigation Tabs */}
      <Paper elevation={1} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentPage}
          onChange={(e, newValue) => setCurrentPage(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="Dashboard"
            value="dashboard"
            icon={<DashboardIcon />}
            iconPosition="start"
          />
          <Tab
            label="Orders"
            value="orders"
            icon={<OrdersIcon />}
            iconPosition="start"
          />
          <Tab
            label="Inventory"
            value="inventory"
            icon={<InventoryIcon />}
            iconPosition="start"
          />
          <Tab
            label="Customers"
            value="customers"
            icon={<CustomersIcon />}
            iconPosition="start"
          />
          <Tab
            label="Combos"
            value="combos"
            icon={<InventoryIcon />}
            iconPosition="start"
          />
          <Tab
            label="Settings"
            value="settings"
            icon={<SettingsIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {currentPage === 'dashboard' && renderDashboard()}
        {currentPage === 'orders' && renderOrders()}
        {currentPage === 'inventory' && renderInventory()}
        {currentPage === 'customers' && renderCustomers()}
        {currentPage === 'combos' && <ComboManagement vendorData={vendorData} />}
        {currentPage === 'settings' && renderSettings()}
      </Container>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={() => setNotificationsAnchor(null)}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        <MenuItem>
          <Typography variant="h6">Notifications</Typography>
        </MenuItem>
        <Divider />
        {notifications.map((notification) => (
          <MenuItem key={notification.id}>
            <ListItemIcon>
              {notification.type === 'order' && <ShoppingCart color="primary" />}
              {notification.type === 'stock' && <WarningIcon color="warning" />}
              {notification.type === 'payment' && <MoneyIcon color="success" />}
            </ListItemIcon>
            <ListItemText
              primary={notification.title}
              secondary={notification.message}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setCurrentPage('settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={onLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* WhatsApp Chatbot */}
      <WhatsAppChatbot
        vendorData={{
          name: vendorData.name,
          email: vendorData.email,
          phone: vendorData.phone || '',
          business_name: vendorSettings.business_name,
        }}
      />

      {/* Stock Item Dialog */}
      <Dialog open={openStockDialog} onClose={() => setOpenStockDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStock ? 'Edit Stock Item' : 'Add New Stock Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={stockForm.name}
                onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={stockForm.category}
                onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Brand"
                value={stockForm.brand}
                onChange={(e) => setStockForm({ ...stockForm, brand: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Size"
                value={stockForm.size}
                onChange={(e) => setStockForm({ ...stockForm, size: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Retail Price (R)"
                type="number"
                value={stockForm.price}
                onChange={(e) => setStockForm({ ...stockForm, price: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Wholesale Price (R)"
                type="number"
                value={stockForm.wholesale_price}
                onChange={(e) => setStockForm({ ...stockForm, wholesale_price: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Stock Alert"
                type="number"
                value={stockForm.min_stock_alert}
                onChange={(e) => setStockForm({ ...stockForm, min_stock_alert: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStockDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleStockSubmit} variant="contained">
            {editingStock ? 'Update' : 'Add'} Stock Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={openOrderDialog} onClose={() => setOpenOrderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details - {selectedOrder?.order_number}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">Customer Information</Typography>
                  <Typography>Name: {selectedOrder.customer_name}</Typography>
                  <Typography>Phone: {selectedOrder.customer_phone}</Typography>
                  <Typography>Pickup: {selectedOrder.pickup_point}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">Order Information</Typography>
                  <Typography>Status: {selectedOrder.status}</Typography>
                  <Typography>Payment: {selectedOrder.payment_method}</Typography>
                  <Typography>Total: R{selectedOrder.total_amount.toFixed(2)}</Typography>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>Items</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>R{item.price.toFixed(2)}</TableCell>
                        <TableCell>R{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOrderDialog(false)}>
            Close
          </Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => {/* Handle print */}}
          >
            Print Invoice
          </Button>
          {selectedOrder?.status === 'pending' && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'packed')}
            >
              Mark as Packed
            </Button>
          )}
          {selectedOrder?.status === 'packed' && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'fulfilled')}
            >
              Mark as Fulfilled
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedVendorDashboard; 