// Script to fix admin status
(function() {
  try {
    // Get the current user data
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.error('No user data found in localStorage');
      return;
    }

    // Parse the user data
    const user = JSON.parse(userData);
    console.log('Current user data:', user);
    
    // Check if admin and update if needed
    if (!user.isAdmin) {
      console.log('Updating isAdmin to true...');
      user.isAdmin = true;
      localStorage.setItem('user', JSON.stringify(user));
      console.log('Admin status updated. Refreshing page in 2 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      console.log('User already has admin privileges, but they are not showing up in the UI.');
      console.log('Possible issues:');
      console.log('1. The JWT token might not have proper admin roles.');
      console.log('2. There might be an issue with how admin status is checked in the Dashboard component.');
    }
  } catch (e) {
    console.error('Error updating admin status:', e);
  }
})(); 