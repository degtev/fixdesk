import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useSearchParams,
    useLocation,
} from 'react-router-dom';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { shouldShowLayout } from './utils/authPages';

import ExternalRegisterForm from './components/ExternalRegisterForm';
import InternalRegisterForm from './components/InternalRegisterForm';
import AuthLoginForm from './components/LoginForm';
import SendInviteForm from './components/SendInviteForm';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import ProjectsList from './components/ProjectsList';
import ProjectView from './components/ProjectView';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import DebugPage from './components/DebugPage';
import NotificationSettings from './components/NotificationSettings';
import OAuthSuccess from './components/OAuthSuccess';

import CreateProjectForm from './components/CreateProject';
import WorkspacesList from './components/WorkspacesList';
import CreateWorkspace from './components/CreateWorkspace';
import WorkspaceView from './components/WorkspaceView';
import CreateProjectInWorkspace from './components/CreateProjectInWorkspace';
import AcceptWorkspaceInvite from './components/AcceptWorkspaceInvite';

function SendInvite() {
    const [searchParams] = useSearchParams();

    return (
        <div style={{ padding: 0 }}>
            <SendInviteForm />
        </div>
    );
}

function ExternalRegister() {
    const [searchParams] = useSearchParams();

    return (
        <div style={{ padding: 0 }}>
            <ExternalRegisterForm />
        </div>
    );
}

function InternalRegister() {
    const [searchParams] = useSearchParams();

    return (
        <div style={{ padding: 0 }}>
            <InternalRegisterForm />
        </div>
    );
}

function LoginForm() {
    const [searchParams] = useSearchParams();

    return (
        <div style={{ padding: 0 }}>
            <AuthLoginForm />
        </div>
    );
}

function ForgotPassword() {
    return (
        <div style={{ padding: 0 }}>
            <ForgotPasswordForm />
        </div>
    );
}

function ResetPassword() {
    return (
        <div style={{ padding: 0 }}>
            <ResetPasswordForm />
        </div>
    );
}

function CreateProject() {
    const [searchParams] = useSearchParams();

    return (
        <div style={{ padding: 0 }}>
            <CreateProjectForm />
        </div>
    );
}

import PrivacyPolicy from './components/PrivacyPolicy';

function Home() {
    return (
        <div style={{ padding: 0 }}>
            <HomePage />
        </div>
    );
}

function Profile() {
    return (
        <div style={{ padding: 0 }}>
            <ProfilePage />
        </div>
    );
}

function Projects() {
    return (
        <div style={{ padding: 0 }}>
            <ProjectsList />
        </div>
    );
}

function Project() {
    return (
        <div style={{ padding: 0 }}>
            <ProjectView />
        </div>
    );
}

function Debug() {
    return (
        <div style={{ padding: 0 }}>
            <DebugPage />
        </div>
    );
}

function NotificationSettingsPage() {
    return (
        <div style={{ padding: 0 }}>
            <NotificationSettings />
        </div>
    );
}

function Workspaces() {
    return (
        <div style={{ padding: 0 }}>
            <WorkspacesList />
        </div>
    );
}

function WorkspaceCreate() {
    return (
        <div style={{ padding: 0 }}>
            <CreateWorkspace />
        </div>
    );
}

function Workspace() {
    return (
        <div style={{ padding: 0 }}>
            <WorkspaceView />
        </div>
    );
}

function WorkspaceProjectCreate() {
    return (
        <div style={{ padding: 0 }}>
            <CreateProjectInWorkspace />
        </div>
    );
}

function WorkspaceInvite() {
    return (
        <div style={{ padding: 0 }}>
            <AcceptWorkspaceInvite />
        </div>
    );
}

function App() {
    const { loading } = useAuth();
    if (loading) return null; 
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    
                    {/* Workspace routes */}
                    <Route path="/workspaces" element={<Workspaces />} />
                    <Route path="/workspaces/create" element={<WorkspaceCreate />} />
                    <Route path="/workspaces/:id" element={<Workspace />} />
                    <Route path="/workspaces/:workspaceId/projects/create" element={<WorkspaceProjectCreate />} />
                    <Route path="/workspace-invite/:token" element={<WorkspaceInvite />} />
                    
                    {/* Project routes */}
                    <Route path="/project/:projectId" element={<Project />} />
                    
                    {/* Auth routes */}
                    <Route path="/send-invite" element={<SendInvite />} />
                    <Route path="/auth/register/invite" element={<SendInvite />} />
                    <Route path="/auth/register/external" element={<ExternalRegister />} />
                    <Route path="/auth/register/internal" element={<InternalRegister />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/oauth-success" element={<OAuthSuccess />} />

                    {/* Settings routes */}
                    <Route path="/notification-settings" element={<NotificationSettingsPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/debug" element={<Debug />} />
                </Routes>
            </Layout>
        </Router>
    );
}

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },

});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <AuthProvider>
            <App />
        </AuthProvider>
    </ThemeProvider>
);
