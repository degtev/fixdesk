import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { authUtils } from '../../utils/auth';
import { config } from '../../config/env';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import { TelegramAuth } from '../TelegramAuth/TelegramAuth';
import { useNotification } from '../NotificationProvider/NotificationProvider';
import './ProfileSettings.css';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  position?: string;
  avatar_url?: string;
  has_password?: boolean;
  is_deleted?: boolean;
  deletion_scheduled_at?: string;
}

interface SocialAccount {
  provider: string;
  provider_email?: string;
  provider_username?: string;
}

export const ProfileSettings: React.FC<{ user: User; onUserUpdate: (user: User) => void }> = ({ user, onUserUpdate }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [position, setPosition] = useState(user.position || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [restoringAccount, setRestoringAccount] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    loadSocialAccounts();
  }, []);

  const loadSocialAccounts = async () => {
    const token = authUtils.getToken();
    if (!token) return;

    try {
      setLoadingSocial(true);
      const response = await api.getSocialAccounts(token);
      setSocialAccounts(response.accounts || []);
    } catch (error) {
      console.error('Error loading social accounts:', error);
    } finally {
      setLoadingSocial(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification('Выберите изображение', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification('Размер файла не должен превышать 5MB', 'error');
      return;
    }

    const token = authUtils.getToken();
    if (!token) return;

    try {
      setUploadingAvatar(true);

      const uploadResponse = await api.uploadAvatar(token, file);

      const updateResponse = await api.updateProfile(token, {
        first_name: firstName,
        last_name: lastName,
        position: position || undefined,
        avatar_url: uploadResponse.url,
      });

      if (updateResponse.user) {
        onUserUpdate({
          ...updateResponse.user,
          has_password: user.has_password
        });
        addNotification('Аватар успешно загружен', 'success');
      }
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Ошибка загрузки аватара', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    const token = authUtils.getToken();
    if (!token) return;

    try {
      setRemovingAvatar(true);

      const response = await api.updateProfile(token, {
        first_name: firstName,
        last_name: lastName,
        position: position || undefined,
        avatar_url: undefined,
      });

      if (response.user) {
        onUserUpdate({
          ...response.user,
          has_password: user.has_password
        });
        addNotification('Аватар успешно удален', 'success');
      }
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Ошибка удаления аватара', 'error');
    } finally {
      setRemovingAvatar(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = authUtils.getToken();
    if (!token) return;

    if (!firstName.trim() || !lastName.trim()) {
      addNotification('Имя и фамилия обязательны', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      const response = await api.updateProfile(token, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        position: position.trim() || undefined,
        avatar_url: user.avatar_url,
      });

      if (response.user) {
        onUserUpdate({
          ...response.user,
          has_password: user.has_password
        });
        addNotification('Профиль обновлен', 'success');
      }
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Ошибка обновления', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = authUtils.getToken();
    if (!token) return;

    if (newPassword.length < 6) {
      addNotification('Пароль должен содержать минимум 6 символов', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addNotification('Пароли не совпадают', 'error');
      return;
    }

    if (user.has_password && !currentPassword) {
      addNotification('Введите текущий пароль', 'error');
      return;
    }

    try {
      setSavingPassword(true);
      await api.changePassword(token, user.has_password ? currentPassword : null, newPassword);

      if (!user.has_password) {
        onUserUpdate({
          ...user,
          has_password: true
        });
      }

      addNotification(user.has_password ? 'Пароль изменен' : 'Пароль установлен', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Ошибка изменения пароля', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUnlinkSocial = async (provider: string) => {
    const token = authUtils.getToken();
    if (!token) return;

    if (!confirm(`Отвязать ${getProviderName(provider)}?`)) return;

    try {
      await api.unlinkSocialAccount(token, provider);
      addNotification(`${getProviderName(provider)} отвязан`, 'success');
      loadSocialAccounts();
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Ошибка отвязки', 'error');
    }
  };

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmText('');
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  const handleRestoreAccount = async () => {
    const token = authUtils.getToken();
    if (!token) return;

    try {
      setRestoringAccount(true);
      await api.restoreAccount(token);

      onUserUpdate({
        ...user,
        is_deleted: false,
        deletion_scheduled_at: undefined
      });

      addNotification('Аккаунт успешно восстановлен!', 'success');
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Ошибка восстановления аккаунта', 'error');
    } finally {
      setRestoringAccount(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'УДАЛИТЬ') {
      return;
    }

    const token = authUtils.getToken();
    if (!token) return;

    try {
      setDeletingAccount(true);
      const response = await api.deleteAccount(token);

      addNotification(response.message || 'Аккаунт помечен на удаление. У вас есть 30 дней для восстановления.', 'success');

      handleCloseDeleteModal();

      setTimeout(() => {
        authUtils.removeToken();
        navigate('/login');
      }, 2000);
    } catch (error) {
      addNotification(error instanceof Error ? error.message : 'Ошибка удаления аккаунта', 'error');
      setDeletingAccount(false);
      handleCloseDeleteModal();
    }
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      google: 'Google',
      yandex: 'Yandex',
      github: 'GitHub',
      telegram: 'Telegram',
    };
    return names[provider] || provider;
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14.9 8.16101C14.9 7.68501 14.861 7.20701 14.779 6.73901H8.13904V9.43401H11.941C11.8626 9.86529 11.6975 10.2762 11.4556 10.6418C11.2138 11.0074 10.9003 11.3201 10.534 11.561V13.311H12.803C14.135 12.091 14.9 10.291 14.9 8.16101Z" fill="#B2B8CD" />
            <path d="M8.13998 15C10.038 15 11.639 14.38 12.805 13.31L10.537 11.561C9.90598 11.988 9.09098 12.23 8.14198 12.23C6.30598 12.23 4.74898 10.998 4.18998 9.34201H1.84998V11.145C2.43958 12.3062 3.33956 13.2813 4.44994 13.9618C5.56033 14.6423 6.83764 15.0017 8.13998 15Z" fill="#B2B8CD" />
            <path d="M4.18697 9.34201C3.89208 8.47301 3.89208 7.53101 4.18697 6.66201V4.85901H1.84897C1.35661 5.83356 1.1001 6.91015 1.1001 8.00201C1.1001 9.09387 1.35661 10.1705 1.84897 11.145L4.18697 9.34201Z" fill="#B2B8CD" />
            <path d="M8.13998 3.76999C9.1426 3.75373 10.1118 4.13062 10.84 4.81999L12.85 2.82099C11.5725 1.63105 9.88564 0.979209 8.13998 1.00099C6.83728 0.999336 5.55966 1.35907 4.4492 2.04017C3.33875 2.72127 2.43898 3.69705 1.84998 4.85899L4.18598 6.65999C4.74198 5.00199 6.30198 3.76999 8.13798 3.76999H8.13998Z" fill="#B2B8CD" />
          </svg>
        );
      case 'yandex':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M8.79783 10.866L6.02235 16.9993H4L7.04775 10.4433C5.61598 9.72733 4.66035 8.43133 4.66035 6.034C4.65696 2.678 6.81747 1 9.38706 1H12V17H10.2513V10.8667L8.79783 10.866ZM10.2519 2.45267H9.31866C7.90992 2.45267 6.54385 3.37133 6.54385 6.034C6.54385 8.606 7.79479 9.434 9.31866 9.434H10.2519V2.45267Z" fill="#B2B8CD" />
          </svg>
        );
      case 'github':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6.19459 14V12.2938L6.21704 11.0813C6.24401 10.7041 6.39097 10.3485 6.63275 10.0733C6.63629 10.0693 6.63985 10.0653 6.64344 10.0613C6.65277 10.0509 6.64663 10.0341 6.63275 10.0323C5.01707 9.83067 3.33371 9.14847 3.33371 6.17833C3.32318 5.44681 3.56184 4.73765 4.00295 4.18143C4.01839 4.16198 4.03406 4.14271 4.04999 4.12363C4.07071 4.0988 4.07749 4.06515 4.068 4.03423C4.06742 4.03235 4.06685 4.03047 4.06627 4.02859C4.05551 3.99327 4.0454 3.95777 4.03596 3.92214C3.87381 3.30983 3.90867 2.65575 4.13689 2.06545C4.13857 2.06109 4.14027 2.05674 4.14197 2.05239C4.15049 2.03066 4.16838 2.01405 4.19136 2.00995C4.33463 1.98441 4.91361 1.95023 6.02203 2.71564C6.05653 2.73946 6.09153 2.76406 6.12706 2.78945C6.15271 2.80779 6.18533 2.81341 6.21567 2.80477L6.21853 2.80395C6.27803 2.78704 6.3377 2.77099 6.39749 2.7558C7.45111 2.48817 8.54897 2.48817 9.60257 2.7558C9.65931 2.7702 9.71584 2.78538 9.77231 2.80133L9.77597 2.80237C9.81164 2.81248 9.84997 2.80588 9.88017 2.78435C9.91324 2.76076 9.94584 2.73786 9.97804 2.71564C11.0838 1.95184 11.6596 1.98427 11.8036 2.00979C11.827 2.01395 11.8452 2.03085 11.854 2.05297C11.8552 2.05582 11.8562 2.05866 11.8574 2.06151C12.0894 2.65207 12.1263 3.30809 11.964 3.92214C11.9544 3.95874 11.944 3.9952 11.9329 4.03149C11.9229 4.06412 11.9301 4.09961 11.9519 4.12583L11.954 4.1283C11.9686 4.14585 11.983 4.16356 11.9971 4.18143C12.4382 4.73765 12.6769 5.44681 12.6664 6.17833C12.6664 9.16467 10.971 9.829 9.34764 10.01C9.33824 10.011 9.33404 10.0223 9.34037 10.0293C9.34277 10.0319 9.34524 10.0346 9.34764 10.0373C9.51144 10.2197 9.63851 10.4363 9.72077 10.6735C9.80677 10.9216 9.84177 11.1865 9.82344 11.4503V14" stroke="#B2B8CD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.66663 11.3333C2.91273 11.3682 3.14769 11.4589 3.35373 11.5983C3.55976 11.7379 3.73147 11.9225 3.85583 12.1385C3.9615 12.3308 4.10397 12.5003 4.27505 12.6371C4.44614 12.774 4.64249 12.8757 4.85282 12.9362C5.06315 12.9968 5.28332 13.0151 5.50071 12.99C5.71809 12.965 5.92841 12.8971 6.1196 12.7903" stroke="#B2B8CD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'telegram':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M3.85836 9.34642C3.88754 9.35629 3.91699 9.36322 3.94642 9.36749C3.97851 9.44295 4.01997 9.54049 4.06835 9.65455C4.18639 9.93295 4.34545 10.3096 4.50964 10.7024C4.84447 11.5035 5.18221 12.3293 5.25681 12.5657C5.34915 12.8579 5.44675 13.0566 5.55331 13.1922C5.6084 13.2624 5.67213 13.3236 5.74669 13.37C5.78422 13.3933 5.82387 13.4124 5.86525 13.4267C5.86708 13.4274 5.8689 13.428 5.87072 13.4286C6.08407 13.5091 6.27857 13.4756 6.40035 13.4346C6.46551 13.4126 6.51823 13.3861 6.5556 13.3646C6.57465 13.3536 6.59075 13.3434 6.60359 13.3348L6.60661 13.3328L8.49073 12.1578L10.6671 13.8263C10.6992 13.8509 10.7343 13.8716 10.7713 13.8878C11.0328 14.0018 11.286 14.0416 11.5241 14.0091C11.7619 13.9766 11.9507 13.8768 12.0912 13.7643C12.2288 13.6542 12.3221 13.5309 12.3802 13.4393C12.4099 13.3925 12.4321 13.3511 12.4479 13.3194C12.4557 13.3035 12.4621 13.2898 12.467 13.2788L12.4733 13.2642L12.4757 13.2585L12.4767 13.2561L12.4771 13.255L12.4775 13.2539C12.4889 13.2253 12.4977 13.1957 12.5037 13.1655L14.4905 3.14851C14.4969 3.11648 14.5001 3.08389 14.5001 3.05123C14.5001 2.75789 14.3895 2.47896 14.1297 2.3097C13.9075 2.16503 13.6601 2.15881 13.5037 2.17067C13.335 2.18348 13.1792 2.22513 13.0747 2.2584C13.0203 2.27572 12.9746 2.29243 12.9417 2.30517C12.9252 2.31158 12.9117 2.31708 12.9015 2.32127L12.894 2.32446L1.7515 6.69549L1.75006 6.69602C1.74296 6.69862 1.73384 6.70202 1.72301 6.70622C1.70143 6.71462 1.67252 6.72642 1.63875 6.74175C1.5729 6.77162 1.48051 6.81822 1.38571 6.88315C1.23425 6.98689 0.885921 7.27095 0.944574 7.73982C0.991368 8.11389 1.24762 8.34362 1.40375 8.45409C1.48947 8.51475 1.57092 8.55809 1.63023 8.58635C1.65775 8.59942 1.71488 8.62262 1.73967 8.63275L1.74593 8.63529L3.85836 9.34642ZM13.2839 3.24526L13.2824 3.24594C13.2768 3.24835 13.2713 3.25066 13.2656 3.25287L2.1096 7.62922C2.10377 7.63149 2.09791 7.63369 2.092 7.63575L2.08579 7.63809C2.07865 7.64089 2.06664 7.64575 2.05156 7.65255C2.04301 7.65642 2.03408 7.66069 2.02498 7.66522C2.03748 7.67229 2.04945 7.67835 2.06008 7.68342C2.07029 7.68829 2.07807 7.69162 2.08233 7.69335L4.17742 8.39869C4.21577 8.41162 4.25151 8.42869 4.28433 8.44935L11.2022 4.39967L11.2087 4.39585C11.2137 4.39287 11.2203 4.38904 11.2283 4.38455C11.244 4.37565 11.2656 4.36381 11.2913 4.35071C11.3393 4.32627 11.4162 4.29 11.5027 4.26325C11.5629 4.24463 11.7406 4.19217 11.9327 4.25378C12.0512 4.2918 12.1739 4.37354 12.2538 4.51201C12.2934 4.5808 12.3145 4.64991 12.3248 4.71317C12.352 4.81282 12.3477 4.91123 12.3264 4.99618C12.2805 5.17919 12.152 5.32193 12.035 5.43112C11.9347 5.52473 10.6378 6.77529 9.3584 8.00982C8.72033 8.62542 8.08887 9.23502 7.6168 9.69062L7.3068 9.98995L11.2214 12.9912C11.3112 13.0233 11.3643 13.0217 11.3888 13.0183C11.4181 13.0143 11.442 13.003 11.4665 12.9835C11.4938 12.9616 11.5177 12.932 11.5356 12.9038L11.5363 12.9027L13.4633 3.18737C13.4347 3.19424 13.4058 3.20243 13.3779 3.21129C13.3464 3.22134 13.3203 3.23091 13.3031 3.2376C13.2945 3.24091 13.2884 3.24343 13.2851 3.24481L13.2839 3.24526ZM7.64307 11.5079L6.86207 10.9091L6.67287 12.1129L7.64307 11.5079ZM6.14564 9.72095L6.92227 8.97115C7.39433 8.51549 8.02594 7.90589 8.66407 7.29015L9.3124 6.66469L4.96569 9.20922L4.98901 9.26422C5.10747 9.54362 5.26725 9.92182 5.4323 10.3168C5.55572 10.612 5.68478 10.923 5.80233 11.2108L5.99102 10.0106C6.00921 9.89482 6.06574 9.79469 6.14564 9.72095Z" fill="#B2B8CD" />
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
          </svg>
        );
    }
  };

  const isSocialLinked = (provider: string) => {
    return socialAccounts.some(acc => acc.provider === provider);
  };

  const [showTelegramAuth, setShowTelegramAuth] = useState(false);

  const handleLinkSocial = (provider: string) => {
    if (provider === 'telegram') {
      setShowTelegramAuth(true);
      return;
    }

    let authUrl = '';
    switch (provider) {
      case 'google':
        authUrl = api.getGoogleAuthUrl();
        break;
      case 'yandex':
        authUrl = api.getYandexAuthUrl();
        break;
      case 'github':
        authUrl = api.getGithubAuthUrl();
        break;
    }

    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  const handleTelegramAuthSuccess = () => {
    setShowTelegramAuth(false);
    addNotification('Telegram аккаунт успешно привязан', 'success');
    loadSocialAccounts();
    const token = authUtils.getToken();
    if (token) {
      api.getMe(token)
        .then(userData => {
          if (userData.user) {
            onUserUpdate({
              ...userData.user,
              has_password: user.has_password
            });
          }
        })
        .catch(error => {
          console.error('Ошибка при обновлении данных пользователя:', error);
        });
    }
  };

  const handleTelegramAuthError = (error: string) => {
    setShowTelegramAuth(false);
    addNotification(`Ошибка привязки Telegram: ${error}`, 'error');
  };

  const handleTelegramAuthClose = () => {
    setShowTelegramAuth(false);
  };
  const telegramAccount = socialAccounts.find(acc => acc.provider === 'telegram');

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-settings">
      {user.is_deleted && (
        <div className="deleted-account-banner">
          <div className="deleted-account-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="deleted-account-content">
            <div className="deleted-account-text">
              <h4>Ваш аккаунт помечен на удаление</h4>
              <p>
                Аккаунт будет окончательно удален <strong>{formatDate(user.deletion_scheduled_at)}</strong>.
                {' '}У вас еще есть время для восстановления доступа.
              </p>
            </div>
            <Button
              onClick={handleRestoreAccount}
              disabled={restoringAccount}
              className="restore-account-btn"
            >
              {restoringAccount ? 'Восстановление...' : 'Восстановить аккаунт'}
            </Button>
          </div>
        </div>
      )}

      <div className="profile-settings-section">
        <h3 className="profile-settings-section-title">Основная информация</h3>

        <div className="avatar-upload-section">
          <div className="avatar-preview">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=6467F2&color=fff&size=200`}
              alt="Avatar"
            />
            {uploadingAvatar && (
              <div className="avatar-upload-overlay">
                <div className="avatar-upload-spinner"></div>
              </div>
            )}
          </div>
          <div className="avatar-upload-actions">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
                className="avatar-file-input"
                id="avatar-upload"
              />
            </div>

            <p className="avatar-upload-hint">JPG, PNG или GIF. Максимум 5MB</p>

            <div className="avatar-upload-btns">
              <label htmlFor="avatar-upload" className="btn btn-primary">
                {uploadingAvatar ? 'Загрузка...' : 'Изменить аватар'}
              </label>

              {user.avatar_url && user.avatar_url.startsWith('http') && (
                <Button
                  variant="secondary"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar || removingAvatar}
                  className="remove-avatar-btn"
                >
                  {removingAvatar ? 'Удаление...' : 'Удалить аватар'}
                </Button>
              )}
            </div>

          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="profile-settings-form">
          <Input
            type="text"
            label="Имя"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            type="text"
            label="Фамилия"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <Input
            type="text"
            label="Должность"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />

          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </form>
      </div>

      <div className="profile-settings-section">
        <h3 className="profile-settings-section-title">Email</h3>
        <Input
          type="email"
          value={user.email}
          disabled
        />
        <p className="profile-settings-hint">Email не может быть изменен</p>
      </div>

      <div className="profile-settings-section">
        <h3 className="profile-settings-section-title">
          {user.has_password ? 'Изменение пароля' : 'Установка пароля'}
        </h3>
        <form onSubmit={handlePasswordChange} className="profile-settings-form">
          {user.has_password && (
            <Input
              type="password"
              label="Текущий пароль"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          )}
          <Input
            type="password"
            label="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            type="password"
            label="Подтверждение пароля"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />


          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? 'Сохранение...' : user.has_password ? 'Изменить пароль' : 'Установить пароль'}
          </Button>
        </form>
      </div>

      <div className="profile-settings-section">
        <h3 className="profile-settings-section-title">Привязанные аккаунты</h3>
        {loadingSocial ? (
          <p className="profile-settings-loading">Загрузка...</p>
        ) : (
          <div className="social-accounts-list">
            {['google', 'yandex', 'github', 'telegram'].map(provider => {
              const linked = isSocialLinked(provider);
              return (
                <div key={provider} className="social-account-item">
                  <div className="social-account-info">
                    <span className="social-account-icon">{getProviderIcon(provider)}</span>
                    <span className="social-account-name">{getProviderName(provider)}</span>
                    {linked && <span className="social-account-status">Привязан</span>}
                  </div>
                  {linked ? (
                    <Button
                      variant="secondary"
                      onClick={() => handleUnlinkSocial(provider)}
                      className="social-account-btn"
                    >
                      Отвязать
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => handleLinkSocial(provider)}
                      className="social-account-btn"
                    >
                      Привязать
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showTelegramAuth && (
        <Modal
          isOpen={true}
          onClose={handleTelegramAuthClose}
          title="Привязка Telegram аккаунта"
        >
          <div className="telegram-auth-modal-content">
            <p>Открывается окно авторизации Telegram. Пожалуйста, подтвердите привязку аккаунта.</p>
            <TelegramAuth
              onSuccess={handleTelegramAuthSuccess}
              onError={handleTelegramAuthError}
              onClose={handleTelegramAuthClose}
            />
          </div>
        </Modal>
      )}

      {telegramAccount && (
        <div className="profile-settings-section telegram-info">
          <h3 className="profile-settings-section-title">Telegram бот</h3>
          <p className="telegram-info-text">
            Ваш аккаунт привязан к Telegram боту <strong>@{config.telegram.botUsername}</strong>
          </p>
          <p className="telegram-info-text">
            Вы можете управлять проектами и задачами прямо из Telegram, используя команду <code>/menu</code>
          </p>
        </div>
      )}

      <div className="profile-settings-section danger-zone">
        <h3 className="profile-settings-section-title">Опасная зона</h3>
        <p className="profile-settings-danger-text">
          Удаление аккаунта - это необратимое действие. Ваш аккаунт будет помечен для удаления и окончательно удален через 30 дней. В течение этого времени вы можете восстановить его.
        </p>
        <Button
          variant="secondary"
          onClick={handleOpenDeleteModal}
          disabled={deletingAccount}
          className="delete-account-btn"
        >
          Удалить аккаунт
        </Button>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title="Удаление аккаунта"
      >
        <div className="delete-modal-content">

          <h3 className="delete-modal-title">Вы действительно хотите удалить аккаунт?</h3>

          <div className="delete-modal-info">
            <p><strong>Что произойдет:</strong></p>
            <ul>
              <li>Ваш аккаунт будет помечен для удаления</li>
              <li>У вас будет <strong>30 дней</strong> для восстановления доступа</li>
              <li>После этого все данные будут удалены безвозвратно</li>
              <li>Будут удалены все ваши проекты, задачи и комментарии</li>
              <li>Отвязаны все социальные сети</li>
            </ul>

            <p className="delete-modal-restore">
              Для восстановления аккаунта в течение 30 дней просто войдите в систему используя свой email и пароль и нажмите кнопку "Восстановить аккаунт".
            </p>
          </div>

          <div className="delete-modal-confirm">
            <p className="delete-modal-confirm-label">
              Для подтверждения введите <strong>УДАЛИТЬ</strong> в поле ниже:
            </p>
            <Input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Введите УДАЛИТЬ"
              disabled={deletingAccount}
              autoComplete="off"
            />
          </div>

          <div className="delete-modal-actions">
            <Button
              variant="secondary"
              onClick={handleCloseDeleteModal}
              disabled={deletingAccount}
            >
              Отмена
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirmText !== 'УДАЛИТЬ'}
              className="delete-account-btn"
            >
              {deletingAccount ? 'Удаление...' : 'Удалить аккаунт'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

