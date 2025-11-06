import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireSuperuser = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If superuser access is required, check if user has superuser privileges
  if (requireSuperuser && !user?.is_superuser) {
    // Redirect to home if user is not a superuser
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
