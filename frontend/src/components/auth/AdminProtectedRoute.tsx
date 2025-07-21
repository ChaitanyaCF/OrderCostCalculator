import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Use a direct check of localStorage to determine admin status
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log("AdminProtectedRoute - User from localStorage:", userData);
        
        // Check both admin and isAdmin properties
        const adminStatus = Boolean(userData.admin || userData.isAdmin);
        console.log("AdminProtectedRoute - Admin status from direct localStorage check:", adminStatus);
        
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      console.error("Error parsing localStorage:", e);
      setIsAdmin(false);
    }
  }, []);
  
  console.log("AdminProtectedRoute - Current user from context:", user);
  console.log("AdminProtectedRoute - isAdmin state:", isAdmin);
  
  if (loading || isAdmin === null) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Use our direct localStorage check instead of user.isAdmin
  if (!isAdmin) {
    console.log("Access denied - User is not an admin based on localStorage check");
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default AdminProtectedRoute; 