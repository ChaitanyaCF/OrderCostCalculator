// Debug script to check authentication token

console.log('Starting authentication debug script');

// Get token from localStorage
const getAuthInfo = () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.error('No user data found in localStorage');
      return null;
    }
    
    const user = JSON.parse(userData);
    console.log('User data found:', {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      tokenExists: !!user.token,
      tokenLength: user.token ? user.token.length : 0,
      tokenStart: user.token ? user.token.substring(0, 10) + '...' : 'none'
    });
    
    return {
      token: user.token,
      headers: { 'Authorization': `Bearer ${user.token}` }
    };
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
};

// Test API call function
const testApiCall = async () => {
  const auth = getAuthInfo();
  if (!auth) return;
  
  try {
    // Import fetch if needed
    const fetch = window.fetch;
    
    // Test endpoint with token
    console.log('Making test API call with auth headers:', auth.headers);
    const response = await fetch('http://localhost:8082/api/users', {
      method: 'GET',
      headers: auth.headers
    });
    
    console.log('API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API response data:', data);
    } else {
      const errorText = await response.text();
      console.error('API error response:', errorText);
    }
  } catch (e) {
    console.error('Error making API call:', e);
  }
};

// Run the test
getAuthInfo();
testApiCall();

// Add this to developer console to run:
// const script = document.createElement('script'); script.src = 'debug-auth.js'; document.body.appendChild(script); 