// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8082';  // Use environment variable with fallback
export const API_ENDPOINTS = {
  factories: API_BASE_URL + '/api/factories',
  auth: API_BASE_URL + '/auth',
  inquiries: API_BASE_URL + '/api/inquiries'
}; 