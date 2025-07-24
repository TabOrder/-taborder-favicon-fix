import axios from 'axios';

export interface UserFormData {
  name: string;
  email: string;
  role: string;
  // Add other fields as needed
}

export const userService = {
  getUsers: async () => {
    const response = await axios.get('/api/users');
    return response.data;
  },
  createUser: async (data: UserFormData) => {
    const response = await axios.post('/api/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: UserFormData) => {
    const response = await axios.put(`/api/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await axios.delete(`/api/users/${id}`);
    return response.data;
  }
}; 