import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  AppBar, 
  Toolbar, 
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserService from '../../services/UserService';

interface User {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  admin?: boolean;
}

const UserManagement: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '', isAdmin: false });
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Load users data
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getAllUsers();
      console.log("Fetched users:", data);
      
      // Make sure the isAdmin property is correctly set for each user
      const processedUsers = data.map(user => ({
        ...user,
        isAdmin: Boolean(user.admin) // Use 'admin' if it exists, otherwise fall back to 'isAdmin'
      }));
      console.log("Processed users:", processedUsers);
      
      setUsers(processedUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication error: Please log out and log back in to refresh your session.');
        } else if (err.response.status === 403) {
          setError('Permission denied: You do not have admin privileges to access this data.');
        } else {
          setError(`Failed to load users. Server returned ${err.response.status}: ${err.response.data.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        setError('Network error: Could not connect to the server. Please check your internet connection.');
      } else {
        setError('Failed to load users. Please try again. Error: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleAdminToggle = async (userId: number, currentStatus: boolean) => {
    try {
      await UserService.toggleAdmin(userId, !currentStatus);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, isAdmin: !currentStatus } : u
        )
      );
      
      setSuccessMessage(`User permissions updated successfully`);
    } catch (err) {
      console.error('Error updating user permissions:', err);
      setError('Failed to update user permissions. Please try again.');
    }
  };
  
  const handleAddUser = async () => {
    try {
      await UserService.createUser(newUser);
      setAddUserDialogOpen(false);
      setSuccessMessage('User added successfully');
      
      // Reset form and refresh users
      setNewUser({ username: '', password: '', email: '', isAdmin: false });
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user. Please check the information and try again.');
    }
  };
  
  const handleDeleteClick = (userToDelete: User) => {
    setUserToDelete(userToDelete);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      await UserService.deleteUser(userToDelete.id);
      setSuccessMessage(`User ${userToDelete.username} deleted successfully`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      // Refresh the users list
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };
  
  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Box className="header-logo">
            <Box 
              component="img" 
              src="/images/cft-logo.png"
              alt="ProCost Logo"
              sx={{ height: '40px' }}
            />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ProCost Enquiry Calculator
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Hello, {user?.username || 'User'}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1" color="primary">
            User Management
          </Typography>
        </Box>
        
        <Snackbar 
          open={!!successMessage} 
          autoHideDuration={6000} 
          onClose={() => setSuccessMessage(null)}
        >
          <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Users
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setAddUserDialogOpen(true)}
            >
              Add New User
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Admin Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell>{userItem.id}</TableCell>
                      <TableCell>{userItem.username}</TableCell>
                      <TableCell>{userItem.email || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={userItem.isAdmin ? "Admin" : "Regular User"} 
                          color={userItem.isAdmin ? "primary" : "default"}
                          size="small"
                          sx={{ mr: 2 }}
                        />
                        <Switch
                          checked={userItem.isAdmin}
                          onChange={() => handleAdminToggle(userItem.id, userItem.isAdmin)}
                          color="primary"
                          disabled={user?.id === userItem.id}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {user?.id === userItem.id ? (
                          <Button
                            variant="outlined"
                            size="small"
                            disabled
                            sx={{ minWidth: '100px' }}
                          >
                            Cannot Delete
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteClick(userItem)}
                            sx={{ minWidth: '100px' }}
                          >
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
      
      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the details for the new user below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            type="text"
            fullWidth
            required
            variant="outlined"
            value={newUser.username}
            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            required
            variant="outlined"
            value={newUser.password}
            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            sx={{ mb: 2 }}
            helperText="Email is optional - leave blank if not needed"
          />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>Admin Access</Typography>
            <Switch
              checked={newUser.isAdmin}
              onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
              color="primary"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained" 
            color="primary"
            disabled={!newUser.username || !newUser.password}
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{userToDelete?.username}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 