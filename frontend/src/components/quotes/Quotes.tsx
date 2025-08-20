import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import Header from '../layout/Header';
import { useAuth } from '../../context/AuthContext';
import AuthService from '../../services/AuthService';
import { API_BASE_URL } from '../../config';

interface Quote {
  id: number;
  quoteNumber: string;
  customer: {
    contactPerson: string;
    companyName: string;
    email: string;
  };
  enquiry: {
    id: number;
    enquiryId: string;
    subject: string;
    fromEmail: string;
  };
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  validityPeriod: string;
}

const Quotes: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get success message from navigation state
  const successMessage = location.state?.message;

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/quotes`, {
          headers: {
            'Authorization': `Bearer ${AuthService.getCurrentUser()?.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load quotes');
        }

        const data = await response.json();
        setQuotes(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load quotes');
        setLoading(false);
      }
    };

    loadQuotes();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'default';
      case 'sent': return 'primary';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Header 
        title="Quotes" 
        showBackButton={true}
        backPath="/email-enquiry-dashboard"
      />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Generated Quotes
          </Typography>

          {quotes.length === 0 ? (
            <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No quotes found.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Quote Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Validity</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {quote.quoteNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{quote.customer.contactPerson}</TableCell>
                      <TableCell>{quote.customer.companyName}</TableCell>
                      <TableCell>
                        {quote.currency} {quote.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={quote.status} 
                          color={getStatusColor(quote.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {quote.validityPeriod}
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Quotes; 