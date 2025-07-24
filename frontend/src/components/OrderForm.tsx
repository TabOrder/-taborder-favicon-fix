import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  Autocomplete,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { OrderFormData } from '../types/order';
import { logger } from '../utils/logger';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  vendor_id: number;
  vendor_name: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface SpazaShop {
  id: number;
  name: string;
  address: string;
}

interface FormItem {
  product_id: number;
  quantity: number;
  notes?: string;
}

interface OrderFormProps {
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
  initialData?: OrderFormData;
  products: Product[];
  customers: Customer[];
  spazaShops: SpazaShop[];
}

const OrderForm: React.FC<OrderFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  products,
  customers,
  spazaShops,
}) => {
  const [formData, setFormData] = useState<OrderFormData>({
    spaza_id: initialData?.spaza_id || 0,
    customer_id: initialData?.customer_id || 0,
    items: initialData?.items || [{ product_id: 0, quantity: 1, notes: '' }],
    notes: initialData?.notes || ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryErrors, setInventoryErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.spaza_id) {
      newErrors.spaza_id = 'Spaza shop is required';
    }
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.product_id) {
        newErrors[`items.${index}.product_id`] = 'Product is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateInventory = () => {
    const newInventoryErrors: { [key: string]: string } = {};

    formData.items.forEach((item, index) => {
      const product = products.find(p => p.id === item.product_id);
      if (product && item.quantity > product.stock) {
        newInventoryErrors[`items.${index}.quantity`] = `Only ${product.stock} items available in stock`;
      }
    });

    setInventoryErrors(newInventoryErrors);
    return Object.keys(newInventoryErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !validateInventory()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      logger.error('Error submitting order', { error }, 'OrderForm');
      setErrors({ submit: 'Failed to submit order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: number | string) => {
    try {
      const newItems = [...formData.items];
      if (field === 'quantity') {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        newItems[index] = { ...newItems[index], [field]: numValue };
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
      setFormData({ ...formData, items: newItems });
    } catch (error) {
      logger.error('Error updating item', { error, index, field, value }, 'OrderForm');
    }
  };

  const addItem = () => {
    try {
      setFormData({
        ...formData,
        items: [...formData.items, { product_id: 0, quantity: 1 }],
      });
    } catch (error) {
      logger.error('Error adding item', { error }, 'OrderForm');
    }
  };

  const removeItem = (index: number) => {
    try {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    } catch (error) {
      logger.error('Error removing item', { error, index }, 'OrderForm');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {errors.submit && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.submit}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Autocomplete<SpazaShop>
            options={spazaShops}
            getOptionLabel={(option) => option.name}
            value={spazaShops.find(s => s.id === formData.spaza_id) ?? null}
            onChange={(_, newValue) => {
              setFormData({ ...formData, spaza_id: newValue?.id ?? 0 });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Spaza Shop"
                error={!!errors.spaza_id}
                helperText={errors.spaza_id}
                required
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete<Customer>
            options={customers}
            getOptionLabel={(option) => option.name}
            value={customers.find(c => c.id === formData.customer_id) ?? null}
            onChange={(_, newValue) => {
              setFormData({ ...formData, customer_id: newValue?.id ?? 0 });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer"
                error={!!errors.customer_id}
                helperText={errors.customer_id}
                required
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Order Items
          </Typography>
          {formData.items.map((item, index) => (
            <Box key={`order-item-${index}-${item.product_id}`} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Autocomplete<Product>
                    options={products}
                    getOptionLabel={(option) => option.name}
                    value={products.find(p => p.id === item.product_id) ?? null}
                    onChange={(_, newValue) => {
                      handleItemChange(index, 'product_id', newValue?.id ?? 0);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Product"
                        error={!!errors[`items.${index}.product_id`]}
                        helperText={errors[`items.${index}.product_id`]}
                        required
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    type="number"
                    label="Quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    error={!!errors[`items.${index}.quantity`] || !!inventoryErrors[`items.${index}.quantity`]}
                    helperText={errors[`items.${index}.quantity`] || inventoryErrors[`items.${index}.quantity`]}
                    required
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <IconButton
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={addItem}
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Add Item
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={onCancel}
              variant="outlined"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Order'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderForm; 