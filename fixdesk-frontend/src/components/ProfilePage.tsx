import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    List,
    ListItem,
    Divider,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert
} from '@mui/material';
import axios from 'axios';
import CustomDialog from './CustomDialog';
import NotificationSettings from './NotificationSettings';
import SocialAccountsSettings from './SocialAccountsSettings';
import ChangeEmailSettings from './ChangeEmailSettings';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    position?: string;
    has_password?: boolean;
    is_deleted?: boolean;
    deletion_scheduled_at?: string;
}

interface UserData {
    first_name: string;
    last_name: string;
    position: string;
    email: string;
    role: string;
    avatar_url?: string;
    email_verified?: boolean;
    invited_by?: number;
    invitations?: Invitation[];
}

interface Invitation {
    id: number;
    invitee_email: string;
    status: string;
    created_at: string;
    registered_at?: string;
    registered_first_name?: string;
    registered_last_name?: string;
}

interface InviterData {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface InvitedUser {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    position: string;
    created_at: string;
    invited_at: string;
    completed_at?: string;
    registered_at?: string;
    registered_email?: string;
    registered_first_name?: string;
    registered_last_name?: string;
    user_created_at?: string;
}

interface InvitationRequest {
    id: number;
    requester_id: number;
    requested_email: string;
    message?: string;
    status: string;
    created_at: string;
    processed_at?: string;
    processed_by?: number;
    rejection_reason?: string;
    requester_first_name: string;
    requester_last_name: string;
    requester_email: string;
    processor_first_name?: string;
    processor_last_name?: string;
}

function ProfilePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [token] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [inviterData, setInviterData] = useState<InviterData | null>(null);
    const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
    const [invitationRequests, setInvitationRequests] = useState<InvitationRequest[]>([]);
    const [myInvitationRequests, setMyInvitationRequests] = useState<InvitationRequest[]>([]);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        first_name: '',
        last_name: '',
        position: ''
    });
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });
    const notificationSettingsRef = useRef<any>(null);
    const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
    const [notificationSettingsSaving, setNotificationSettingsSaving] = useState(false);
    const [socialAccountsDialogOpen, setSocialAccountsDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleProcessRequest = async (requestId: number, action: 'approve' | 'reject') => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSnackbar({
                    open: true,
                    message: 'Ошибка авторизации',
                    severity: 'error'
                });
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            let response;
            if (action === 'approve') {
                response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/auth/invitation-request/${requestId}/process`,
                    { action: 'approve' },
                    config
                );
            } else {
                response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/auth/invitation-request/${requestId}/process`,
                    { action: 'reject', rejection_reason: rejectionReason },
                    config
                );
            }

            if (response.status === 200) {
                setSnackbar({
                    open: true,
                    message: action === 'approve' ? 'Запрос одобрен' : 'Запрос отклонен',
                    severity: 'success'
                });

                loadUserData();
                setRejectDialogOpen(false);
                setRejectionReason('');
                setSelectedRequestId(null);
            }
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Ошибка при обработке запроса',
                severity: 'error'
            });
        }
    };

    const handleRejectClick = (requestId: number) => {
        setSelectedRequestId(requestId);
        setRejectDialogOpen(true);
    };

    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const openEditProfileDialog = () => {
        if (userData) {
            setEditFormData({
                first_name: userData.first_name,
                last_name: userData.last_name,
                position: userData.position || ''
            });
        }
        setEditProfileDialogOpen(true);
    };

    useEffect(() => {
        if (socialAccountsDialogOpen && userData) {
            setEditFormData({
                first_name: userData.first_name,
                last_name: userData.last_name,
                position: userData.position || ''
            });
        }
    }, [socialAccountsDialogOpen, userData]);

    const handleEditProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSnackbar({
                    open: true,
                    message: 'Ошибка авторизации',
                    severity: 'error'
                });
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/me`,
                editFormData,
                config
            );

            if (response.status === 200) {
                setSnackbar({
                    open: true,
                    message: 'Профиль успешно обновлен',
                    severity: 'success'
                });

                loadUserData();
                setEditProfileDialogOpen(false);
            }
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Ошибка обновления профиля',
                severity: 'error'
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#ff9800';
            case 'approved':
                return '#4caf50';
            case 'rejected':
                return '#f44336';
            default:
                return '#757575';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return '⏳ Ожидает';
            case 'approved':
                return '✅ Одобрен';
            case 'rejected':
                return '❌ Отклонен';
            default:
                return status;
        }
    };

    const loadUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSnackbar({
                    open: true,
                    message: 'Ошибка авторизации',
                    severity: 'error'
                });
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const userResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/me`, config);
            const userData = userResponse.data;

            setUser(userData);
            setUserData(userData);
            setInvitedUsers(userData.invited_users || []);

            if (userData.invited_by) {
                try {
                    const inviterResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/auth/who-invited-me`, config);
                    setInviterData(inviterResponse.data.inviter);
                } catch (inviterError) {

                }
            }

            if (userData.role === 'internal') {
                try {
                    const requestsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/auth/invitation-requests`, config);
                    setInvitationRequests(requestsResponse.data.requests || []);
                } catch (requestsError) {
                    setInvitationRequests([]);
                }
            }

            if (userData.role === 'external') {
                try {
                    const myRequestsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/auth/my-invitation-requests`, config);
                    setMyInvitationRequests(myRequestsResponse.data.requests || []);
                } catch (myRequestsError) {
                    setMyInvitationRequests([]);
                }
            }

        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Ошибка загрузки данных',
                severity: 'error'
            });
        }
    };

    const handleSaveNotificationSettings = async () => {
        if (notificationSettingsRef.current && notificationSettingsRef.current.save) {
            setNotificationSettingsSaving(true);
            await notificationSettingsRef.current.save();
            setNotificationSettingsSaving(false);
        }
    };

    const handlePasswordDialogOpen = () => {
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setPasswordError('');
        setPasswordDialogOpen(true);
    };

    const handlePasswordDialogClose = () => {
        setPasswordDialogOpen(false);
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setPasswordError('');
    };

    const handlePasswordSubmit = async () => {
        setPasswordError('');

        if (user?.has_password && !passwordForm.currentPassword) {
            setPasswordError('Введите текущий пароль');
            return;
        }

        if (!passwordForm.newPassword) {
            setPasswordError('Введите новый пароль');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Пароли не совпадают');
            return;
        }

        setPasswordLoading(true);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            await axios.post(
                `${backendUrl}/auth/set-password`,
                {
                    currentPassword: passwordForm.currentPassword || undefined,
                    newPassword: passwordForm.newPassword
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSnackbar({
                open: true,
                message: user?.has_password ? 'Пароль успешно изменен' : 'Пароль успешно установлен',
                severity: 'success'
            });

            handlePasswordDialogClose();
            loadUserData();
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Ошибка при установке пароля');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'УДАЛИТЬ') {
            setSnackbar({
                open: true,
                message: 'Введите "УДАЛИТЬ" для подтверждения',
                severity: 'error'
            });
            return;
        }

        setDeleteLoading(true);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const response = await axios.post(
                `${backendUrl}/auth/delete-account`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSnackbar({
                open: true,
                message: response.data.message,
                severity: 'success'
            });

            setDeleteDialogOpen(false);
            setDeleteConfirmText('');

            await loadUserData();

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Ошибка при удалении профиля',
                severity: 'error'
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    useEffect(() => {
        loadUserData();
    }, []);

    useEffect(() => {
        if (user?.is_deleted && user?.deletion_scheduled_at) {
            setSnackbar({
                open: true,
                message: 'Ваш аккаунт удален. Вы будете перенаправлены на главную страницу.',
                severity: 'warning'
            });

            setTimeout(() => {
                navigate('/', { replace: true });
            }, 2000);
        }
    }, [user?.is_deleted, user?.deletion_scheduled_at, navigate]);

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'linked') {
            setSnackbar({
                open: true,
                message: 'Социальный аккаунт успешно привязан',
                severity: 'success'
            });
            setSocialAccountsDialogOpen(true);
            setSearchParams({});
        } else if (error === 'already_linked') {
            setSnackbar({
                open: true,
                message: 'Этот социальный аккаунт уже привязан к другому пользователю',
                severity: 'error'
            });
            setSearchParams({});
        }
    }, [searchParams]);

    if (!user) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <Typography variant="h6" sx={{ color: '#cccccc' }}>
                    Загрузка...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            py: 4,
            px: { xs: 2, md: 4 }
        }}>
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Box sx={{
                    mb: 4,
                    textAlign: 'center',
                    bgcolor: '#212134',
                    p: 4,
                    borderRadius: 3,
                    border: '1px solid #32324d',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                    <Typography variant="h4" gutterBottom sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Профиль пользователя
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ffffff' }}>
                        {userData?.first_name} {userData?.last_name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#a5a5ba' }}>
                        {userData?.email} • {userData?.position || 'Должность не указана'}
                    </Typography>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            onClick={() => setNotificationDialogOpen(true)}
                            sx={{
                                bgcolor: '#212134',
                                borderColor: '#4a4a6a',
                                color: '#fff',
                                fontSize: '0.875rem',
                                px: 2,
                                py: 1,
                                '&:hover': { bgcolor: '#181826' }
                            }}
                        >
                            Настройки уведомлений
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => setSocialAccountsDialogOpen(true)}
                            sx={{
                                bgcolor: '#4945ff',
                                fontSize: '0.875rem',
                                px: 2,
                                py: 1,
                                '&:hover': {
                                    bgcolor: '#7b79ff',
                                },
                                color: '#ffffff'
                            }}
                        >
                            Настройки профиля
                        </Button>
                    </Box>
                </Box>

                {inviterData && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                            Вас пригласил
                        </Typography>
                        <Box sx={{
                            background: '#212134',
                            border: '1px solid #32324d',
                            p: 2,
                            borderRadius: 2,
                        }}>
                            <Typography variant="h6" sx={{ mb: 1, color: '#ffffff' }}>
                                {inviterData.first_name} {inviterData.last_name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                Email: {inviterData.email}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* <Divider sx={{ my: 3, borderColor: '#32324d' }} />

                <Box sx={{ mb: 4}}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#fff' }}>
                            Мои приглашения
                        </Typography>
                        <Button 
                            variant="contained" 
                            onClick={() => navigate('/send-invite')}
                            sx={{ 
                                bgcolor: '#4945ff',
                                borderColor: '#4945ff',
                                fontWeight: 'bold',
                                color: '#ffffff',
                                '&:hover': { 
                                    bgcolor: '#7b79ff',
                                    borderColor: '#7b79ff'
                                },
                            }}
                        >
                            Пригласить пользователя
                        </Button>
                    </Box>
                    
                    {userData?.invitations && userData.invitations.length > 0 ? (
                        <List sx={{ 
                            background: '#212134',
                            borderRadius: 2,
                            border: '1px solid #32324d',
                        }}>
                            {userData.invitations!.map((invitation: any, index: number) => (
                                <React.Fragment key={`invitation-${invitation.id}`}>
                                    <ListItem>
                                        <Box sx={{ width: '100%' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography sx={{ color: '#ffffff' }}>
                                                    {invitation.invitee_email}
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        color: invitation.registered_at ? '#4caf50' : '#ff9800',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {invitation.registered_at ? '✅ Зарегистрирован' : '⏳ Ожидает'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: '#717180' }}>
                                                Приглашение отправлено: {formatDate(invitation.created_at)}
                                            </Typography>
                                            {invitation.registered_at ? (
                                                <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                                    Зарегистрирован: {formatDate(invitation.registered_at)}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" sx={{ color: '#ff9800' }}>
                                                    Статус: {invitation.status === 'pending' ? 'Ожидает регистрации' : invitation.status}
                                                </Typography>
                                            )}
                                            {invitation.registered_first_name && invitation.registered_last_name && (
                                                <Typography variant="body2" sx={{ color: '#717180' }}>
                                                    Имя: {invitation.registered_first_name} {invitation.registered_last_name}
                                                </Typography>
                                            )}
                                        </Box>
                                    </ListItem>
                                    {index < (userData.invitations?.length || 0) - 1 && (
                                        <Divider key={`divider-invitation-${invitation.id}`} sx={{ borderColor: '#404040' }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Typography sx={{ color: '#717180', fontStyle: 'italic' }}>
                            У вас пока нет приглашений
                        </Typography>
                    )}
                </Box> */}

                {/* <Divider sx={{ my: 3, borderColor: '#404040' }} />
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                        Зарегистрированные приглашенные пользователи
                    </Typography>
                    
                    {invitedUsers.length > 0 ? (
                        <List sx={{ 
                            background: '#212134',
                            borderRadius: 2,
                            border: '1px solid #32324d',
                        }}>
                            {invitedUsers.map((invitedUser, index) => (
                                <React.Fragment key={`invited-user-${invitedUser.id}`}>
                                    <ListItem>
                                        <Box sx={{ width: '100%' }}>
                                            <Typography variant="h6" sx={{ mb: 1, color: '#ffffff' }}>
                                                {invitedUser.first_name} {invitedUser.last_name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                                Email: {invitedUser.email}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                                Должность: {invitedUser.position || 'Не указана'}
                                            </Typography>
                                    
                                            <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                                Приглашен: {formatDate(invitedUser.invited_at)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                                Зарегистрирован: {formatDate(invitedUser.registered_at || invitedUser.created_at)}
                                            </Typography>
                                        </Box>
                                    </ListItem>
                                    {index < invitedUsers.length - 1 && (
                                        <Divider key={`divider-invited-user-${invitedUser.id}`} sx={{ borderColor: '#404040' }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Typography sx={{ color: '#717180', fontStyle: 'italic' }}>
                            Пока нет зарегистрированных приглашенных пользователей
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ my: 3, borderColor: '#404040' }} />

                {user?.role === 'internal' && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                            Запросы приглашений
                        </Typography>
                        
                        {invitationRequests.length > 0 ? (
                            <List sx={{ 
                                background: '#212134',
                            borderRadius: 2,
                            border: '1px solid #32324d',
                            }}>
                                {invitationRequests.map((request, index) => (
                                    <React.Fragment key={`invitation-request-${request.id}`}>
                                        <ListItem>
                                            <Box sx={{ width: '100%' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography sx={{ color: '#ffffff' }}>
                                                        Запрос от {request.requester_first_name} {request.requester_last_name}
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            color: getStatusColor(request.status),
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {getStatusText(request.status)}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                                    Email: {request.requested_email}
                                                </Typography>
                                                {request.message && (
                                                    <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                                        Комментарий: {request.message}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                                    Создан: {formatDate(request.created_at)}
                                                </Typography>
                                                {request.rejection_reason && (
                                                    <Typography variant="body2" sx={{ color: '#f44336', fontStyle: 'italic' }}>
                                                        Причина отклонения: {request.rejection_reason}
                                                    </Typography>
                                                )}
                                                {request.status === 'pending' && (
                                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                        <Button 
                                                            variant="contained" 
                                                            size="small"
                                                            onClick={() => handleProcessRequest(request.id, 'approve')}
                                                            sx={{
                                                                bgcolor: '#4caf50',
                                                                '&:hover': { bgcolor: '#45a049' },
                                                                color: '#ffffff'
                                                            }}
                                                        >
                                                            Одобрить
                                                        </Button>
                                                        <Button 
                                                            variant="contained" 
                                                            size="small"
                                                            onClick={() => handleRejectClick(request.id)}
                                                            sx={{
                                                                bgcolor: '#f44336',
                                                                '&:hover': { bgcolor: '#d32f2f' },
                                                                color: '#ffffff'
                                                            }}
                                                        >
                                                            Отклонить
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Box>
                                        </ListItem>
                                        {index < invitationRequests.length - 1 && (
                                            <Divider key={`divider-invitation-request-${request.id}`} sx={{ borderColor: '#404040' }} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Typography sx={{ color: '#717180', fontStyle: 'italic' }}>
                                Нет запросов приглашений
                            </Typography>
                        )}
                    </Box>
                )}

                {user?.role === 'external' && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                            Мои запросы приглашений
                        </Typography>
                        
                        {myInvitationRequests.length > 0 ? (
                            <List sx={{ 
                                background: '#1a1a1a',
                                borderRadius: 2,
                                border: '1px solid #404040',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                            }}>
                                {myInvitationRequests.map((request, index) => (
                                    <React.Fragment key={`my-invitation-request-${request.id}`}>
                                        <ListItem>
                                            <Box sx={{ width: '100%' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography sx={{ color: '#ffffff' }}>
                                                        Запрос для {request.requested_email}
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            color: getStatusColor(request.status),
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {getStatusText(request.status)}
                                                    </Typography>
                                                </Box>
                                                {request.message && (
                                                    <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                                        Комментарий: {request.message}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                                    Создан: {formatDate(request.created_at)}
                                                </Typography>
                                                {request.processor_first_name && (
                                                    <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                                        Обработан: {request.processor_first_name} {request.processor_last_name}
                                                    </Typography>
                                                )}
                                                {request.rejection_reason && (
                                                    <Typography variant="body2" sx={{ color: '#f44336', fontStyle: 'italic' }}>
                                                        Причина отклонения: {request.rejection_reason}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </ListItem>
                                        {index < myInvitationRequests.length - 1 && (
                                            <Divider key={`divider-my-invitation-request-${request.id}`} sx={{ borderColor: '#404040' }} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Typography sx={{ color: '#717180', fontStyle: 'italic' }}>
                                У вас пока нет запросов приглашений
                            </Typography>
                        )}
                    </Box>
                )} */}
            </Box>

            <CustomDialog
                open={editProfileDialogOpen}
                onClose={() => setEditProfileDialogOpen(false)}
                title="Редактировать профиль"
                maxWidth="sm"
                fullWidth
                actions={
                    <>
                        <Button onClick={() => setEditProfileDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button
                            onClick={handleEditProfile}
                            variant="contained"
                            disabled={!editFormData.first_name.trim() || !editFormData.last_name.trim()}
                        >
                            Сохранить
                        </Button>
                    </>
                }
            >
                <Box sx={{ pt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        label="Имя"
                        value={editFormData.first_name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Фамилия"
                        value={editFormData.last_name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Должность"
                        value={editFormData.position}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, position: e.target.value }))}
                        fullWidth
                        placeholder="Например: Разработчик, Менеджер проекта, Тестировщик"
                    />
                </Box>
            </CustomDialog>

            <Dialog
                open={rejectDialogOpen}
                onClose={() => setRejectDialogOpen(false)}
                PaperProps={{
                    sx: {
                        background: '#212134',
                        border: '1px solid #32324d',
                    }
                }}
            >
                <DialogTitle sx={{ color: '#ffffff', borderBottom: '1px solid #404040' }}>
                    Отклонить запрос приглашения
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Причина отклонения"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        multiline
                        rows={3}
                        sx={{
                            mt: 3,
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#404040',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#f06a6a',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#f06a6a',
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
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #404040', p: 2 }}>
                    <Button
                        onClick={() => setRejectDialogOpen(false)}
                        sx={{
                            color: '#a5a5ba',
                            textTransform: 'none',
                            '&:hover': {
                                color: '#fff',
                                bgcolor: '#181826'
                            }
                        }}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={() => selectedRequestId && handleProcessRequest(selectedRequestId, 'reject')}
                        sx={{
                            mt: 2,
                            height: 45,
                            bgcolor: '#4945ff',
                            '&:hover': { bgcolor: '#7b79ff' },
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                        variant="contained"
                    >
                        Отклонить
                    </Button>
                </DialogActions>
            </Dialog>

            <CustomDialog
                open={notificationDialogOpen}
                onClose={() => setNotificationDialogOpen(false)}
                title="Настройки уведомлений"
                maxWidth="sm"
                fullWidth
                actions={
                    <>
                        <Button onClick={() => setNotificationDialogOpen(false)}>
                            Закрыть
                        </Button>
                        <Button
                            onClick={handleSaveNotificationSettings}
                            variant="contained"
                            disabled={notificationSettingsSaving}
                        >
                            {notificationSettingsSaving ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </>
                }
            >
                <NotificationSettings ref={notificationSettingsRef} />
            </CustomDialog>

            <CustomDialog
                open={socialAccountsDialogOpen}
                onClose={() => setSocialAccountsDialogOpen(false)}
                title="Настройки профиля"
                maxWidth="md"
                fullWidth
                actions={
                    <Button onClick={() => setSocialAccountsDialogOpen(false)}>
                        Закрыть
                    </Button>
                }
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Редактирование профиля */}
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>Основная информация</span>
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <TextField
                                label="Имя"
                                value={editFormData.first_name}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                fullWidth
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#212134',
                                        '& fieldset': {
                                            borderColor: '#32324d'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#4a4a6a'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#a5a5ba'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    }
                                }}
                            />
                            <TextField
                                label="Фамилия"
                                value={editFormData.last_name}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                fullWidth
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#212134',
                                        '& fieldset': {
                                            borderColor: '#32324d'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#4a4a6a'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#a5a5ba'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    }
                                }}
                            />
                            <TextField
                                label="Должность"
                                value={editFormData.position}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, position: e.target.value }))}
                                fullWidth
                                placeholder="Например: Разработчик, Менеджер проекта, Тестировщик"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#212134',
                                        '& fieldset': {
                                            borderColor: '#32324d'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#4a4a6a'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#a5a5ba'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    }
                                }}
                            />
                            <Button
                                onClick={handleEditProfile}
                                variant="contained"
                                disabled={!editFormData.first_name.trim() || !editFormData.last_name.trim()}
                                sx={{
                                    bgcolor: '#4945ff',
                                    '&:hover': { bgcolor: '#7b79ff' },
                                    alignSelf: 'flex-start'
                                }}
                            >
                                Сохранить изменения
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ borderColor: '#32324d' }} />

                    {/* Смена email */}
                    <ChangeEmailSettings
                        currentEmail={user?.email || ''}
                        token={token || ''}
                        onEmailChanged={loadUserData}
                    />

                    <Divider sx={{ borderColor: '#32324d' }} />

                    {/* Смена пароля */}
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                            Пароль
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            {passwordError && (
                                <Alert severity="error" onClose={() => setPasswordError('')}>
                                    {passwordError}
                                </Alert>
                            )}

                            {user?.has_password && (
                                <TextField
                                    label="Текущий пароль"
                                    type="password"
                                    fullWidth
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#212134',
                                            '& fieldset': {
                                                borderColor: '#32324d'
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#4a4a6a'
                                            }
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: '#a5a5ba'
                                        },
                                        '& .MuiOutlinedInput-input': {
                                            color: '#fff'
                                        }
                                    }}
                                />
                            )}

                            <TextField
                                label="Новый пароль"
                                type="password"
                                fullWidth
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                helperText="Минимум 6 символов"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#212134',
                                        '& fieldset': {
                                            borderColor: '#32324d'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#4a4a6a'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#a5a5ba'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    },
                                    '& .MuiFormHelperText-root': {
                                        color: '#6b6f7e'
                                    }
                                }}
                            />

                            <TextField
                                label="Подтвердите новый пароль"
                                type="password"
                                fullWidth
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#212134',
                                        '& fieldset': {
                                            borderColor: '#32324d'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#4a4a6a'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#a5a5ba'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    }
                                }}
                            />

                            <Button
                                onClick={handlePasswordSubmit}
                                variant="contained"
                                disabled={passwordLoading}
                                sx={{
                                    bgcolor: '#4945ff',
                                    '&:hover': { bgcolor: '#7b79ff' },
                                    alignSelf: 'flex-start'
                                }}
                            >
                                {passwordLoading ? 'Сохранение...' : (user?.has_password ? 'Изменить пароль' : 'Установить пароль')}
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ borderColor: '#32324d' }} />

                    {/* Социальные аккаунты */}
                    <SocialAccountsSettings token={token || ''} open={socialAccountsDialogOpen} />

                    <Divider sx={{ borderColor: '#32324d' }} />

                    {/* Удаление профиля */}
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                            Удаление профиля
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a5a5ba', mb: 2 }}>
                            После удаления профиля у вас будет 30 дней для восстановления.
                            По истечении этого срока все данные будут безвозвратно удалены.
                        </Typography>
                        <Button
                            onClick={() => setDeleteDialogOpen(true)}
                            variant="outlined"
                            sx={{
                                borderColor: '#d32f2f',
                                color: '#d32f2f',
                                '&:hover': {
                                    borderColor: '#f44336',
                                    bgcolor: 'rgba(211, 47, 47, 0.08)'
                                }
                            }}
                        >
                            Удалить профиль
                        </Button>
                    </Box>
                </Box>
            </CustomDialog>

            <CustomDialog
                open={passwordDialogOpen}
                onClose={handlePasswordDialogClose}
                title={user?.has_password ? 'Изменить пароль' : 'Установить пароль'}
                maxWidth="sm"
                fullWidth
                actions={
                    <>
                        <Button onClick={handlePasswordDialogClose}>
                            Отмена
                        </Button>
                        <Button
                            onClick={handlePasswordSubmit}
                            variant="contained"
                            disabled={passwordLoading}
                            sx={{
                                bgcolor: '#4945ff',
                                '&:hover': { bgcolor: '#7b79ff' }
                            }}
                        >
                            {passwordLoading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </>
                }
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {passwordError && (
                        <Alert severity="error" onClose={() => setPasswordError('')}>
                            {passwordError}
                        </Alert>
                    )}

                    {user?.has_password && (
                        <TextField
                            label="Текущий пароль"
                            type="password"
                            fullWidth
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: '#212134',
                                    '& fieldset': {
                                        borderColor: '#32324d'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#4a4a6a'
                                    }
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#a5a5ba'
                                },
                                '& .MuiOutlinedInput-input': {
                                    color: '#fff'
                                }
                            }}
                        />
                    )}

                    <TextField
                        label="Новый пароль"
                        type="password"
                        fullWidth
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        helperText="Минимум 6 символов"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#212134',
                                '& fieldset': {
                                    borderColor: '#32324d'
                                },
                                '&:hover fieldset': {
                                    borderColor: '#4a4a6a'
                                }
                            },
                            '& .MuiInputLabel-root': {
                                color: '#a5a5ba'
                            },
                            '& .MuiOutlinedInput-input': {
                                color: '#fff'
                            },
                            '& .MuiFormHelperText-root': {
                                color: '#6b6f7e'
                            }
                        }}
                    />

                    <TextField
                        label="Подтвердите новый пароль"
                        type="password"
                        fullWidth
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#212134',
                                '& fieldset': {
                                    borderColor: '#32324d'
                                },
                                '&:hover fieldset': {
                                    borderColor: '#4a4a6a'
                                }
                            },
                            '& .MuiInputLabel-root': {
                                color: '#a5a5ba'
                            },
                            '& .MuiOutlinedInput-input': {
                                color: '#fff'
                            }
                        }}
                    />
                </Box>
            </CustomDialog>

            {/* Диалог подтверждения удаления профиля */}
            <CustomDialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setDeleteConfirmText('');
                }}
                title="Удалить профиль"
                maxWidth="sm"
                fullWidth
                actions={
                    <>
                        <Button
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setDeleteConfirmText('');
                            }}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleDeleteAccount}
                            variant="contained"
                            disabled={deleteLoading || deleteConfirmText !== 'УДАЛИТЬ'}
                            sx={{
                                bgcolor: '#d32f2f',
                                '&:hover': { bgcolor: '#f44336' },
                                '&:disabled': { bgcolor: '#4a4a6a' }
                            }}
                        >
                            {deleteLoading ? 'Удаление...' : 'Удалить профиль'}
                        </Button>
                    </>
                }
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity="warning">
                        <strong>Внимание!</strong> Это действие приведет к удалению вашего профиля.
                    </Alert>

                    <Typography variant="body2" sx={{ color: '#a5a5ba' }}>
                        После удаления профиля:
                    </Typography>
                    <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, mt: 0 }}>
                        <li>У вас будет <strong>30 дней</strong> для восстановления аккаунта</li>
                        <li>Вы сможете войти в систему и нажать кнопку "Восстановить"</li>
                        <li>По истечении 30 дней все данные будут безвозвратно удалены</li>
                        <li>Будут удалены: профиль, проекты, задачи, комментарии и все связанные данные</li>
                    </Box>

                    <Divider sx={{ borderColor: '#32324d', my: 1 }} />

                    <Typography variant="body2" sx={{ color: '#a5a5ba', fontWeight: 600 }}>
                        Для подтверждения введите слово: <span style={{ color: '#d32f2f' }}>УДАЛИТЬ</span>
                    </Typography>

                    <TextField
                        fullWidth
                        placeholder="Введите УДАЛИТЬ"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#212134',
                                '& fieldset': {
                                    borderColor: '#32324d'
                                },
                                '&:hover fieldset': {
                                    borderColor: '#4a4a6a'
                                }
                            },
                            '& .MuiOutlinedInput-input': {
                                color: '#fff'
                            }
                        }}
                    />
                </Box>
            </CustomDialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default ProfilePage; 