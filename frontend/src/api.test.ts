import axios from 'axios';

// Test API connectivity with the deployed Render backend
describe('API Integration Tests', () => {
  // Base URL for the deployed application
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Test basic API connectivity
  test('should connect to health endpoint', async () => {
    try {
      const response = await axios.get(`${baseURL}/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('healthy');
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  });

  // Test vendor products endpoint
  test('should fetch vendor products', async () => {
    try {
      const response = await axios.get(`${baseURL}/api/vendor/products`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success');
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    } catch (error) {
      console.error('Vendor products fetch failed:', error);
      throw error;
    }
  });

  // Test orders endpoint
  test('should fetch orders', async () => {
    try {
      const response = await axios.get(`${baseURL}/api/orders`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success');
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    } catch (error) {
      console.error('Orders fetch failed:', error);
      throw error;
    }
  });

  // Test users endpoint
  test('should fetch users', async () => {
    try {
      const response = await axios.get(`${baseURL}/api/users`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success');
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    } catch (error) {
      console.error('Users fetch failed:', error);
      throw error;
    }
  });

  // Test CORS headers
  test('should have proper CORS headers', async () => {
    try {
      const response = await axios.get(`${baseURL}/health`);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    } catch (error) {
      console.error('CORS test failed:', error);
      throw error;
    }
  });
});