import React from 'react';
import CFTLogo from './components/layout/CFTLogo';

function App() {
  // Color scheme based on CFT branding
  const colors = {
    primary: '#e43131', // Red from the fish logo
    secondary: '#333333', // Dark gray for headings
    text: '#333333', // Dark gray for text
  };

  const styles = {
    container: {
      padding: '20px',
      textAlign: 'center' as const,
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginBottom: '30px',
      marginTop: '10px',
    },
    logo: {
      marginBottom: '10px',
    },
    title: {
      color: colors.secondary,
      fontSize: '28px',
      marginTop: '10px',
      marginBottom: '5px',
    },
    subtitle: {
      color: colors.text,
      fontSize: '16px',
      marginBottom: '20px',
    },
    content: {
      backgroundColor: '#f9f9f9',
      padding: '20px',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    button: {
      backgroundColor: colors.primary,
      color: 'white',
      border: 'none',
      padding: '10px 20px',
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
        <CFTLogo width="120px" style={styles.logo} />
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