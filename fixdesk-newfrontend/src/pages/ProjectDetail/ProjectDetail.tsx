import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Tooltip } from '../../components/Tooltip/Tooltip';
import { Dropdown } from '../../components/Dropdown';
import { Logo } from '../../components/LogoPage/Logo';
import './ProjectDetail.css';

interface Project {
  id: number;
  uuid: string;
  name: string;
  description: string;
  icon_url: string;
  created_by: number;
  workspace_id?: number;
  workspace_uuid?: string;
  created_at: string;
  item_name_singular?: string;
  item_name_nominative?: string;
  item_name_genitive?: string;
  item_name_accusative?: string;
  custom_statuses?: any[];
  custom_priorities?: any[];
  bug_list_count?: number;
  bug_list_closed_count?: number;
  member_count?: number;
}

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface BugList {
  id: number;
  uuid: string;
  project_id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_by: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  creator_first_name: string;
  creator_last_name: string;
  assignee_first_name?: string;
  assignee_last_name?: string;
}

export const ProjectDetail: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [bugs, setBugs] = useState<BugList[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [error, setError] = useState('');
  const profileAvatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token && uuid) {
      fetchProjectDetails();
      fetchUserData();
    }
  }, [token, uuid]);

  const fetchUserData = async () => {
    try {
      const userData = await api.getMe(token!);
      setUser(userData);
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const projectData = await api.getProjectByUUID(token!, uuid!);
      setProject(projectData);
      const projectBugs = await api.getProjectBugs(token!, uuid!);
      setBugs(projectBugs);
    } catch (error) {
      console.error('Ошибка при загрузке данных проекта:', error);
      setError('Не удалось загрузить данные проекта');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="project-detail-page">
        <aside className="sidebar">
          <div className="sidebar-header">
            <Logo />
          </div>

          <div className="sidebar-content">
            <div>
              <h3>Недавние воркспейсы</h3>
              <p>Загрузка...</p>
            </div>

            <div>
              <h3>Недавние проекты</h3>
              <p>Загрузка...</p>
            </div>
          </div>

          <div className="sidebar-footer">
            <div
              ref={profileAvatarRef}
              className="profile-sidebar-avatar"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <img
                src={user ?
                  (user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=6467F2&color=fff&size=200`)
                  : "https://via.placeholder.com/40"}
                alt="Аватар профиля"
                className="avatar-img"
              />
              <Dropdown
                isOpen={showProfileDropdown}
                onClose={() => setShowProfileDropdown(false)}
                items={[
                  {
                    label: 'Профиль',
                    onClick: () => navigate('/profile'),
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M3 17C3 14.2386 6.13401 12 10 12C13.866 12 17 14.2386 17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                  {
                    label: 'Воркспейсы',
                    onClick: () => navigate('/workspaces'),
                    icon: (
                      <svg width="20" height="20" viewBox="0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                  {
                    label: 'Выход',
                    onClick: () => {
                      logout();
                      navigate('/login');
                    },
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 3H4C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M10 14L14 10L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 10H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                ]}
                anchorElement={profileAvatarRef.current || undefined}
              />
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="loading">Загрузка проекта...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-detail-page">
        <aside className="sidebar">
          <div className="sidebar-header">
            <Logo />
          </div>

          <div className="sidebar-content">
            <div>
              <h3>Недавние воркспейсы</h3>
              <p>Загрузка...</p>
            </div>

            <div>
              <h3>Недавние проекты</h3>
              <p>Загрузка...</p>
            </div>
          </div>

          <div className="sidebar-footer">
            <div
              ref={profileAvatarRef}
              className="profile-sidebar-avatar"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <img
                src={user ?
                  (user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=6467F2&color=fff&size=200`)
                  : "https://via.placeholder.com/40"}
                alt="Аватар профиля"
                className="avatar-img"
              />
              <Dropdown
                isOpen={showProfileDropdown}
                onClose={() => setShowProfileDropdown(false)}
                items={[
                  {
                    label: 'Профиль',
                    onClick: () => navigate('/profile'),
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M3 17C3 14.2386 6.13401 12 10 12C13.866 12 17 14.2386 17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                  {
                    label: 'Воркспейсы',
                    onClick: () => navigate('/workspaces'),
                    icon: (
                      <svg width="20" height="20" viewBox="0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                  {
                    label: 'Выход',
                    onClick: () => {
                      logout();
                      navigate('/login');
                    },
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 3H4C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M10 14L14 10L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 10H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                ]}
                anchorElement={profileAvatarRef.current || undefined}
              />
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="error">{error}</div>
        </main>
      </div>
    );
  }

  if (!project || !uuid) {
    return (
      <div className="project-detail-page">
        <aside className="sidebar">
          <div className="sidebar-header">
            <Logo />
          </div>

          <div className="sidebar-content">
            <div>
              <h3>Недавние воркспейсы</h3>
              <p>Загрузка...</p>
            </div>

            <div>
              <h3>Недавние проекты</h3>
              <p>Загрузка...</p>
            </div>
          </div>

          <div className="sidebar-footer">
            <div
              ref={profileAvatarRef}
              className="profile-sidebar-avatar"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <img
                src={user ?
                  (user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=6467F2&color=fff&size=200`)
                  : "https://via.placeholder.com/40"}
                alt="Аватар профиля"
                className="avatar-img"
              />
              <Dropdown
                isOpen={showProfileDropdown}
                onClose={() => setShowProfileDropdown(false)}
                items={[
                  {
                    label: 'Профиль',
                    onClick: () => navigate('/profile'),
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M3 17C3 14.2386 6.13401 12 10 12C13.866 12 17 14.2386 17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                  {
                    label: 'Воркспейсы',
                    onClick: () => navigate('/workspaces'),
                    icon: (
                      <svg width="20" height="20" viewBox="0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                  {
                    label: 'Выход',
                    onClick: () => {
                      logout();
                      navigate('/login');
                    },
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 3H4C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M10 14L14 10L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 10H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                ]}
                anchorElement={profileAvatarRef.current || undefined}
              />
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="error">Проект не найден</div>
        </main>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Logo />
        </div>

        <div className="sidebar-content">
          <div>
            <h3>Навигация</h3>
            <nav className="navigation-menu">
              <button
                className="nav-item"
                onClick={() => navigate(`/project/${project.uuid}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Обзор</span>
              </button>
              <button
                className="nav-item"
                onClick={() => navigate(`/project/${project.uuid}/bugs`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>
                  {project.item_name_nominative || 'Задачи'}
                  {bugs.length > 0 && <span className="badge">{bugs.length}</span>}
                </span>
              </button>
              <button
                className="nav-item"
                onClick={() => navigate(`/project/${project.uuid}/settings`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 .99 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1 .99 1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-.99z" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>Настройки</span>
              </button>
            </nav>
          </div>

          <div>
            <h3>Список {project.item_name_nominative || 'задач'}</h3>
            {bugs.length > 0 ? (
              <div className="bugs-list">
                {bugs.slice(0, 5).map(bug => (
                  <div
                    key={bug.uuid}
                    className="bug-item"
                    onClick={() => navigate(`/project/${project.uuid}/bug/${bug.uuid}`)}
                  >
                    <div className="bug-status" style={{ backgroundColor: getStatusColor(bug.status) }}></div>
                    <div className="bug-info">
                      <div className="bug-title">{bug.title}</div>
                      <div className="bug-meta">
                        <span>{bug.priority}</span>
                        <span>{new Date(bug.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Нет задач</p>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div
            ref={profileAvatarRef}
            className="profile-sidebar-avatar"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <img
              src={user ?
                (user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=6467F2&color=fff&size=200`)
                : "https://via.placeholder.com/40"}
              alt="Аватар профиля"
              className="avatar-img"
            />
            <Dropdown
              isOpen={showProfileDropdown}
              onClose={() => setShowProfileDropdown(false)}
              items={[
                {
                  label: 'Профиль',
                  onClick: () => navigate('/profile'),
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M3 17C3 14.2386 6.13401 12 10 12C13.866 12 17 14.2386 17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )
                },
                {
                  label: 'Воркспейсы',
                  onClick: () => navigate('/workspaces'),
                  icon: (
                    <svg width="20" height="20" viewBox="0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                      <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )
                },
                {
                  label: 'Выход',
                  onClick: () => {
                    logout();
                    navigate('/login');
                  },
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 3H4C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M10 14L14 10L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 10H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )
                },
              ]}
              anchorElement={profileAvatarRef.current || undefined}
            />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="project-header">
          <div className="project-breadcrumb">
            <button className="back-button" onClick={() => navigate(`/workspace/${project.workspace_uuid}`)}>
              ← Назад к воркспейсу
            </button>
          </div>

          <div className="project-title-section">
            <div className="project-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1>{project.name}</h1>
              <p className="project-description">{project.description}</p>
              <div className="project-meta">
                <span>Создан: {new Date(project.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Участников: {project.member_count || 0}</span>
                <span>•</span>
                <span>{project.item_name_nominative || 'Задачи'}: {bugs.length}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="project-content">
          <section className="project-overview">
            <h2>Обзор проекта</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{bugs.length}</h3>
                <p>{project.item_name_nominative || 'Задачи'}</p>
              </div>
              <div className="stat-card">
                <h3>{project.member_count || 0}</h3>
                <p>Участников</p>
              </div>
              <div className="stat-card">
                <h3>0</h3>
                <p>Закрытых</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'open': '#EF4444', // red
    'in-progress': '#3B82F6', // blue
    'resolved': '#10B981', // green
    'closed': '#6B7280', // gray
    'todo': '#8B5CF6', // violet
    'backlog': '#6366F1', // indigo
    'default': '#6B7280' // gray
  };

  return statusColors[status.toLowerCase()] || statusColors['default'];
}