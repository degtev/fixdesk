import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const OAuthSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            login(token);
            navigate('/', { replace: true });
        } else {
            navigate('/login?error=oauth_failed', { replace: true });
        }
    }, [searchParams, navigate, login]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                bgcolor: '#16161a',
                gap: 2
            }}
        >
            <CircularProgress size={60} sx={{ color: '#4e55e8' }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>
                Авторизация...
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b6f7e' }}>
                Пожалуйста, подождите
            </Typography>
        </Box>
    );
};

export default OAuthSuccess;

