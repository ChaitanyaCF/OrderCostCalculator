/**
 * Custom CSV loader utility
 * This replaces the webpack file-loader configuration we previously had
 */

export const loadCsvFile = async (filePath) => {
  try {
    const response = await fetch(filePath);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error loading CSV file:', error);
    return null;
  }
}; 