import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Container,
    Card,
    CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    Dashboard,
    BugReport,
    Notifications,
    Person
} from '@mui/icons-material';
import axios from 'axios';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}

function HomePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };

                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/me`, config);
                setUser(response.data);
                if (response.data.first_name && response.data.last_name) {
                    localStorage.setItem('userName', `${response.data.first_name} ${response.data.last_name}`);
                } else if (response.data.first_name) {
                    localStorage.setItem('userName', response.data.first_name);
                } else {
                    localStorage.setItem('userName', 'Пользователь');
                }
            } catch (error: any) {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [navigate]);

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    Загрузка...
                </Typography>
            </Box>
        );
    }

    if (!user) {
        return null;
    }

    const quickActions = [
        {
            title: 'Воркспейс',
            description: 'Управление проектами и задачами',
            icon: <BugReport sx={{ fontSize: 40, color: '#c0c0cf' }} />,
            action: () => navigate('/workspaces'),
            color: '#c0c0cf'
        },
        {
            title: 'Профиль',
            description: 'Просмотр и редактирование профиля',
            icon: <Person sx={{ fontSize: 40, color: '#c0c0cf' }} />,
            action: () => navigate('/profile'),
            color: '#c0c0cf'
        }
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h4" gutterBottom sx={{ 
                    color: '#fff', 
                    fontWeight: 'bold',
                    mb: 2
                }}>
                    Добро пожаловать!
                </Typography>
                
                <Typography variant="h6" sx={{ 
                    color: '#a5a5ba'
                }}>
                    {user.first_name} {user.last_name}
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mb: 6 }}>
                {quickActions.map((action, index) => (
                    <Card
                        key={index}
                        sx={{
                            background: '#212134',
                            border: '1px solid #32324d',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                                borderColor: action.color
                            }
                        }}
                        onClick={action.action}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Box sx={{ mb: 2 }}>
                                {action.icon}
                            </Box>
                            <Typography variant="h6" sx={{ 
                                color: '#ffffff',
                                mb: 1
                            }}>
                                {action.title}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                                color: '#cccccc'
                            }}>
                                {action.description}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Card sx={{
                background: '#212134',
                border: '1px solid #32324d'
            }}>
                <CardContent>
                    <Typography variant="h6" sx={{ 
                        color: '#ffffff',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <Dashboard sx={{ color: '#c0c0cf' }} />
                        Обзор системы
                    </Typography>
                    <Typography variant="body2" sx={{ 
                        color: '#cccccc'
                    }}>
                        Используйте навигацию в верхней части страницы для быстрого доступа к основным разделам системы.
                    </Typography>
                </CardContent>
            </Card>
        </Container>
    );
}

export default HomePage;
