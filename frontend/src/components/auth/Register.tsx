import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  TextField, 
  Button, 
  Box, 
  Alert,
  InputAdornment,
  IconButton,
  Grid,
  CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    setSuccess(false);
    
    try {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
        setIsSubmitting(false);
      return;
    }
    
    setPasswordError('');
    await register(username, password, email);
      setSuccess(true);
      
      // Redirect to dashboard after a short delay to show success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Registration error in component:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}
        
        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError('')}>
            {passwordError}
          </Alert>
        )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Registration successful! Redirecting to dashboard...
        </Alert>
      )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="primary" />
              </InputAdornment>
            ),
          }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="primary" />
              </InputAdornment>
            ),
          }}
        />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
              type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
        
          <Button
            type="submit"
            fullWidth
            variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2, py: 1.5 }}
          disableElevation
          disabled={isSubmitting}
          >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
          </Button>
          </Box>
        </Box>
  );
};

export default Register;