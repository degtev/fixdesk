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
import './WorkspaceDetail.css';

interface Workspace {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  project_count: number;
  member_count: number;
  is_owner: boolean;
}

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

interface Member {
  workspace_id: number;
  user_id: number;
  position?: string;
  first_name?: string;
  last_name?: string;
  joined_at: string;
  email: string;
  is_owner: boolean;
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

export interface CreateProjectFormData {
  name: string;
  description: string;
  item_name_singular?: string;
  item_name_nominative?: string;
  item_name_genitive?: string;
  item_name_accusative?: string;
}

export const WorkspaceDetail: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');
  const profileAvatarRef = useRef<HTMLDivElement>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [createProjectData, setCreateProjectData] = useState<CreateProjectFormData>({
    name: '',
    description: '',
    item_name_singular: 'баг',
    item_name_nominative: 'баги',
    item_name_genitive: 'багов',
    item_name_accusative: 'баги'
  });

  useEffect(() => {
    if (token && uuid) {
      fetchWorkspaceDetails();
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

  const fetchWorkspaceDetails = async () => {
    try {
      const workspaceData = await api.getWorkspaceByUUID(token!, uuid!);
      setWorkspace(workspaceData);
      setEditingName(workspaceData.name);
      setEditingDescription(workspaceData.description || '');

      const workspaceProjects = await api.getWorkspaceProjects(token!, uuid!);
      setProjects(workspaceProjects);

      const workspaceMembers = await api.getWorkspaceMembers(token!, uuid!);
      setMembers(workspaceMembers);
    } catch (error) {
      console.error('Ошибка при загрузке данных воркспейса:', error);
      setError('Не удалось загрузить данные воркспейса');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkspace = async () => {
    if (!workspace || !uuid) return;

    try {
      const updatedWorkspace = await api.updateWorkspace(token!, uuid, {
        name: editingName,
        description: editingDescription
      });

      setWorkspace(updatedWorkspace);
      setShowEditModal(false);
    } catch (error) {
      console.error('Ошибка при обновлении воркспейса:', error);
      setError('Не удалось обновить воркспейс');
    }
  };

  const handleInviteMember = async () => {
    if (!workspace || !uuid || !inviteEmail) return;

    try {
      await api.inviteToWorkspace(token!, uuid, { email: inviteEmail });
      setShowInviteModal(false);
      setInviteEmail('');
      const workspaceMembers = await api.getWorkspaceMembers(token!, uuid!);
      setMembers(workspaceMembers);
    } catch (error) {
      console.error('Ошибка при приглашении участника:', error);
      setError('Не удалось пригласить участника');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace || !uuid) return;

    if (window.confirm(`Вы уверены, что хотите удалить воркспейс "${workspace.name}"?`)) {
      try {
        await api.deleteWorkspace(token!, uuid);
        navigate('/workspaces');
      } catch (error) {
        console.error('Ошибка при удалении воркспейса:', error);
        setError('Не удалось удалить воркспейс');
      }
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!workspace || !uuid) return;

    try {
      await api.leaveWorkspace(token!, uuid);
      setShowLeaveModal(false);
      navigate('/workspaces');
    } catch (error) {
      console.error('Ошибка при покидании воркспейса:', error);
      setError('Не удалось покинуть воркспейс');
    }
  };

  const handleCreateProjectInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateProject = async () => {
    if (!workspace) return;

    try {
      const newProject = await api.createProjectInWorkspace(token!, workspace.id, createProjectData);

      setProjects([newProject, ...projects]);
      setShowCreateProjectModal(false);

      setCreateProjectData({
        name: '',
        description: '',
        item_name_singular: 'баг',
        item_name_nominative: 'баги',
        item_name_genitive: 'багов',
        item_name_accusative: 'баги'
      });
    } catch (error) {
      console.error('Ошибка при создании проекта:', error);
      setError('Не удалось создать проект');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!workspace || !uuid) return;

    if (window.confirm('Вы уверены, что хотите удалить этого участника?')) {
      try {
        await api.removeWorkspaceMember(token!, uuid, userId.toString());
        const workspaceMembers = await api.getWorkspaceMembers(token!, uuid!);
        setMembers(workspaceMembers);
      } catch (error) {
        console.error('Ошибка при удалении участника:', error);
        setError('Не удалось удалить участника');
      }
    }
  };

  if (loading) {
    return (
      <div className="workspace-detail-page">
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
          <div className="loading">Загрузка воркспейса...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-detail-page">
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

  if (!workspace || !uuid) {
    return (
      <div className="workspace-detail-page">
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
          <div className="error">Воркспейс не найден</div>
        </main>
      </div>
    );
  }

  return (
    <div className="workspace-detail-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Logo />
        </div>

        <div className="sidebar-content">
          <div>
            <h3>Недавние воркспейсы</h3>
            <div className="recent-workspaces">
              <div className="workspace-item active" onClick={() => navigate(`/workspace/${workspace.uuid}`)}>
                <h4>{workspace.name}</h4>
                <div className="workspace-stats">
                  <span>проектов: {workspace.project_count}</span>
                  <span>участников: {workspace.member_count}</span>
                </div>
              </div>
            </div>

            <div className="recent-workspaces-buttons">
              <Tooltip content="Создать воркспейс" position="right">
                <Button
                  className="create-workspace-btn"
                  onClick={() => navigate('/workspaces')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12H20M12 4V20" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </Button>
              </Tooltip>
              <button
                className="show-all-workspaces-btn"
                onClick={() => navigate('/workspaces')}
              >
                Все воркспейсы
              </button>
            </div>
          </div>

          <div>
            <h3>Проекты воркспейса</h3>
            {projects.length > 0 ? (
              <div className="recent-projects">
                {projects.slice(0, 3).map(project => (
                  <div
                    key={project.uuid}
                    className="project-item"
                    onClick={() => navigate(`/project/${project.uuid}`)}
                  >
                    <h4>{project.name}</h4>
                    <div className="project-stats">
                      <span>багов: {project.bug_list_count || 0}</span>
                      <span>участников: {project.member_count || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Нет проектов</p>
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
        <header className="workspace-header">
          <div className="workspace-breadcrumb">
            <button className="back-button" onClick={() => navigate('/workspaces')}>
              ← Назад к воркспейсам
            </button>
          </div>

          <div className="workspace-title-section">
            <div className="workspace-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1>{workspace.name}</h1>
              <p className="workspace-description">{workspace.description || 'Нет описания'}</p>
              <div className="workspace-meta">
                <span>Создан: {new Date(workspace.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Участников: {workspace.member_count}</span>
                <span>•</span>
                <span>Проектов: {workspace.project_count}</span>
              </div>
            </div>
          </div>

          <div className="workspace-actions">
            {workspace.is_owner && (
              <>
                <Tooltip content="Пригласить участника" position="bottom">
                  <Button variant="secondary" onClick={() => setShowInviteModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 12C18 13.1819 17.7672 14.3522 17.3149 15.4442C16.8626 16.5361 16.1997 17.5282 15.364 18.364C14.5282 19.1997 13.5361 19.8626 12.4442 20.3149C11.3522 20.7672 10.1819 21 9 21C7.8181 21 6.64778 20.7672 5.55585 20.3149C4.46392 19.8626 3.47177 19.1997 2.63604 18.364C1.80031 17.5282 1.13738 16.5361 0.685083 15.4442C0.23279 14.3522 0 13.1819 0 12C0 10.8181 0.23279 9.64778 0.685083 8.55585C1.13738 7.46392 1.80031 6.47177 2.63604 5.63604C3.47177 4.80031 4.46392 4.13738 5.55585 3.68508C6.64778 3.23279 7.8181 3 9 3C10.1819 3 11.3522 3.23279 12.4442 3.68508C13.5361 4.13738 14.5282 4.80031 15.364 5.63604C16.1997 6.47177 16.8626 7.46392 17.3149 8.55585C17.7672 9.64778 18 10.8181 18 12Z" fill="currentColor" />
                      <path d="M12 7V12M12 12V17M12 12H17M12 12L7 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Button>
                </Tooltip>
                <Tooltip content="Редактировать воркспейс" position="bottom">
                  <Button variant="secondary" onClick={() => setShowEditModal(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H17C18.1046 20 19 19.1046 19 18V13M3 16L7.5 11.5L16.5 2.5L21.5 7.5L12.5 16.5L8 21.5L3 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Button>
                </Tooltip>
                <Tooltip content="Удалить воркспейс" position="bottom">
                  <Button variant="secondary" onClick={handleDeleteWorkspace}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 7H20M10 11V17M14 11V17M5 7L6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19L19 7M9 7V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Button>
                </Tooltip>
              </>
            )}
            {!workspace.is_owner && (
              <Tooltip content="Покинуть воркспейс" position="bottom">
                <Button variant="secondary" onClick={() => setShowLeaveModal(true)}>
                  Покинуть
                </Button>
              </Tooltip>
            )}
          </div>
        </header>

        <div className="workspace-content">
          <section className="workspace-section">
            <h2>Проекты ({projects.length})</h2>
            {projects.length > 0 ? (
              <div className="projects-grid">
                {projects.map(project => (
                  <div
                    key={project.uuid}
                    className="project-card"
                    onClick={() => navigate(`/project/${project.uuid}`)}
                  >
                    <div className="project-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="project-info">
                      <h3>{project.name}</h3>
                      <p className="project-description">{project.description}</p>
                      <div className="project-stats">
                        <span>Багов: {project.bug_list_count || 0}</span>
                        <span>Закрыто: {project.bug_list_closed_count || 0}</span>
                        <span>Участников: {project.member_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section">
                <p>В этом воркспейсе пока нет проектов</p>
                <Button onClick={() => setShowCreateProjectModal(true)}>
                  Создать проект
                </Button>
              </div>
            )}
          </section>

          <section className="workspace-section">
            <h2>Участники ({members.length})</h2>
            {members.length > 0 ? (
              <div className="members-list">
                {members.map(member => (
                  <div key={member.user_id} className="member-card">
                    <div className="member-avatar">
                      <img
                        src={`https://ui-avatars.com/api/?name=${member.first_name || ''}+${member.last_name || ''}&background=6467F2&color=fff&size=40`}
                        alt={`${member.first_name} ${member.last_name}`}
                      />
                    </div>
                    <div className="member-info">
                      <div className="member-name">
                        {member.first_name} {member.last_name} {member.is_owner && <span className="owner-tag">Владелец</span>}
                      </div>
                      <div className="member-details">
                        {member.position && <span>{member.position}</span>}
                        <span>{member.email}</span>
                      </div>
                    </div>
                    <div className="member-actions">
                      {workspace.is_owner && !member.is_owner && (
                        <Button
                          variant="secondary"
                          onClick={() => handleRemoveMember(member.user_id)}
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section">
                <p>В этом воркспейсе пока нет других участников</p>
              </div>
            )}
          </section>
        </div>

        {/* Модальное окно редактирования воркспейса */}
        <Modal
          isOpen={showEditModal}
          title="Редактировать воркспейс"
          onClose={() => setShowEditModal(false)}
        >
          <div className="edit-workspace-modal">
            <Input
              label="Название воркспейса"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Введите название"
            />
            <Textarea
              label="Описание воркспейса"
              value={editingDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingDescription(e.target.value)}
              placeholder="Введите описание"
            />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Отмена</Button>
              <Button onClick={handleUpdateWorkspace}>Сохранить</Button>
            </div>
          </div>
        </Modal>

        {/* Модальное окно приглашения участника */}
        <Modal
          isOpen={showInviteModal}
          title="Пригласить участника"
          onClose={() => setShowInviteModal(false)}
        >
          <div className="invite-member-modal">
            <Input
              label="Email участника"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Введите email"
            />
            <p className="modal-help-text">
              Приглашенный участник должен быть зарегистрирован в системе
            </p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Отмена</Button>
              <Button onClick={handleInviteMember}>Пригласить</Button>
            </div>
          </div>
        </Modal>

        {/* Модальное окно подтверждения выхода */}
        <Modal
          isOpen={showLeaveModal}
          title="Покинуть воркспейс"
          onClose={() => setShowLeaveModal(false)}
        >
          <div className="leave-workspace-modal">
            <p>Вы уверены, что хотите покинуть воркспейс "{workspace.name}"?</p>
            <p>Вы больше не будете иметь доступ к проектам и данным этого воркспейса.</p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>Отмена</Button>
              <Button variant="secondary" onClick={handleLeaveWorkspace}>Покинуть</Button>
            </div>
          </div>
        </Modal>

        {/* Модальное окно создания проекта */}
        <Modal
          isOpen={showCreateProjectModal}
          title="Создать проект"
          onClose={() => setShowCreateProjectModal(false)}
        >
          <div className="create-project-modal">
            <Input
              label="Название проекта"
              name="name"
              value={createProjectData.name}
              onChange={handleCreateProjectInputChange}
              placeholder="Введите название проекта"
            />
            <Textarea
              label="Описание проекта"
              name="description"
              value={createProjectData.description}
              onChange={handleCreateProjectInputChange}
              placeholder="Введите описание проекта"
            />
            <div className="project-terminology-section">
              <h4>Наименование элементов проекта</h4>
              <p>Настройте терминологию для элементов вашего проекта (по умолчанию: баги)</p>
              <div className="terminology-inputs">
                <Input
                  label="Единственное число (например: баг)"
                  name="item_name_singular"
                  value={createProjectData.item_name_singular}
                  onChange={handleCreateProjectInputChange}
                />
                <Input
                  label="Именительный падеж (например: баги)"
                  name="item_name_nominative"
                  value={createProjectData.item_name_nominative}
                  onChange={handleCreateProjectInputChange}
                />
                <Input
                  label="Родительный падеж (например: багов)"
                  name="item_name_genitive"
                  value={createProjectData.item_name_genitive}
                  onChange={handleCreateProjectInputChange}
                />
                <Input
                  label="Винительный падеж (например: баги)"
                  name="item_name_accusative"
                  value={createProjectData.item_name_accusative}
                  onChange={handleCreateProjectInputChange}
                />
              </div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowCreateProjectModal(false)}>Отмена</Button>
              <Button onClick={handleCreateProject}>Создать проект</Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};