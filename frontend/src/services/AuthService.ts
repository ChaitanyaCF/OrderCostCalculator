import axios from 'axios';
import { API_ENDPOINTS } from '../config';

interface LoginResponse {
  id: number;
  username: string;
  isAdmin: boolean;
  admin?: boolean; // Add admin property as optional
  token: string;
}

interface RegisterResponse {
  message: string;
}

// Use the API URL from config
const API_URL = API_ENDPOINTS.auth;

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('Attempting login with:', { username });
      const response = await axios.post(`${API_URL}/login`, { username, password });
      console.log('Login response:', response.data);
      
      // Normalize the admin property to isAdmin
      const userData = {
        ...response.data,
        isAdmin: response.data.admin || response.data.isAdmin || false
      };
      
      console.log('Normalized user data:', userData);
      
      if (userData.token) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(username: string, password: string, email?: string): Promise<RegisterResponse> {
    try {
      console.log('Attempting registration with:', { username, email });
      const response = await axios.post(`${API_URL}/register`, { username, password, email });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('user');
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        
        // Ensure isAdmin is set correctly in case we have old data in localStorage
        if (userData.admin !== undefined && userData.isAdmin === undefined) {
          userData.isAdmin = userData.admin;
        }
        
        return userData;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  getAuthHeader(): { Authorization: string } | {} {
    const user = this.getCurrentUser();
    if (user && user.token) {
      // Return in the exact format expected by axios headers
      return { Authorization: `Bearer ${user.token}` };
    } else {
      console.warn('No authentication token found');
      return {};
    }
  }
}

// Create an instance and export it
const authServiceInstance = new AuthService();
export default authServiceInstance; 