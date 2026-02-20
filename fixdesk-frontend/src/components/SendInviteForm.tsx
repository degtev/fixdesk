import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { TextField, Button, Typography, Box, Alert, CircularProgress, Snackbar } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';

interface UserData {
    first_name: string;
    last_name: string;
    position: string;
    email: string;
    role: string;
    avatar_url?: string;
    email_verified?: boolean;
    invited_by?: number;
}

function SendInvite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        message: '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isInternalUser, setIsInternalUser] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showNotification = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setIsAuthorized(false);
                setError('Вы не авторизованы. Войдите в систему, чтобы пригласить пользователей.');
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const userData = response.data;
            setUserData(userData);
            setIsInternalUser(userData.role === 'internal');
            setIsAuthorized(true);
            setError('');
        } catch (err: any) {
            setIsAuthorized(false);
            setError('Вы не авторизованы. Войдите в систему, чтобы пригласить пользователей.');
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthorized) {
            setError('Вы не авторизованы. Войдите в систему, чтобы пригласить пользователей.');
            return;
        }

        if (!isInternalUser) {
            try {
                const token = localStorage.getItem('token');
                
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/invitation-request`, {
                    requestedEmail: formData.email,
                    message: formData.message || `Запрос приглашения от ${userData?.first_name} ${userData?.last_name}`
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                showNotification('Запрос приглашения отправлен. Ожидайте ответа от сотрудника.', 'success');
                setFormData({ ...formData, email: '' });
            } catch (err: any) {
                if (err.response?.status === 403) {
                    showNotification('Только внешние пользователи могут создавать запросы приглашений.', 'error');
                } else if (err.response?.status === 400) {
                    showNotification(err.response?.data?.message || 'Неверные данные', 'error');
                } else {
                    showNotification('Не удалось отправить запрос приглашения. Попробуйте позже.', 'error');
                }
            }
        } else {
            try {
                const token = localStorage.getItem('token');
                
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/register/external/invite`, {
                    ...formData,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                showNotification('Приглашение отправлено', 'success');
                setFormData({ ...formData, email: '' });
            } catch (err: any) {
                if (err.response?.status === 401) {
                    showNotification('Вы не авторизованы. Войдите в систему, чтобы пригласить пользователей.', 'error');
                    setIsAuthorized(false);
                } else if (err.response?.status === 400) {
                    showNotification(err.response?.data?.message || 'Неверные данные', 'error');
                } else if (err.response?.status === 409) {
                    showNotification('Пользователь с таким email уже существует', 'error');
                } else {
                    showNotification('Не удалось отправить приглашение. Попробуйте позже.', 'error');
                }
            }
        }
    };


    return (
        <Box
            sx={{
                py: 4,
                px: { xs: 2, md: 4 },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}
        >
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    width: '100%',
                    maxWidth: 450,
                    px: { xs: 2, sm: 4 },
                    py: 4,
                    borderRadius: 3,
                    background: '#212134',
                    border: '1px solid #32324d',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                }}
            >
                <Typography variant="h4" sx={{ 
                    mb: 2, 
                    color: '#fff',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    textAlign: 'center'
                }}>
                    {isInternalUser ? 'Отправить инвайт' : 'Запросить приглашение'}
                </Typography>

                {!isInternalUser && isInternalUser !== null && (
                    <Typography variant="body2" sx={{ 
                        mb: 2, 
                        color: '#cccccc',
                        textAlign: 'center',
                        bgcolor: 'rgba(240, 106, 106, 0.1)',
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid rgba(240, 106, 106, 0.3)'
                    }}>
                        Как внешний пользователь, вы можете запросить приглашение для другого пользователя. 
                        Запрос будет рассмотрен внутренним пользователем.
                    </Typography>
                )}

                {isAuthorized === false && (
                    <Box sx={{ 
                        textAlign: 'center', 
                        mt: 2,
                        bgcolor: '#1a1a1a',
                        p: 3,
                        borderRadius: 2,
                        border: '1px solid #404040'
                    }}>
                        <Typography variant="body2" sx={{ mb: 2, color: '#cccccc' }}>
                            Для отправки приглашений необходимо войти в систему
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
                            <Button 
                                variant="contained" 
                                onClick={() => navigate('/login')}
                                sx={{ 
                                    bgcolor: '#f06a6a',
                                    '&:hover': { bgcolor: '#e55a5a' },
                                    color: '#ffffff',
                                    fontWeight: 'bold'
                                }}
                            >
                                Войти в систему
                            </Button>
                            <Button 
                                variant="outlined" 
                                onClick={() => window.location.reload()}
                                sx={{ 
                                    color: '#cccccc', 
                                    borderColor: '#404040',
                                    '&:hover': { 
                                        borderColor: '#f06a6a',
                                        bgcolor: 'rgba(240, 106, 106, 0.1)'
                                    }
                                }}
                            >
                                Обновить страницу
                            </Button>
                            <Button 
                                variant="outlined" 
                                onClick={checkAuth}
                                sx={{ 
                                    color: '#cccccc', 
                                    borderColor: '#404040',
                                    '&:hover': { 
                                        borderColor: '#f06a6a',
                                        bgcolor: 'rgba(240, 106, 106, 0.1)'
                                    }
                                }}
                            >
                                Проверить авторизацию
                            </Button>
                        </Box>
                    </Box>
                )}

                {isAuthorized === null && (
                    <Box sx={{ 
                        textAlign: 'center', 
                        mt: 2,
                        bgcolor: '#1a1a1a',
                        p: 3,
                        borderRadius: 2,
                        border: '1px solid #404040'
                    }}>
                        <CircularProgress size={24} sx={{ color: '#f06a6a' }} />
                        <Typography variant="body2" sx={{ mt: 1, color: '#cccccc' }}>
                            Проверка авторизации...
                        </Typography>
                    </Box>
                )}

                {isAuthorized && (
                    <>
                        <TextField
                            name="email"
                            label="Email"
                            variant="outlined"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#212134',
                            '& fieldset': {
                                borderColor: '#32324d',
                                borderWidth: '1px',
                            },
                            '&:hover fieldset': {
                                borderColor: '#4945ff',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#4945ff',
                                borderWidth: '1px',
                                color:'red!important'
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: '#cccccc',
                            '&.Mui-focused': {
                                color: '#1976d2',
                            },
                        },
                        '& .MuiInputBase-input': {
                            color: '#ffffff',
                        },
                            }}
                        />

                        <TextField
                            name="message"
                            label="Комментарий (необязательно)"
                            variant="outlined"
                            value={formData.message}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#212134',
                            '& fieldset': {
                                borderColor: '#32324d',
                                borderWidth: '1px',
                            },
                            '&:hover fieldset': {
                                borderColor: '#4945ff',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#4945ff',
                                borderWidth: '1px',
                                color:'red!important'
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: '#cccccc',
                            '&.Mui-focused': {
                                color: '#1976d2',
                            },
                        },
                        '& .MuiInputBase-input': {
                            color: '#ffffff',
                        },
                            }}
                        />

                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{ 
                                    mt: 2,
                        height: 45,
                        bgcolor: '#4945ff',
                        '&:hover': { bgcolor: '#7b79ff' },
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        width:'100%'
                                }}
                            >
                                {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Отправить приглашение'}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbarSeverity} 
                    sx={{ 
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: snackbarSeverity === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)',
                        color: '#ffffff',
                        '& .MuiAlert-icon': {
                            fontSize: '24px',
                            color: '#ffffff'
                        }
                    }}
                    icon={snackbarSeverity === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
                >
                    <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#ffffff' }}>
                        {snackbarMessage}
                    </Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default SendInvite;
