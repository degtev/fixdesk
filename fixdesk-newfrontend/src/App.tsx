import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { LoginEmail } from './pages/LoginEmail/LoginEmail';
import { ForgotPassword } from './pages/ForgotPassword/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword/ResetPassword';
import { Register } from './pages/Register/Register';
import { Profile } from './pages/Profile/Profile';
import { OAuthCallback } from './pages/OAuthCallback/OAuthCallback';
import { Workspaces } from './pages/Workspaces';
import { WorkspaceDetail } from './pages/WorkspaceDetail/WorkspaceDetail';
import { ProjectDetail } from './pages/ProjectDetail/ProjectDetail';
import { Dashboard } from './pages/Dashboard';
import { NotificationProvider } from './components/NotificationProvider/NotificationProvider';
import { authUtils } from './utils/auth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return authUtils.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  return !authUtils.isAuthenticated() ? <>{children}</> : <Navigate to="/profile" />;
}

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/login/email"
            element={
              <PublicRoute>
                <LoginEmail />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/oauth/callback"
            element={<OAuthCallback />}
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/workspaces"
            element={
              <PrivateRoute>
                <Workspaces />
              </PrivateRoute>
            }
          />
          <Route
            path="/workspace/:uuid"
            element={
              <PrivateRoute>
                <WorkspaceDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/project/:uuid"
            element={
              <PrivateRoute>
                <ProjectDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
