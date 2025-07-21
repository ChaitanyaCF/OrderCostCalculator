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
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, clearError, user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
    await login(username, password);
      // Note: navigation is handled in the useEffect when user state changes
    } catch (err) {
      console.error('Login submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Disable the form while authenticating
  const isLoading = isSubmitting || loading;

  return (
    <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
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
          disabled={isLoading}
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
            required
            fullWidth
            name="password"
            label="Password"
          type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={toggleShowPassword}
                  edge="end"
                  disabled={isLoading}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                color="primary"
                disabled={isLoading}
              />
            }
            label="Remember me"
          />
        </Box>
        
          <Button
            type="submit"
            fullWidth
            variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2, py: 1.5 }}
          disableElevation
          disabled={isLoading}
          >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
          </Button>
          </Box>
        </Box>
  );
};

export default Login;