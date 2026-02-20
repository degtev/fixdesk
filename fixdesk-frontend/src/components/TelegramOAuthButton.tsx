import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';
import axios from 'axios';

interface TelegramOAuthButtonProps {
    action?: 'login' | 'register';
    onAuth?: (telegramData: any) => void;
}

const TelegramOAuthButton: React.FC<TelegramOAuthButtonProps> = ({ action = 'login', onAuth }) => {
    const [botId, setBotId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    useEffect(() => {
        const fetchBotId = async () => {
            try {
                const response = await axios.get(`${backendUrl}/oauth/telegram/bot-id`);
                setBotId(response.data.botId);
            } catch (error) {
                console.error('Error fetching bot ID:', error);
            }
        };

        fetchBotId();
    }, [backendUrl]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
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
                if (onAuth) {
                    onAuth(telegramData);
                }
                setLoading(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onAuth]);

    const handleTelegramLogin = () => {
        if (!botId) {
            alert('Telegram Bot ID не настроен. Обратитесь к администратору.');
            return;
        }

        setLoading(true);

        const origin = window.location.origin;
        const authUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&request_access=write`;

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
            alert('Не удалось открыть окно авторизации. Пожалуйста, разрешите всплывающие окна.');
            setLoading(false);
            return;
        }

        const checkClosed = setInterval(() => {
            if (popup?.closed) {
                setLoading(false);
                clearInterval(checkClosed);
            }
        }, 1000);

        setTimeout(() => {
            if (popup && !popup.closed) {
                popup.close();
            }
            setLoading(false);
            clearInterval(checkClosed);
        }, 300000);
    };

    return (
        <Button
            fullWidth
            variant="outlined"
            startIcon={<TelegramIcon />}
            onClick={handleTelegramLogin}
            disabled={loading || !botId}
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
                    borderColor: '#0088cc',
                    bgcolor: 'rgba(0, 136, 204, 0.08)'
                },
                '&:disabled': {
                    color: '#6b6f7e',
                    borderColor: '#282c34'
                },

            }}
        >
            {loading ? 'Входим...' : (action === 'login' ? 'Telegram' : 'Telegram')}
        </Button>
    );
};

export default TelegramOAuthButton;

