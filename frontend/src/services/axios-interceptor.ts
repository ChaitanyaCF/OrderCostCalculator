import axios from 'axios';
import AuthService from './AuthService';

// Add request interceptor to automatically add auth token to all requests
axios.interceptors.request.use(config => {
  const user = AuthService.getCurrentUser();
  if (user && user.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor to handle authentication errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.log('Authentication error detected, redirecting to login');
      // Clear local storage
      AuthService.logout();
      
      // Optionally redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios; 