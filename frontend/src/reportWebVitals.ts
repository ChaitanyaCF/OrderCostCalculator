const reportWebVitals = (onPerfEntry?: any) => {
  // This is a simplified version that doesn't actually report metrics
  // but avoids build issues with web-vitals
  if (onPerfEntry && onPerfEntry instanceof Function) {
    console.log('Web vitals reporting is disabled in this build');
  }
};

export default reportWebVitals;