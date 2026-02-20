import React from 'react';
import { Button } from '@mui/material';

interface YandexOAuthButtonProps {
    action?: 'login' | 'register';
}

const YandexOAuthButton: React.FC<YandexOAuthButtonProps> = ({ action = 'login' }) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    const handleYandexLogin = () => {
        window.location.href = `${backendUrl}/oauth/yandex`;
    };

    return (
        <Button
            fullWidth
            variant="outlined"
            startIcon={
                <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10z" fill="#FC3F1D" /><path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.959l1.045.704-3.003 4.487H7.49l2.695-4.014c-1.55-1.111-2.42-2.19-2.42-4.015 0-2.288 1.595-3.85 4.62-3.85h3.003v11.868H13.32V7.666z" fill="#fff" /></svg>
            }
            onClick={handleYandexLogin}
            sx={{
                borderRadius: 2,
                borderColor: '#282c34',
                bgcolor: '#12141b',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
                transition: 'all 0.3s',
                '&:hover': {
                    borderColor: '#fc0',
                    bgcolor: 'rgba(255, 204, 0, 0.08)'
                }
            }}
        >
            {action === 'login' ? 'Яндекс' : 'Яндекс'}
        </Button>
    );
};

export default YandexOAuthButton;

