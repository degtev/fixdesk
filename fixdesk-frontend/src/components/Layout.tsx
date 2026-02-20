import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import DeletedAccountBanner from './DeletedAccountBanner';
import { useLocation } from 'react-router-dom';
import { shouldShowLayout } from '../utils/authPages';
import axios from 'axios';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const showLayout = shouldShowLayout(location.pathname);
    const [isDeleted, setIsDeleted] = useState(false);
    const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(true);

    const checkAccountStatus = async () => {
        const token = localStorage.getItem('token');
        if (!token || !showLayout) {
            setCheckingStatus(false);
            return;
        }

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const response = await axios.get(`${backendUrl}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsDeleted(response.data.is_deleted || false);
            setDeletionScheduledAt(response.data.deletion_scheduled_at || null);
        } catch (error) {
            console.error('Error checking account status:', error);
        } finally {
            setCheckingStatus(false);
        }
    };

    useEffect(() => {
        checkAccountStatus();
    }, [location.pathname, showLayout]);

    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem('token');
            if (token && showLayout) {
                checkAccountStatus();
            } else if (!token) {
                setIsDeleted(false);
                setDeletionScheduledAt(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [showLayout]);

    const handleRestoreSuccess = () => {
        setIsDeleted(false);
        setDeletionScheduledAt(null);
        window.location.reload();
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                background: '#181826'
            }}
        >
            {showLayout && isDeleted && deletionScheduledAt ? (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        p: 3
                    }}
                >
                    <Box sx={{ maxWidth: '800px', width: '100%' }}>
                        <DeletedAccountBanner
                            deletionScheduledAt={deletionScheduledAt}
                            onRestoreSuccess={handleRestoreSuccess}
                        />
                    </Box>
                </Box>
            ) : (
                <>
                    {showLayout && <Header />}
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            pt: showLayout ? '64px' : 0,
                            pb: { xs: 2, md: 0 }
                        }}
                    >
                        {children}
                    </Box>
                    {showLayout && <Footer />}
                </>
            )}
        </Box>
    );
};

export default Layout; 