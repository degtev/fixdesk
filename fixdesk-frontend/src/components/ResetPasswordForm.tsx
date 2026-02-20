import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TextField, Button, Typography, Box, Alert, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

function ResetPasswordForm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        if (!token || !email) {
            setTokenValid(false);
            setError('Недействительная ссылка для сброса пароля');
        }
    }, [token, email]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleClickShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/reset-password`, {
                token,
                email,
                password: formData.password,
            });

            setSuccess(response.data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при сбросе пароля');
        } finally {
            setLoading(false);
        }
    };

    if (!tokenValid) {
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
                    <Alert 
                        severity="error"
                        sx={{ 
                            mb: 2,
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            border: '1px solid #f44336',
                            color: '#f44336',
                            '& .MuiAlert-icon': {
                                color: '#f44336'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                    <Button 
                        variant="text" 
                        onClick={() => navigate('/login')}
                        sx={{ 
                            color: '#cccccc', 
                            textTransform: 'none',
                            '&:hover': {
                                color: '#f06a6a',
                                bgcolor: 'rgba(240, 106, 106, 0.1)'
                            }
                        }}
                    >
                        Вернуться к входу
                    </Button>
                </Box>
            </Box>
        );
    }

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
                    maxWidth: 500,
                    px: { xs: 2, sm: 4 },
                    py: 4,
                    borderRadius: 3,
                    background: '#2a2a2a',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    border: '1px solid #404040',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                }}
            >
                <Typography variant="h4" sx={{ 
                    mb: 2, 
                    color: '#f06a6a', 
                    fontWeight: 'bold',
                    textAlign: 'center'
                }}>
                    Создание нового пароля
                </Typography>

                <Typography variant="body2" sx={{ 
                    mb: 2, 
                    color: '#cccccc',
                    textAlign: 'center',
                    bgcolor: 'rgba(240, 106, 106, 0.1)',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(240, 106, 106, 0.3)'
                }}>
                    Введите новый пароль для аккаунта {email}
                </Typography>

                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            mb: 2,
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            border: '1px solid #f44336',
                            color: '#f44336',
                            '& .MuiAlert-icon': {
                                color: '#f44336'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert 
                        severity="success" 
                        sx={{ 
                            mb: 2,
                            bgcolor: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid #4caf50',
                            color: '#4caf50',
                            '& .MuiAlert-icon': {
                                color: '#4caf50'
                            }
                        }}
                    >
                        {success}
                    </Alert>
                )}

                <TextField
                    name="password"
                    label="Новый пароль"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                    sx={{ 
                                        color: '#cccccc',
                                        '&:hover': {
                                            color: '#f06a6a'
                                        }
                                    }}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#1a1a1a',
                            '& fieldset': {
                                borderColor: '#404040',
                                borderWidth: '1px',
                            },
                            '&:hover fieldset': {
                                borderColor: '#f06a6a',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#f06a6a',
                                borderWidth: '2px',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: '#cccccc',
                            '&.Mui-focused': {
                                color: '#f06a6a',
                            },
                        },
                        '& .MuiInputBase-input': {
                            color: '#ffffff',
                        },
                    }}
                />

                <TextField
                    name="confirmPassword"
                    label="Подтвердите пароль"
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle confirm password visibility"
                                    onClick={handleClickShowConfirmPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                    sx={{ 
                                        color: '#cccccc',
                                        '&:hover': {
                                            color: '#f06a6a'
                                        }
                                    }}
                                >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#1a1a1a',
                            '& fieldset': {
                                borderColor: '#404040',
                                borderWidth: '1px',
                            },
                            '&:hover fieldset': {
                                borderColor: '#f06a6a',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#f06a6a',
                                borderWidth: '2px',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: '#cccccc',
                            '&.Mui-focused': {
                                color: '#f06a6a',
                            },
                        },
                        '& .MuiInputBase-input': {
                            color: '#ffffff',
                        },
                    }}
                />

                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={loading}
                    sx={{
                        mt: 2,
                        height: 50,
                        bgcolor: '#f06a6a',
                        '&:hover': { bgcolor: '#e55a5a' },
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        '&:disabled': {
                            bgcolor: '#404040',
                            color: '#888888'
                        }
                    }}
                >
                    {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
                </Button>

                <Button 
                    variant="text" 
                    onClick={() => navigate('/login')}
                    sx={{ 
                        color: '#cccccc', 
                        textTransform: 'none',
                        '&:hover': {
                            color: '#f06a6a',
                            bgcolor: 'rgba(240, 106, 106, 0.1)'
                        }
                    }}
                >
                    Вернуться к входу
                </Button>
            </Box>
        </Box>
    );
}

export default ResetPasswordForm; 