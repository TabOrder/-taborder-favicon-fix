import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalShipping as DeliveryIcon,
  Payment as PaymentIcon,
  People as UsersIcon,
  Restaurant as ComboIcon,
  Refresh as RefreshIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';

interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  waybill_number?: string;
  delivery_status?: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  is_combo: boolean;
  combo_id?: string;
}

interface ComboDeal {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  is_active: boolean;
  items: ComboItem[];
  created_at: string;
  total_orders: number;
  total_revenue: number;
}

interface ComboItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  registered_at: string;
  last_order_at?: string;
}

interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  active_combos: number;
  total_users: number;
  pending_orders: number;
  delivered_orders: number;
  failed_payments: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [combos, setCombos] = useState<ComboDeal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Combo Management
  const [comboDialog, setComboDialog] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboDeal | null>(null);
  const [comboForm, setComboForm] = useState({
    name: '',
    description: '',
    price: 0,
    original_price: 0,
    is_active: true,
    items: [] as ComboItem[]
  });

  // Order Details
  const [orderDialog, setOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // User Management
  const [userDialog, setUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, combosRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/orders/stats`),
        fetch(`${API_BASE}/api/orders?per_page=10`),
        fetch(`${API_BASE}/api/combos`),
        fetch(`${API_BASE}/api/users`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('Stats data:', statsData);
        setStats(statsData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        console.log('Orders data:', ordersData);
        setOrders(ordersData.orders || []);
      }

      if (combosRes.ok) {
        const combosData = await combosRes.json();
        console.log('Combos data:', combosData);
        setCombos(combosData.combos || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        console.log('Users data:', usersData);
        setUsers(usersData.users || []);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComboSave = async () => {
    try {
      const url = editingCombo 
        ? `${API_BASE}/api/combos/${editingCombo.id}`
        : `${API_BASE}/api/combos`;
      
      const method = editingCombo ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comboForm)
      });

      if (response.ok) {
        setComboDialog(false);
        setEditingCombo(null);
        setComboForm({ name: '', description: '', price: 0, original_price: 0, is_active: true, items: [] });
        fetchDashboardData();
      }
    } catch (err) {
      setError('Failed to save combo');
    }
  };

  const handleComboToggle = async (comboId: string, isActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/api/combos/${comboId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      setError('Failed to toggle combo status');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'success';
      case 'in_transit': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header with Refresh */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          TabOrder Admin Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Orders
                </Typography>
                <Typography variant="h4">
                  {stats.total_orders}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stats.pending_orders} pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  R{stats.total_revenue.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg: R{stats.average_order_value.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Combos
                </Typography>
                <Typography variant="h4">
                  {stats.active_combos}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {combos.length} total combos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Registered Users
                </Typography>
                <Typography variant="h4">
                  {stats.total_users}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {users.length} total users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Recent Orders" icon={<PaymentIcon />} />
          <Tab label="Combo Management" icon={<ComboIcon />} />
          <Tab label="User Management" icon={<UsersIcon />} />
          <Tab label="Delivery Tracking" icon={<DeliveryIcon />} />
        </Tabs>
      </Box>

      {/* Recent Orders Tab */}
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Delivery Status</TableCell>
                <TableCell>Waybill</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.order_id}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.customer_name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {order.customer_phone}
                    </Typography>
                  </TableCell>
                  <TableCell>R{order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>{order.payment_method}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.payment_status}
                      color={getPaymentStatusColor(order.payment_status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.delivery_status || 'Pending'}
                      color={getOrderStatusColor(order.delivery_status || 'pending') as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {order.waybill_number ? (
                      <Typography variant="body2" color="primary">
                        {order.waybill_number}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedOrder(order);
                          setOrderDialog(true);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Combo Management Tab */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Combo Deals Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingCombo(null);
                setComboForm({ name: '', description: '', price: 0, original_price: 0, is_active: true, items: [] });
                setComboDialog(true);
              }}
            >
              Add New Combo
            </Button>
          </Box>

          <Grid container spacing={2}>
            {combos.map((combo) => (
              <Grid item xs={12} md={6} lg={4} key={combo.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" gutterBottom>
                        {combo.name}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={combo.is_active}
                            onChange={(e) => handleComboToggle(combo.id, e.target.checked)}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {combo.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" color="primary">
                        R{combo.price.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ textDecoration: 'line-through' }}>
                        R{combo.original_price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {combo.items.length} items • {combo.total_orders} orders • R{combo.total_revenue.toFixed(2)} revenue
                    </Typography>
                    <Box mt={2}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setEditingCombo(combo);
                          setComboForm({
                            name: combo.name,
                            description: combo.description,
                            price: combo.price,
                            original_price: combo.original_price,
                            is_active: combo.is_active,
                            items: combo.items
                          });
                          setComboDialog(true);
                        }}
                      >
                        Edit
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* User Management Tab */}
      {activeTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Phone</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Total Orders</TableCell>
                <TableCell>Total Spent</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell>Last Order</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.total_orders}</TableCell>
                  <TableCell>R{user.total_spent.toFixed(2)}</TableCell>
                  <TableCell>{new Date(user.registered_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.last_order_at ? new Date(user.last_order_at).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserDialog(true);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delivery Tracking Tab */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Delivery Tracking (Aramex Integration)
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Waybill Number</TableCell>
                  <TableCell>Delivery Status</TableCell>
                  <TableCell>Estimated Delivery</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.filter(order => order.waybill_number).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_id}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        {order.waybill_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.delivery_status || 'In Transit'}
                        color={getOrderStatusColor(order.delivery_status || 'in_transit') as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>Today</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        Track Package
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Combo Dialog */}
      <Dialog open={comboDialog} onClose={() => setComboDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCombo ? 'Edit Combo Deal' : 'Add New Combo Deal'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Combo Name"
                value={comboForm.name}
                onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={comboForm.description}
                onChange={(e) => setComboForm({ ...comboForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Combo Price"
                value={comboForm.price}
                onChange={(e) => setComboForm({ ...comboForm, price: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Original Price"
                value={comboForm.original_price}
                onChange={(e) => setComboForm({ ...comboForm, original_price: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={comboForm.is_active}
                    onChange={(e) => setComboForm({ ...comboForm, is_active: e.target.checked })}
                  />
                }
                label="Active (Available in USSD menu)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComboDialog(false)}>Cancel</Button>
          <Button onClick={handleComboSave} variant="contained">
            {editingCombo ? 'Update' : 'Create'} Combo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={orderDialog} onClose={() => setOrderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Order #{selectedOrder.order_id}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Customer</Typography>
                  <Typography variant="body1">{selectedOrder.customer_name}</Typography>
                  <Typography variant="body2">{selectedOrder.customer_phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Payment</Typography>
                  <Typography variant="body1">{selectedOrder.payment_method}</Typography>
                  <Chip
                    label={selectedOrder.payment_status}
                    color={getPaymentStatusColor(selectedOrder.payment_status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Order Items</Typography>
                  <List dense>
                    {selectedOrder.items.map((item) => (
                      <ListItem key={item.id}>
                        <ListItemText
                          primary={item.name}
                          secondary={`Qty: ${item.quantity} • R${item.price.toFixed(2)} each`}
                        />
                        <ListItemSecondaryAction>
                          <Typography variant="body1">
                            R{(item.quantity * item.price).toFixed(2)}
                          </Typography>
                          {item.is_combo && (
                            <Chip label="Combo" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" align="right">
                    Total: R{selectedOrder.total_amount.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedUser.name}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Phone</Typography>
                  <Typography variant="body1">{selectedUser.phone}</Typography>
                </Grid>
                {selectedUser.email && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Email</Typography>
                    <Typography variant="body1">{selectedUser.email}</Typography>
                  </Grid>
                )}
                {selectedUser.address && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Address</Typography>
                    <Typography variant="body1">{selectedUser.address}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Total Orders</Typography>
                  <Typography variant="h6">{selectedUser.total_orders}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Total Spent</Typography>
                  <Typography variant="h6">R{selectedUser.total_spent.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Registered</Typography>
                  <Typography variant="body1">
                    {new Date(selectedUser.registered_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 