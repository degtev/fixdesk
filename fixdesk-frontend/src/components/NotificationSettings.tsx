import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Button, Switch, FormControlLabel } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface NotificationSettings {
    project_invitations: boolean;
    bug_assignments: boolean;
    bug_comments: boolean;
    comment_replies: boolean;
    bug_verification: boolean;
}

interface NotificationSettingsProps {
  isDialog?: boolean;
  onClose?: () => void;
}

const ACCENT_COLOR = '#7b79ff';

const StyledSwitch = (props: any) => (
  <Switch
    {...props}
    sx={{
      '& .MuiSwitch-switchBase.Mui-checked': {
        color: ACCENT_COLOR,
      },
      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: ACCENT_COLOR,
      },
      mr: 1.5,
    }}
  />
);

const NotificationSettings = forwardRef(({}, ref) => {
    const { token } = useAuth();
    const [settings, setSettings] = useState<NotificationSettings>({
        project_invitations: true,
        bug_assignments: true,
        bug_comments: true,
        comment_replies: true,
        bug_verification: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!token) {
            // navigate('/login'); 
            return;
        }
        fetchSettings();
    }, [token]); 

    const fetchSettings = async () => {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/auth/notification-settings`, config);

            if (response.data.success) {
                setSettings(response.data.settings);
            } else {
                console.error('Ошибка получения настроек уведомлений');
            }
        } catch (error: any) {
            console.error('Ошибка получения настроек уведомлений:', error);
            if (error.response?.status === 401) {
                // navigate('/login'); 
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (setting: keyof NotificationSettings) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/auth/notification-settings`, settings, config);

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Настройки уведомлений успешно обновлены!' });
            } else {
                setMessage({ type: 'error', text: response.data.message || 'Ошибка обновления настроек' });
            }
        } catch (error: any) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Ошибка соединения с сервером' 
            });
        } finally {
            setSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({
        save: handleSave,
        getSettings: () => settings
    }));

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                <Typography sx={{ color: '#cccccc' }}>Загрузка...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0 }}>
            <Typography sx={{ color: '#cccccc', fontSize: 13, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span style={{ fontSize: 16 }}>ℹ️</span> Эти настройки применяются ко всем вашим проектам и уведомлениям.
            </Typography>
            {message && (
                <Box sx={{
                    mb: 1,
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: message.type === 'success' ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
                    border: `1px solid ${message.type === 'success' ? '#4caf50' : '#f44336'}`
                }}>
                    <span style={{ fontSize: 18 }}>
                        {message.type === 'success' ? '✅' : '❌'}
                    </span>
                    <Typography sx={{ color: message.type === 'success' ? '#4caf50' : '#f44336', fontSize: 14, fontWeight: 500 }}>
                        {message.text}
                    </Typography>
                </Box>
            )}
            <FormControlLabel
                control={<StyledSwitch checked={settings.project_invitations} onChange={() => handleToggle('project_invitations')} />}
                label={<span style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>Приглашения в проекты</span>}
                sx={{
                  m: 0,
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                }}
            />
            <FormControlLabel
                control={<StyledSwitch checked={settings.bug_assignments} onChange={() => handleToggle('bug_assignments')} />}
                label={<span style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>Назначения</span>}
                sx={{ m: 0, px: 1, py: 0.5, borderRadius: 2}}
            />
            <FormControlLabel
                control={<StyledSwitch checked={settings.bug_comments} onChange={() => handleToggle('bug_comments')} />}
                label={<span style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>Комментарии</span>}
                sx={{ m: 0, px: 1, py: 0.5, borderRadius: 2}}
            />
            <FormControlLabel
                control={<StyledSwitch checked={settings.comment_replies} onChange={() => handleToggle('comment_replies')} />}
                label={<span style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>Ответы на комментарии</span>}
                sx={{ m: 0, px: 1, py: 0.5, borderRadius: 2}}
            />
            <FormControlLabel
                control={<StyledSwitch checked={settings.bug_verification} onChange={() => handleToggle('bug_verification')} />}
                label={<span style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>Проверка выполненнения</span>}
                sx={{ m: 0, px: 1, py: 0.5, borderRadius: 2}}
            />
        </Box>
    );
});

export default NotificationSettings; 