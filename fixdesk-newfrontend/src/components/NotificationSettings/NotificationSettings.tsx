import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { authUtils } from '../../utils/auth';
import { Toggle } from '../Toggle/Toggle';
import { Button } from '../Button/Button';
import { useNotification } from '../NotificationProvider/NotificationProvider';
import './NotificationSettings.css';

interface NotificationSettingsState {
  project_invitations: boolean;
  bug_assignments: boolean;
  bug_comments: boolean;
  comment_replies: boolean;
  bug_verification: boolean;
}

export const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettingsState>({
    project_invitations: true,
    bug_assignments: true,
    bug_comments: true,
    comment_replies: true,
    bug_verification: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { addNotification } = useNotification();

  useEffect(() => {
    loadSettings();
 }, []);

  const loadSettings = async () => {
    const token = authUtils.getToken();
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.getNotificationSettings(token);
      if (response.settings) {
        setSettings({
          project_invitations: response.settings.project_invitations ?? true,
          bug_assignments: response.settings.bug_assignments ?? true,
          bug_comments: response.settings.bug_comments ?? true,
          comment_replies: response.settings.comment_replies ?? true,
          bug_verification: response.settings.bug_verification ?? true,
        });
      }
    } catch (error) {
      addNotification('Ошибка загрузки настроек', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    const token = authUtils.getToken();
    if (!token) return;

    try {
      setSaving(true);
      await api.updateNotificationSettings(token, settings);
      addNotification('Настройки сохранены', 'success');
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="notification-settings-loading">Загрузка...</div>;
  }

  return (
    <div className="notification-settings">
      <h3 className="notification-settings-title">Email уведомления</h3>
      <p className="notification-settings-description">
        Выберите, о каких событиях вы хотите получать уведомления на email
      </p>

      <div className="notification-settings-list">
        <div className="notification-setting-item">
          <div className="notification-setting-info">
            <h4>Приглашения в проекты</h4>
            <p>Уведомления о добавлении вас в новые проекты</p>
          </div>
          <Toggle
            checked={settings.project_invitations}
            onChange={() => handleToggle('project_invitations')}
            disabled={saving}
          />
        </div>

        <div className="notification-setting-item">
          <div className="notification-setting-info">
            <h4>Назначение задач</h4>
            <p>Уведомления о назначенных вам задачах</p>
          </div>
          <Toggle
            checked={settings.bug_assignments}
            onChange={() => handleToggle('bug_assignments')}
            disabled={saving}
          />
        </div>

        <div className="notification-setting-item">
          <div className="notification-setting-info">
            <h4>Комментарии к задачам</h4>
            <p>Уведомления о новых комментариях к вашим задачам</p>
          </div>
          <Toggle
            checked={settings.bug_comments}
            onChange={() => handleToggle('bug_comments')}
            disabled={saving}
          />
        </div>

        <div className="notification-setting-item">
          <div className="notification-setting-info">
            <h4>Ответы на комментарии</h4>
            <p>Уведомления об ответах на ваши комментарии</p>
          </div>
          <Toggle
            checked={settings.comment_replies}
            onChange={() => handleToggle('comment_replies')}
            disabled={saving}
          />
        </div>

        <div className="notification-setting-item">
          <div className="notification-setting-info">
            <h4>Проверка задач</h4>
            <p>Уведомления о необходимости проверить выполненную задачу</p>
          </div>
          <Toggle
            checked={settings.bug_verification}
            onChange={() => handleToggle('bug_verification')}
            disabled={saving}
          />
        </div>
      </div>

      <div className="notification-settings-actions">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </div>
    </div>
  );
};

