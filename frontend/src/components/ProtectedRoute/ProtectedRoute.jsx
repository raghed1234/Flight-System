// components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const response = await fetch("http://localhost/db-project/backend/api/auth-check.php", {
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (data.authenticated && data.user.role === requiredRole) {
        setIsAuthorized(true);
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Authorization check failed:', error);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : null;
};

export default ProtectedRoute;
