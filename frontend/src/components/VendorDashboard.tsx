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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

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

interface CommissionBreakdown {
  basket_value: number;
  platform_fee_pct: number;
  platform_fee_amount: number;
  spaza_commission_pct: number;
  spaza_commission_amount: number;
  handling_fee: number;
  vendor_net: number;
  vendor_margin_pct: number;
  total_mobile_spaza_earnings: number;
  margin_alert?: string;
}

interface VendorAnalytics {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  total_value: number;
  period: string;
}

const VendorDashboard: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stock management states
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
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

  // Commission calculation states
  const [commissionBreakdown, setCommissionBreakdown] = useState<CommissionBreakdown | null>(null);
  const [basketValue, setBasketValue] = useState('');

  useEffect(() => {
    loadStockItems();
    loadAnalytics();
  }, []);

  const loadStockItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendor/products');
      if (response.ok) {
        const data = await response.json();
        setStockItems(data.data || []);
      } else {
        setError('Failed to load stock items');
      }
    } catch (err) {
      setError('Error loading stock items');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/vendor/products/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
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

      const url = editingStock ? `/api/vendor/products/${editingStock.id}` : '/api/vendor/products';
      const method = editingStock ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
        const response = await fetch(`/api/vendor/products/${id}`, {
          method: 'DELETE',
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

  const calculateCommission = async () => {
    if (!basketValue || parseFloat(basketValue) <= 0) return;

    try {
      const response = await fetch('/api/mobile-spaza/ai-margin/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_value: parseFloat(basketValue) }),
      });

      if (response.ok) {
        const data = await response.json();
        setCommissionBreakdown(data);
      } else {
        setError('Failed to calculate commission');
      }
    } catch (err) {
      setError('Error calculating commission');
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🏪 Vendor Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Analytics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <InventoryIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{analytics?.total_products || 0}</Typography>
                    <Typography color="textSecondary">Total Products</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <StoreIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{analytics?.active_products || 0}</Typography>
                    <Typography color="textSecondary">Active Products</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <WarningIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{analytics?.low_stock_products || 0}</Typography>
                    <Typography color="textSecondary">Low Stock Items</Typography>
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
                    <Typography variant="h4">R{(analytics?.total_value || 0).toFixed(2)}</Typography>
                    <Typography color="textSecondary">Total Value</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Commission Calculator */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            💰 Commission Calculator
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Calculate commission breakdown: Platform gets 8% of wholesaler's commission from manufacturer
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Basket Value (R)"
                type="number"
                value={basketValue}
                onChange={(e) => setBasketValue(e.target.value)}
                placeholder="Enter basket value"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                onClick={calculateCommission}
                disabled={!basketValue || parseFloat(basketValue) <= 0}
                fullWidth
              >
                Calculate
              </Button>
            </Grid>
          </Grid>

          {commissionBreakdown && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Commission Breakdown
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Basket Value"
                        secondary={`R${commissionBreakdown.basket_value.toFixed(2)}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Platform Fee (8%)"
                        secondary={`R${commissionBreakdown.platform_fee_amount.toFixed(2)}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Mobile Spaza Commission"
                        secondary={`R${commissionBreakdown.spaza_commission_amount.toFixed(2)} (${(commissionBreakdown.spaza_commission_pct * 100).toFixed(1)}%)`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Handling Fee"
                        secondary={`R${commissionBreakdown.handling_fee.toFixed(2)}`}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Vendor Net"
                        secondary={`R${commissionBreakdown.vendor_net.toFixed(2)}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Vendor Margin"
                        secondary={`${(commissionBreakdown.vendor_margin_pct * 100).toFixed(1)}%`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Mobile Spaza Earnings"
                        secondary={`R${commissionBreakdown.total_mobile_spaza_earnings.toFixed(2)}`}
                      />
                    </ListItem>
                    {commissionBreakdown.margin_alert && (
                      <ListItem>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Margin Alert"
                          secondary={commissionBreakdown.margin_alert}
                          sx={{ color: 'warning.main' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Stock Management */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6">
              📦 Stock Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingStock(null);
                resetStockForm();
                setOpenStockDialog(true);
              }}
            >
              Add Stock Item
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Price (R)</TableCell>
                  <TableCell>Wholesale (R)</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Margin (%)</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell>R{item.price.toFixed(2)}</TableCell>
                    <TableCell>R{item.wholesale_price.toFixed(2)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStockStatusText(item.quantity, item.min_stock_alert)}
                        color={getStockStatusColor(item.quantity, item.min_stock_alert) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.margin_percentage?.toFixed(1) || 'N/A'}%</TableCell>
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
        </Paper>

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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Suggested Retail Price (R)"
                  type="number"
                  value={stockForm.suggested_retail_price}
                  onChange={(e) => setStockForm({ ...stockForm, suggested_retail_price: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Platform Discount (%)"
                  type="number"
                  value={stockForm.platform_discount}
                  onChange={(e) => setStockForm({ ...stockForm, platform_discount: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Margin Percentage (%)"
                  type="number"
                  value={stockForm.margin_percentage}
                  onChange={(e) => setStockForm({ ...stockForm, margin_percentage: e.target.value })}
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
      </Box>
    </Container>
  );
};

export default VendorDashboard; 