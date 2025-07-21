import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  TextField,
  Alert
} from '@mui/material';
import * as csvLoader from '../../utils/csvLoader';

const TestUploader: React.FC = () => {
  const [csvText, setCsvText] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log("File selected:", file.name, file.type, file.size);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          setError('Failed to read file content');
          return;
        }
        
        setCsvText(content);
        console.log("CSV content length:", content.length);
        console.log("CSV content preview:", content.substring(0, 200));
        
        // Try to parse the CSV
        const data = csvLoader.parseCSV(content);
        console.log("Parsed data:", data);
        setParsedData(data);
        
        if (data.length === 0) {
          setError('No data rows found in CSV');
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setError(`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      setError('Failed to read file');
    };
    
    reader.readAsText(file);
  };

  const handleParseText = () => {
    try {
      const data = csvLoader.parseCSV(csvText);
      console.log("Parsed data from text:", data);
      setParsedData(data);
      
      if (data.length === 0) {
        setError('No data rows found in CSV');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error parsing CSV text:', err);
      setError(`Failed to parse CSV text: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>CSV Upload Test</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Upload CSV File</Typography>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        <Button 
          variant="contained" 
          onClick={() => fileInputRef.current?.click()}
          sx={{ mb: 2 }}
        >
          Select CSV File
        </Button>
        
        <Typography variant="body2" color="text.secondary">
          Or paste CSV content below:
        </Typography>
        
        <TextField
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="Paste CSV content here..."
        />
        
        <Button 
          variant="contained" 
          onClick={handleParseText}
          disabled={!csvText.trim()}
        >
          Parse CSV Text
        </Button>
      </Paper>
      
      {parsedData.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Parsed Data:</Typography>
          
          <Typography variant="body2" gutterBottom>
            Found {parsedData.length} rows with these columns:
            {parsedData.length > 0 && (
              <Box component="span" sx={{ fontWeight: 'bold', ml: 1 }}>
                {Object.keys(parsedData[0]).join(', ')}
              </Box>
            )}
          </Typography>
          
          <Box component="pre" sx={{ 
            bgcolor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1, 
            overflow: 'auto',
            maxHeight: '300px',
            fontSize: '0.875rem'
          }}>
            {JSON.stringify(parsedData, null, 2)}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TestUploader; 