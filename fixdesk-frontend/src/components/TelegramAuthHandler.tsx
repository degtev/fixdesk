import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const TelegramAuthHandler: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    useEffect(() => {
        const handleTelegramAuth = async (event: MessageEvent) => {
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
                try {
                    const response = await axios.post(`${backendUrl}/oauth/telegram/callback`, telegramData);

                    if (response.data.success) {
                        login(response.data.token);
                        navigate('/', { replace: true });
                    }
                } catch (err: any) {
                    const errorMsg = err.response?.data?.message || 'Ошибка авторизации через Telegram';
                    alert(errorMsg);
                }
            }
        };

        window.addEventListener('message', handleTelegramAuth);
        return () => {
            window.removeEventListener('message', handleTelegramAuth);
        };
    }, [navigate, login, backendUrl]);

    return null;
};

export default TelegramAuthHandler;

