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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  PriceCheck as PriceCheckIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import comboService, { Combo, ComboItem, ComboStatistics } from '../services/comboService.ts';

interface ComboManagementProps {
  vendorData?: {
    access_token: string;
    vendor_id: string;
    email: string;
    name: string;
  };
}

const ComboManagement: React.FC<ComboManagementProps> = ({ vendorData }) => {
  // State management
  const [combos, setCombos] = useState<Combo[]>([]);
  const [statistics, setStatistics] = useState<ComboStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI States
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showInactive, setShowInactive] = useState(false);
  
  // Dialog states
  const [openComboDialog, setOpenComboDialog] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [comboForm, setComboForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    items: [] as ComboItem[],
    keywords: [] as string[],
    is_active: true,
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [combosResult, statsResult] = await Promise.all([
        comboService.getAllCombos(),
        comboService.getComboStatistics(),
      ]);
      
      setCombos(combosResult.combos);
      setStatistics(statsResult);
    } catch (err) {
      setError('Failed to load combo data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCombo = () => {
    setEditingCombo(null);
    setComboForm({
      name: '',
      description: '',
      price: '',
      category: '',
      items: [],
      keywords: [],
      is_active: true,
    });
    setOpenComboDialog(true);
  };

  const handleEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    setComboForm({
      name: combo.name,
      description: combo.description,
      price: combo.price.toString(),
      category: combo.category,
      items: combo.items,
      keywords: combo.keywords,
      is_active: combo.is_active,
    });
    setOpenComboDialog(true);
  };

  const handleSaveCombo = async () => {
    try {
      if (!vendorData?.access_token) {
        setError('Authentication required');
        return;
      }

      const comboData = {
        name: comboForm.name,
        description: comboForm.description,
        price: parseFloat(comboForm.price),
        category: comboForm.category,
        items: comboForm.items,
        keywords: comboForm.keywords,
        is_active: comboForm.is_active,
      };

      let result: Combo | null = null;
      
      if (editingCombo) {
        result = await comboService.updateCombo(editingCombo.id, comboData, vendorData.access_token);
      } else {
        result = await comboService.addCombo(comboData, vendorData.access_token);
      }

      if (result) {
        setOpenComboDialog(false);
        loadData(); // Refresh data
        setError(null);
      } else {
        setError('Failed to save combo');
      }
    } catch (err) {
      setError('Error saving combo');
      console.error('Error saving combo:', err);
    }
  };

  const handleDeleteCombo = async (combo: Combo) => {
    if (!vendorData?.access_token) {
      setError('Authentication required');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${combo.name}"?`)) {
      try {
        const success = await comboService.deleteCombo(combo.id, vendorData.access_token);
        if (success) {
          loadData(); // Refresh data
          setError(null);
        } else {
          setError('Failed to delete combo');
        }
      } catch (err) {
        setError('Error deleting combo');
        console.error('Error deleting combo:', err);
      }
    }
  };

  const handleToggleStatus = async (combo: Combo) => {
    if (!vendorData?.access_token) {
      setError('Authentication required');
      return;
    }

    try {
      const result = await comboService.toggleComboStatus(combo.id, vendorData.access_token);
      if (result) {
        loadData(); // Refresh data
        setError(null);
      } else {
        setError('Failed to toggle combo status');
      }
    } catch (err) {
      setError('Error toggling combo status');
      console.error('Error toggling combo status:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    try {
      setLoading(true);
      const results = await comboService.fuzzySearch(searchTerm);
      setCombos(results);
    } catch (err) {
      setError('Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter combos based on current filters
  const filteredCombos = combos.filter(combo => {
    const matchesCategory = categoryFilter === 'all' || combo.category === categoryFilter;
    const matchesPrice = combo.price >= priceRange[0] && combo.price <= priceRange[1];
    const matchesStatus = showInactive || combo.is_active;
    
    return matchesCategory && matchesPrice && matchesStatus;
  });

  const categories = statistics?.categories || [];

  const renderComboCard = (combo: Combo) => {
    const savings = comboService.calculateSavings(combo);
    const formattedCombo = comboService.formatComboForDisplay(combo);

    return (
      <Card key={combo.id} sx={{ mb: 2 }}>
        <CardHeader
          action={
            <Box>
              <Tooltip title={combo.is_active ? 'Deactivate' : 'Activate'}>
                <IconButton onClick={() => handleToggleStatus(combo)}>
                  {combo.is_active ? <VisibilityIcon color="success" /> : <VisibilityOffIcon color="disabled" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton onClick={() => handleEditCombo(combo)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton onClick={() => handleDeleteCombo(combo)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">{formattedCombo.name}</Typography>
              <Chip 
                label={formattedCombo.category} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            </Box>
          }
          subheader={
            <Box>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {formattedCombo.price}
              </Typography>
              {savings.savings > 0 && (
                <Typography variant="body2" color="success.main">
                  {formattedCombo.savings}
                </Typography>
              )}
            </Box>
          }
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formattedCombo.description}
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">
                Items ({combo.items.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {combo.items.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InventoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.quantity}x - R${item.price.toFixed(2)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          {combo.keywords.length > 0 && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Keywords:
              </Typography>
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {combo.keywords.map((keyword, index) => (
                  <Chip key={index} label={keyword} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderStatistics = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <InventoryIcon color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{statistics?.total_combos || 0}</Typography>
                <Typography color="textSecondary">Total Combos</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <CheckCircleIcon color="success" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{statistics?.active_combos || 0}</Typography>
                <Typography color="textSecondary">Active Combos</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <CategoryIcon color="info" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{statistics?.category_count || 0}</Typography>
                <Typography color="textSecondary">Categories</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <PriceCheckIcon color="warning" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">R{(statistics?.price_stats.average || 0).toFixed(0)}</Typography>
                <Typography color="textSecondary">Avg Price</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFilters = () => (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search combos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                <IconButton onClick={handleSearch}>
                  <SearchIcon />
                </IconButton>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MuiMenuItem value="all">All Categories</MuiMenuItem>
              {categories.map((category) => (
                <MuiMenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MuiMenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Min Price"
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Max Price"
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value) || 1000])}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControlLabel
            control={
              <Switch
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
            }
            label="Show Inactive"
          />
        </Grid>
      </Grid>
    </Paper>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          🍽️ Combo Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage combo deals and special offers dynamically
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      {statistics && renderStatistics()}

      {/* Filters */}
      {renderFilters()}

      {/* Action Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">
          Combos ({filteredCombos.length})
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCombo}
          >
            Add New Combo
          </Button>
        </Box>
      </Box>

      {/* Combo List */}
      <Grid container spacing={3}>
        {filteredCombos.map((combo) => (
          <Grid item xs={12} md={6} lg={4} key={combo.id}>
            {renderComboCard(combo)}
          </Grid>
        ))}
      </Grid>

      {filteredCombos.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No combos found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or add a new combo
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Combo Dialog */}
      <Dialog open={openComboDialog} onClose={() => setOpenComboDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCombo ? 'Edit Combo' : 'Add New Combo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Combo Name"
                value={comboForm.name}
                onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={comboForm.category}
                onChange={(e) => setComboForm({ ...comboForm, category: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={comboForm.description}
                onChange={(e) => setComboForm({ ...comboForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price (R)"
                type="number"
                value={comboForm.price}
                onChange={(e) => setComboForm({ ...comboForm, price: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={comboForm.is_active}
                    onChange={(e) => setComboForm({ ...comboForm, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={comboForm.keywords}
                onChange={(_, newValue) => setComboForm({ ...comboForm, keywords: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Keywords"
                    placeholder="Add keywords..."
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenComboDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveCombo} variant="contained" startIcon={<SaveIcon />}>
            {editingCombo ? 'Update' : 'Add'} Combo
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ComboManagement; 