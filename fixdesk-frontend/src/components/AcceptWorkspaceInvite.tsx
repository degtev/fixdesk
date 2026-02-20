import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { WorkspaceInvitationInfo } from '../types/workspace';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface UserProfile {
    first_name?: string;
    last_name?: string;
    position?: string;
}

const AcceptWorkspaceInvite: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [invitation, setInvitation] = useState<WorkspaceInvitationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState('');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState({
        position: '',
        first_name: '',
        last_name: ''
    });

    useEffect(() => {
        fetchUserProfile();
        fetchInvitationInfo();
    }, [token]);

    const fetchUserProfile = async () => {
        try {
            const authToken = localStorage.getItem('token');
            if (!authToken) return;

            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUserProfile(userData);
                setFormData({
                    first_name: userData.first_name || '',
                    last_name: userData.last_name || '',
                    position: userData.position || ''
                });
            }
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
        }
    };

    const fetchInvitationInfo = async () => {
        try {
            const response = await fetch(`${API_URL}/workspaces/invitation-info/${token}`);

            if (!response.ok) {
                throw new Error('Приглашение не найдено');
            }

            const data = await response.json();

            if (data.status !== 'pending') {
                if (data.status === 'accepted') {
                    setError('Это приглашение уже было принято');
                } else if (data.status === 'expired') {
                    setError('Срок действия приглашения истек');
                } else {
                    setError('Приглашение недействительно');
                }
            }

            setInvitation(data);
        } catch (err: any) {
            setError(err.message || 'Ошибка при загрузке приглашения');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAccept = async () => {
        const authToken = localStorage.getItem('token');

        if (!authToken) {
            navigate(`/login?redirect=/workspace-invite/${token}`);
            return;
        }

        setAccepting(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/workspaces/accept-invite/${token}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to accept invitation');
            }

            const result = await response.json();
            navigate(`/workspaces/${result.workspace_uuid}`);
        } catch (err: any) {
            setError(err.message || 'Ошибка при принятии приглашения');
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Box display="flex" justifyContent="center">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error && !invitation) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Button variant="contained" onClick={() => navigate('/workspaces')}>
                        Вернуться к рабочим пространствам
                    </Button>
                </Paper>
            </Container>
        );
    }

    if (!invitation) {
        return null;
    }

    const isExpired = invitation.status !== 'pending';

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper elevation={0} sx={{
                boxShadow: 'none',
                p: 4,
                backgroundColor: '#212134',
            }}>
                <Typography variant="h5" gutterBottom textAlign="center">
                    Приглашение в рабочее пространство
                </Typography>

                <Box sx={{ my: 3, p: 2, bgcolor: '#2c2c3e', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        {invitation.workspace_name}
                    </Typography>
                    {invitation.workspace_description && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {invitation.workspace_description}
                        </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                        Вас приглашает:{' '}
                        <strong>
                            {invitation.inviter_first_name} {invitation.inviter_last_name}
                        </strong>
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!isExpired ? (
                    <>

                        <Box display="flex" gap={2} mt={3}>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleAccept}
                                disabled={accepting}
                                sx={{
                                    bgcolor: '#4945ff',
                                    borderColor: '#4945ff',
                                    fontSize: '0.875rem',
                                    px: 2,
                                    py: 1,
                                    '&:hover': {
                                        bgcolor: '#7b79ff',
                                        borderColor: '#7b79ff'
                                    },
                                    color: '#ffffff'
                                }}
                            >
                                {accepting ? 'Принятие...' : 'Принять приглашение'}
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => navigate('/workspaces')}
                                disabled={accepting}
                                sx={{
                                    bgcolor: '#212134',
                                    borderColor: '#4a4a6a',
                                    color: '#fff',
                                    fontSize: '0.875rem',
                                    px: 4,
                                    py: 1,
                                    '&:hover': { bgcolor: '#181826' }
                                }}
                            >
                                Отклонить
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate('/workspaces')}
                    >
                        Вернуться к рабочим пространствам
                    </Button>
                )}
            </Paper>
        </Container>
    );
};

export default AcceptWorkspaceInvite;

