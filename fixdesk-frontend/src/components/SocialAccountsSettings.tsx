import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Alert,
    CircularProgress,
    Chip,
    Button,
    Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import TelegramIcon from '@mui/icons-material/Telegram';
import axios from 'axios';

interface SocialAccount {
    id: number;
    provider: string;
    provider_email?: string;
    provider_username?: string;
    created_at: string;
}

interface SocialAccountsSettingsProps {
    token: string;
    open?: boolean;
}

const SocialAccountsSettings: React.FC<SocialAccountsSettingsProps> = ({ token, open }) => {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    const fetchAccounts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${backendUrl}/oauth/social-accounts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAccounts(response.data.accounts || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка загрузки социальных аккаунтов');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchAccounts();
        }
    }, [token, open]);

    const handleDelete = async (provider: string) => {
        try {
            await axios.delete(`${backendUrl}/oauth/social-accounts/${provider}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(`Аккаунт ${provider} успешно отвязан`);
            fetchAccounts();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка отвязки аккаунта');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    const hasGoogleAccount = accounts.some(acc => acc.provider === 'google');
    const hasYandexAccount = accounts.some(acc => acc.provider === 'yandex');
    const hasGitHubAccount = accounts.some(acc => acc.provider === 'github');
    const hasTelegramAccount = accounts.some(acc => acc.provider === 'telegram');

    const handleLink = (provider: string) => {
        if (provider === 'telegram') {
            handleTelegramLink();
        } else {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            window.location.href = `${backendUrl}/oauth/${provider}/link?token=${encodeURIComponent(token)}`;
        }
    };

    const handleTelegramLink = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const botIdResponse = await axios.get(`${backendUrl}/oauth/telegram/bot-id`);
            const botId = botIdResponse.data.botId;

            if (!botId) {
                setError('Telegram Bot ID не настроен. Обратитесь к администратору.');
                return;
            }

            const authUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(window.location.origin)}&request_access=write`;

            const width = 550;
            const height = 470;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;

            const popup = window.open(
                authUrl,
                'telegram-auth',
                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
            );

            if (!popup) {
                setError('Не удалось открыть окно авторизации. Пожалуйста, разрешите всплывающие окна.');
                return;
            }

            let authReceived = false;

            const handleMessage = async (event: MessageEvent) => {
                if (event.origin !== 'https://oauth.telegram.org') {
                    return;
                }

                let telegramData: any = null;

                if (typeof event.data === 'string') {
                    try {
                        const parsed = JSON.parse(event.data);

                        if (parsed.event === 'auth_result' && parsed.result) {
                            telegramData = parsed.result;
                        }
                    } catch (e) {
                        return;
                    }
                } else if (typeof event.data === 'object' && event.data.id && event.data.hash) {
                    telegramData = event.data;
                }

                if (telegramData && telegramData.id && telegramData.hash) {
                    authReceived = true;

                    try {
                        await axios.post(`${backendUrl}/oauth/telegram/link`, {
                            telegramData,
                            token
                        });

                        setSuccess('Telegram аккаунт успешно привязан');
                        fetchAccounts();
                        if (popup) popup.close();
                    } catch (err: any) {
                        const errorMsg = err.response?.data?.message || 'Ошибка привязки Telegram';
                        setError(errorMsg);
                    }

                    window.removeEventListener('message', handleMessage);
                }
            };

            window.addEventListener('message', handleMessage);

            const checkClosed = setInterval(() => {
                if (popup?.closed) {
                    window.removeEventListener('message', handleMessage);
                    clearInterval(checkClosed);
                }
            }, 1000);

            setTimeout(() => {
                window.removeEventListener('message', handleMessage);
                if (popup && !popup.closed) {
                    popup.close();
                }
                clearInterval(checkClosed);
            }, 300000);
        } catch (err: any) {
            setError('Ошибка инициализации привязки Telegram');
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                Социальные аккаунты
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#6b6f7e' }}>
                Привяжите социальные аккаунты для быстрого входа
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Card sx={{ bgcolor: '#212134' }}>
                <CardContent>
                    <List>
                        <ListItem
                            sx={{
                                borderBottom: '1px solid',
                                borderColor: '#282c34'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: '#db4437' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
                            </Box>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" sx={{ color: '#fff' }}>
                                            Google
                                        </Typography>
                                        {hasGoogleAccount && (
                                            <Chip
                                                label="Привязан"
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                                                    color: '#4caf50',
                                                    border: '1px solid #4caf50'
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    accounts.find(acc => acc.provider === 'google')?.provider_email || ''
                                }
                                secondaryTypographyProps={{ sx: { color: '#6b6f7e' } }}
                            />
                            <ListItemSecondaryAction>
                                {hasGoogleAccount ? (
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDelete('google')}
                                        sx={{ color: '#f44336' }}
                                        title="Отвязать Google аккаунт"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleLink('google')}
                                        sx={{
                                            borderColor: '#4a4a6a',
                                            color: '#fff',
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: '#db4437',
                                                bgcolor: 'rgba(219, 68, 55, 0.08)'
                                            }
                                        }}
                                    >
                                        Привязать
                                    </Button>
                                )}
                            </ListItemSecondaryAction>
                        </ListItem>

                        <ListItem
                            sx={{
                                borderBottom: '1px solid',
                                borderColor: '#282c34'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: '#fc0' }}>
                                <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10z" fill="#FC3F1D" /><path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.959l1.045.704-3.003 4.487H7.49l2.695-4.014c-1.55-1.111-2.42-2.19-2.42-4.015 0-2.288 1.595-3.85 4.62-3.85h3.003v11.868H13.32V7.666z" fill="#fff" /></svg>
                            </Box>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" sx={{ color: '#fff' }}>
                                            Яндекс
                                        </Typography>
                                        {hasYandexAccount && (
                                            <Chip
                                                label="Привязан"
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                                                    color: '#4caf50',
                                                    border: '1px solid #4caf50'
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    accounts.find(acc => acc.provider === 'yandex')?.provider_email || ''
                                }
                                secondaryTypographyProps={{ sx: { color: '#6b6f7e' } }}
                            />
                            <ListItemSecondaryAction>
                                {hasYandexAccount ? (
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDelete('yandex')}
                                        sx={{ color: '#f44336' }}
                                        title="Отвязать Яндекс аккаунт"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleLink('yandex')}
                                        sx={{
                                            borderColor: '#4a4a6a',
                                            color: '#fff',
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: '#fc0',
                                                bgcolor: 'rgba(255, 204, 0, 0.08)'
                                            }
                                        }}
                                    >
                                        Привязать
                                    </Button>
                                )}
                            </ListItemSecondaryAction>
                        </ListItem>

                        <ListItem>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: '#fff' }}>
                                <GitHubIcon />
                            </Box>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" sx={{ color: '#fff' }}>
                                            GitHub
                                        </Typography>
                                        {hasGitHubAccount && (
                                            <Chip
                                                label="Привязан"
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                                                    color: '#4caf50',
                                                    border: '1px solid #4caf50'
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    accounts.find(acc => acc.provider === 'github')?.provider_email || ''
                                }
                                secondaryTypographyProps={{ sx: { color: '#6b6f7e' } }}
                            />
                            <ListItemSecondaryAction>
                                {hasGitHubAccount ? (
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDelete('github')}
                                        sx={{ color: '#f44336' }}
                                        title="Отвязать GitHub аккаунт"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleLink('github')}
                                        sx={{
                                            borderColor: '#4a4a6a',
                                            color: '#fff',
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: '#fff',
                                                bgcolor: 'rgba(255, 255, 255, 0.08)'
                                            }
                                        }}
                                    >
                                        Привязать
                                    </Button>
                                )}
                            </ListItemSecondaryAction>
                        </ListItem>

                        <ListItem>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: '#0088cc' }}>
                                <TelegramIcon />
                            </Box>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" sx={{ color: '#fff' }}>
                                            Telegram
                                        </Typography>
                                        {hasTelegramAccount && (
                                            <Chip
                                                label="Привязан"
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                                                    color: '#4caf50',
                                                    border: '1px solid #4caf50'
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    accounts.find(acc => acc.provider === 'telegram')?.provider_username ||
                                    accounts.find(acc => acc.provider === 'telegram')?.provider_email || ''
                                }
                                secondaryTypographyProps={{ sx: { color: '#6b6f7e' } }}
                            />
                            <ListItemSecondaryAction>
                                {hasTelegramAccount ? (
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDelete('telegram')}
                                        sx={{ color: '#f44336' }}
                                        title="Отвязать Telegram аккаунт"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleLink('telegram')}
                                        sx={{
                                            borderColor: '#4a4a6a',
                                            color: '#fff',
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: '#0088cc',
                                                bgcolor: 'rgba(0, 136, 204, 0.08)'
                                            }
                                        }}
                                    >
                                        Привязать
                                    </Button>
                                )}
                            </ListItemSecondaryAction>
                        </ListItem>
                    </List>
                </CardContent>
            </Card>

            {hasTelegramAccount && (
                <Paper
                    sx={{
                        mt: 3,
                        p: 3,
                        bgcolor: '#1a1d2e',
                        border: '1px solid #0088cc33',
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #1a1d2e 0%, #212134 100%)'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{
                            bgcolor: '#0088cc22',
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <TelegramIcon sx={{ fontSize: 32, color: '#0088cc' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ color: '#fff', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                Telegram Бот FixDesk
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#a0a0b0', mb: 2 }}>
                                Теперь вы можете управлять воркспейсами, проектами и задачами прямо из Telegram!
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ color: '#0088cc', fontWeight: 600 }}>✓</Typography>
                                    <Typography variant="body2" sx={{ color: '#c0c0d0' }}>
                                        Создавайте воркспейсы и проекты
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ color: '#0088cc', fontWeight: 600 }}>✓</Typography>
                                    <Typography variant="body2" sx={{ color: '#c0c0d0' }}>
                                        Добавляйте задачи
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{
                                p: 2,
                                bgcolor: '#12141b',
                                borderRadius: 1.5,
                                border: '1px solid #282c34'
                            }}>
                                <Typography variant="body2" sx={{ color: '#a0a0b0', mb: 1, fontWeight: 600 }}>
                                    Как начать работу:
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#c0c0d0', mb: 0.5 }}>
                                    1. Найдите бота <Typography component="span" sx={{ color: '#0088cc', fontWeight: 600 }}>@fixdesk_bot</Typography> в Telegram
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#c0c0d0', mb: 0.5 }}>
                                    2. Отправьте команду <Typography component="span" sx={{ bgcolor: '#1a1d2e', px: 1, py: 0.25, borderRadius: 0.5, fontFamily: 'monospace' }}>/start</Typography>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#c0c0d0' }}>
                                    3. Используйте <Typography component="span" sx={{ bgcolor: '#1a1d2e', px: 1, py: 0.25, borderRadius: 0.5, fontFamily: 'monospace' }}>/menu</Typography> для доступа к функциям
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<TelegramIcon />}
                                    href="https://t.me/fixdesk_bot"
                                    target="_blank"
                                    sx={{
                                        bgcolor: '#0088cc',
                                        color: '#fff',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': {
                                            bgcolor: '#006699'
                                        }
                                    }}
                                >
                                    Открыть бота
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default SocialAccountsSettings;

