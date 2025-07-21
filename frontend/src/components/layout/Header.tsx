import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  backPath?: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title = 'ProCost Calculator', 
  showBackButton = false,
  backPath = '/dashboard',
  onBack
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(backPath);
    }
  };

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar>
        {showBackButton && (
          <IconButton 
            color="inherit" 
            onClick={handleBack}
            edge="start"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box className="header-logo" sx={{ mr: 2 }}>
          <Box 
            component="img" 
            src="/images/cft-logo.png"
            alt="ProCost Logo"
            sx={{ height: '40px' }}
          />
        </Box>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Hello, {user?.username || 'User'} {user?.isAdmin ? '(Admin)' : ''}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;