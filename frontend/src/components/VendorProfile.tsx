import React, { useState } from 'react';
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import type { GridProps } from '@mui/material/Grid';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface VendorData {
  name: string;
  email: string;
  phone: string;
  storeName: string;
  address: string;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

const VendorProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [vendorData, setVendorData] = useState<VendorData>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+27 12 345 6789',
    storeName: 'Doe\'s Store',
    address: '123 Main Street, Johannesburg',
    totalProducts: 45,
    totalOrders: 128,
    totalRevenue: 45678.90,
  });

  const handleEdit = () => {
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/vendor/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(vendorData)
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to save profile');
      // }
      
      setIsEditing(false);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
    // Reset to original data if needed
  };

  const handleInputChange = (field: keyof VendorData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setVendorData({
      ...vendorData,
      [field]: event.target.value,
    });
  };

  const gridItemProps: GridProps = {
    item: true,
    xs: 12,
    md: 4,
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Vendor Profile
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isEditing ? (
                <>
                  <IconButton 
                    onClick={handleCancel} 
                    color="secondary"
                    disabled={isSaving}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={handleSave} 
                    color="primary"
                    disabled={isSaving}
                  >
                    {isSaving ? <CircularProgress size={24} /> : <SaveIcon />}
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={handleEdit} color="primary">
                  <EditIcon />
                </IconButton>
              )}
            </Box>
          </Box>

          {(saveError || saveSuccess) && (
            <Box sx={{ mb: 3 }}>
              {saveError && (
                <Alert severity="error" onClose={() => setSaveError(null)}>
                  {saveError}
                </Alert>
              )}
              {saveSuccess && (
                <Alert severity="success" onClose={() => setSaveSuccess(false)}>
                  Profile saved successfully!
                </Alert>
              )}
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid {...gridItemProps}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar sx={{ width: 120, height: 120, mb: 2 }}>
                  <PersonIcon sx={{ fontSize: 80 }} />
                </Avatar>
                <Typography variant="h6">{vendorData.storeName}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Name"
                    secondary={
                      isEditing ? (
                        <TextField
                          fullWidth
                          value={vendorData.name}
                          onChange={handleInputChange('name')}
                          size="small"
                        />
                      ) : (
                        vendorData.name
                      )
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <StoreIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Store Name"
                    secondary={
                      isEditing ? (
                        <TextField
                          fullWidth
                          value={vendorData.storeName}
                          onChange={handleInputChange('storeName')}
                          size="small"
                        />
                      ) : (
                        vendorData.storeName
                      )
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={
                      isEditing ? (
                        <TextField
                          fullWidth
                          value={vendorData.email}
                          onChange={handleInputChange('email')}
                          size="small"
                        />
                      ) : (
                        vendorData.email
                      )
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone"
                    secondary={
                      isEditing ? (
                        <TextField
                          fullWidth
                          value={vendorData.phone}
                          onChange={handleInputChange('phone')}
                          size="small"
                        />
                      ) : (
                        vendorData.phone
                      )
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <StoreIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Address"
                    secondary={
                      isEditing ? (
                        <TextField
                          fullWidth
                          value={vendorData.address}
                          onChange={handleInputChange('address')}
                          size="small"
                        />
                      ) : (
                        vendorData.address
                      )
                    }
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          <Grid {...gridItemProps}>
            <Card>
              <CardHeader
                avatar={<InventoryIcon color="primary" />}
                title="Total Products"
              />
              <CardContent>
                <Typography variant="h4">{vendorData.totalProducts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid {...gridItemProps}>
            <Card>
              <CardHeader
                avatar={<StoreIcon color="primary" />}
                title="Total Orders"
              />
              <CardContent>
                <Typography variant="h4">{vendorData.totalOrders}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid {...gridItemProps}>
            <Card>
              <CardHeader
                avatar={<MoneyIcon color="primary" />}
                title="Total Revenue"
              />
              <CardContent>
                <Typography variant="h4">
                  R {vendorData.totalRevenue.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default VendorProfile; 