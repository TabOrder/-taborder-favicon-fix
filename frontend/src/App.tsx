import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import VendorLogin from './components/VendorLogin.tsx';
import VendorRegistration from './components/VendorRegistration.tsx';
import VendorDashboard from './components/VendorDashboard.tsx';
import EnhancedVendorDashboard from './components/EnhancedVendorDashboard.tsx';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

interface VendorData {
  access_token: string;
  vendor_id: string;
  email: string;
  name: string;
  role: string;
}

const App: React.FC = () => {
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    // Check for existing vendor session
    const token = localStorage.getItem('vendorToken');
    const storedVendorData = localStorage.getItem('vendorData');
    
    if (token && storedVendorData) {
      try {
        const parsedData = JSON.parse(storedVendorData);
        setVendorData(parsedData);
      } catch (err) {
        // Clear invalid data
        localStorage.removeItem('vendorToken');
        localStorage.removeItem('vendorData');
      }
    }
  }, []);

  const handleLoginSuccess = (data: VendorData) => {
    setVendorData(data);
    setShowRegistration(false);
  };

  const handleRegistrationSuccess = (data: VendorData) => {
    setVendorData(data);
    setShowRegistration(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorData');
    setVendorData(null);
  };

  const handleBackToLogin = () => {
    setShowRegistration(false);
  };

  const handleShowRegistration = () => {
    setShowRegistration(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>
        {vendorData ? (
          <EnhancedVendorDashboard 
            vendorData={vendorData}
            onLogout={handleLogout}
            apiBaseUrl={API_BASE_URL}
          />
        ) : showRegistration ? (
          <VendorRegistration
            onRegistrationSuccess={handleRegistrationSuccess}
            onBackToLogin={handleBackToLogin}
          />
        ) : (
          <VendorLogin
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </Box>
    </ThemeProvider>
  );
};

export default App;
