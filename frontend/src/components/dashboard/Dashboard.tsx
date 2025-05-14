import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Box,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InquiryService from '../../services/InquiryService';
import { Inquiry } from '../../types/types';
import { useAuth } from '../../context/AuthContext';

const Dashboard: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const data = await InquiryService.getUserInquiries();
        setInquiries(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch inquiries');
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleNewInquiry = () => {
    navigate('/inquiry');
  };

  if (loading) {
    return <Typography>Loading your inquiries...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <div className="dashboard-container">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Your Inquiries
          </Typography>
          <Button variant="contained" onClick={handleNewInquiry}>
            New Inquiry
          </Button>
        </Box>
        
        {inquiries.length === 0 ? (
          <Typography>You haven't created any inquiries yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Trim Type</TableCell>
                  <TableCell>RM Spec</TableCell>
                  <TableCell>Total Charges</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
                    <TableCell>{inquiry.product}</TableCell>
                    <TableCell>{inquiry.trimType}</TableCell>
                    <TableCell>{inquiry.rmSpec}</TableCell>
                    <TableCell>${inquiry.totalCharges.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </div>
  );
};

export default Dashboard;