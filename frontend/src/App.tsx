import React from 'react';

function App() {
  // Color scheme based on the CFT logo
  const colors = {
    primary: '#e43131', // Red from logo
    secondary: '#000000', // Black from logo text
    background: '#ffffff', // White background
    text: '#333333', // Dark gray for text
  };

  const styles = {
    container: {
      padding: '30px',
      textAlign: 'center' as const,
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginBottom: '40px',
    },
    logo: {
      width: '200px',
      height: 'auto',
      marginBottom: '20px',
      objectFit: 'contain' as const,
    },
    title: {
      color: colors.secondary,
      fontSize: '28px',
      marginTop: '10px',
    },
    subtitle: {
      color: colors.primary,
      fontSize: '18px',
      fontWeight: 'bold' as const,
      marginTop: '5px',
    },
    content: {
      backgroundColor: '#f8f8f8',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${colors.primary}`,
    },
    button: {
      backgroundColor: colors.primary,
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
      marginTop: '20px',
      fontWeight: 'bold' as const,
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <img src="/cft-logo.png" alt="CFT Logo" style={styles.logo} />
        <h1 style={styles.title}>ProCost Order Inquiry System</h1>
        <p style={styles.subtitle}>Calculate costs based on product and processing specifications</p>
      </header>
      
      <div style={styles.content}>
        <h2>Welcome to the Order Inquiry System</h2>
        <p>If you can see this message, the application is working correctly.</p>
        <p>The system allows you to calculate costs for processing based on your specific requirements.</p>
        <button style={styles.button}>Get Started</button>
      </div>
    </div>
  );
}

export default App;