// Check user data in localStorage
(function() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      console.log('User data from localStorage:', user);
      console.log('isAdmin status:', user.isAdmin);
    } else {
      console.log('No user data found in localStorage');
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
  }
})(); 