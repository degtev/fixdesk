import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface DeletedAccountBannerProps {
    deletionScheduledAt: string;
    onRestoreSuccess: () => void;
}

const DeletedAccountBanner: React.FC<DeletedAccountBannerProps> = ({ deletionScheduledAt, onRestoreSuccess }) => {
    const { logout } = useAuth();
    const [restoring, setRestoring] = useState(false);
    const [error, setError] = useState('');

    const deletionDate = new Date(deletionScheduledAt);
    const now = new Date();
    const daysLeft = Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const handleRestore = async () => {
        setRestoring(true);
        setError('');

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const token = localStorage.getItem('token');
            
            await axios.post(
                `${backendUrl}/auth/restore-account`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            onRestoreSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при восстановлении аккаунта');
        } finally {
            setRestoring(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <Box
            sx={{
                bgcolor: '#16161a',
                border: '2px solid #d32f2f',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(211, 47, 47, 0.3)'
            }}
        >
            {/* Красная шапка */}
            <Box
                sx={{
                    bgcolor: '#d32f2f',
                    color: '#fff',
                    p: 3,
                    textAlign: 'center'
                }}
            >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    ⚠️ Аккаунт удален
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.95 }}>
                    У вас осталось <strong>{daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}</strong>
                </Typography>
            </Box>

            {/* Контент */}
            <Box sx={{ p: 4 }}>
                <Typography variant="body1" sx={{ color: '#a5a5ba', mb: 3, fontSize: '1.1rem', lineHeight: 1.8 }}>
                    Ваш профиль был удален и будет окончательно удален через:
                </Typography>

                <Box
                    sx={{
                        bgcolor: '#212134',
                        border: '1px solid #32324d',
                        borderRadius: 2,
                        p: 3,
                        mb: 3,
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>
                        {deletionDate.toLocaleDateString('ru-RU', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a5a5ba', mt: 1 }}>
                        {deletionDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                    После этой даты все ваши данные будут безвозвратно удалены:
                    <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                        <li>Профиль и персональная информация</li>
                        <li>Все проекты и рабочие пространства</li>
                        <li>Задачи, баги и комментарии</li>
                        <li>Загруженные файлы и вложения</li>
                    </Box>
                </Alert>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        justifyContent: 'center'
                    }}
                >
                    <Button
                        onClick={handleRestore}
                        disabled={restoring}
                        variant="contained"
                        size="large"
                        sx={{
                            bgcolor: '#4caf50',
                            color: '#fff',
                            fontWeight: 600,
                            py: 1.5,
                            px: 4,
                            fontSize: '1.1rem',
                            '&:hover': {
                                bgcolor: '#66bb6a'
                            },
                            '&:disabled': {
                                bgcolor: '#4a4a6a'
                            }
                        }}
                    >
                        {restoring ? 'Восстановление...' : '✓ Восстановить аккаунт'}
                    </Button>
                    <Button
                        onClick={handleLogout}
                        variant="outlined"
                        size="large"
                        sx={{
                            borderColor: '#4a4a6a',
                            color: '#a5a5ba',
                            py: 1.5,
                            px: 4,
                            fontSize: '1.1rem',
                            '&:hover': {
                                borderColor: '#6a6a8a',
                                bgcolor: 'rgba(255,255,255,0.05)'
                            }
                        }}
                    >
                        Выйти
                    </Button>
                </Box>

                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: '#717180', 
                        textAlign: 'center',
                        mt: 3,
                        pt: 3,
                        borderTop: '1px solid #32324d'
                    }}
                >
                    Если вы хотите восстановить аккаунт, нажмите кнопку выше. 
                    Все ваши данные будут немедленно восстановлены.
                </Typography>
            </Box>
        </Box>
    );
};

export default DeletedAccountBanner;

