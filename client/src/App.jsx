import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Pages — we'll build these one by one
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import VerifyEmailPage  from './pages/VerifyEmailPage'
import DashboardPage    from './pages/DashboardPage'
import WorkspacePage    from './pages/WorkspacePage'
import ProjectPage      from './pages/ProjectPage'

// Protected route — redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public route — redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"        element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"     element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected routes */}
      <Route path="/dashboard"           element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/workspace/:id"       element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
      <Route path="/project/:id"         element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;