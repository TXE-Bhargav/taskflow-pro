import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage   from './pages/DashboardPage'
import WorkspacePage   from './pages/WorkspacePage'
import ProjectPage     from './pages/ProjectPage'

// Protected route — only accessible when logged in
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public route — redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"        element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"     element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected */}
      <Route path="/dashboard"     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/workspace/:id" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
      <Route path="/project/:id"   element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />

      {/* Default */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;