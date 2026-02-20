import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { authUtils } from '../../utils/auth';
import { Logo } from '../../components/LogoPage/Logo';
import { ProfileSettings } from '../../components/ProfileSettings/ProfileSettings';
import { NotificationSettings } from '../../components/NotificationSettings/NotificationSettings';
import { Dropdown } from '../../components/Dropdown/Dropdown';
import './Profile.css';

type TabType = 'notifications' | 'profile';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = authUtils.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userData = await api.getMe(token);
        setUser(userData);
      } catch (err) {
        authUtils.removeToken();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    authUtils.removeToken();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNavigateToWorkspaces = () => {
    navigate('/workspaces');
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const dropdownItems = [
    {
      label: 'Профиль',
      onClick: handleNavigateToProfile,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 17C3 14.2386 6.13401 12 10 12C13.866 12 17 14.2386 17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Воркспейсы',
      onClick: handleNavigateToWorkspaces,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Выход',
      onClick: handleLogout,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 3H4C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 14L14 10L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 10H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  const getAvatarUrl = () => {
    if (user?.avatar_url) {
      return user.avatar_url;
    }
    return `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=6467F2&color=fff&size=200`;
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-header-content">
          <Logo />
          <div 
            ref={avatarRef}
            className="profile-header-avatar"
            onClick={handleAvatarClick}
          >
            <img src={getAvatarUrl()} alt="Avatar" />
            <Dropdown
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              items={dropdownItems}
              anchorElement={avatarRef.current}
            />
          </div>
        </div>
      </header>

      <div className="profile-container">
        <h1 className="profile-title">Профиль</h1>

        <div className="profile-layout">
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Настройки профиля
            </button>
            <button
              className={`profile-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Настройки уведомлений
            </button>
            <button className="profile-logout-btn alert-btn" onClick={handleLogout}>
              Выйти
            </button>
          </div>

          <div className="profile-content">
            {activeTab === 'profile' && user && (
              <ProfileSettings user={user} onUserUpdate={handleUserUpdate} />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

