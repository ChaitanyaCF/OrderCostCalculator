import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config';
import AuthService from './AuthService';

interface User {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  admin?: boolean;  // Add admin property as optional
}

interface UserCreatePayload {
  username: string;
  password: string;
  email?: string;
  isAdmin: boolean;
}

interface ToggleAdminPayload {
  isAdmin: boolean;
}

const API_PATH = API_BASE_URL + '/api/users';

// Updated function to use the AuthService method directly
const getHeaders = () => {
  const authHeader = AuthService.getAuthHeader();
  return {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    }
  };
};

const UserService = {
  getAllUsers: async (): Promise<User[]> => {
    try {
      console.log('Fetching users with headers:', getHeaders());
      const response = await axios.get(API_PATH, getHeaders());
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('Response error:', axiosError);
      console.error('Response error details:', axiosError.response || axiosError.request || axiosError.message);
      throw error;
    }
  },
  
  createUser: async (userData: UserCreatePayload): Promise<User> => {
    const response = await axios.post(API_PATH, userData, getHeaders());
    return response.data;
  },
  
  toggleAdmin: async (userId: number, isAdmin: boolean): Promise<User> => {
    const response = await axios.patch(
      `${API_PATH}/${userId}/toggle-admin`, 
      { isAdmin },
      getHeaders()
    );
    return response.data;
  },
  
  deleteUser: async (userId: number): Promise<void> => {
    await axios.delete(`${API_PATH}/${userId}`, getHeaders());
  }
};

export default UserService; 