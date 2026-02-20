import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../../components/LogoPage/Logo';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Button } from '../../components/Button';
import { Dropdown } from '../../components/Dropdown';
import { Tooltip } from '../../components/Tooltip/Tooltip';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './Workspaces.css';

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

export const Workspaces: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'participating'>('my');
  const profileAvatarRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { token, logout } = useAuth();

  useEffect(() => {
    if (token) {
      const fetchData = async () => {
        try {
          const userData = await api.getMe(token);
          setUser(userData);

          const workspacesData = await api.getWorkspaces(token);
          setWorkspaces(workspacesData);

          const myWorkspaces = workspacesData.filter((ws: Workspace) => ws.is_owner);
          const participatingWorkspaces = workspacesData.filter((ws: Workspace) => !ws.is_owner);
          setAllWorkspaces([...myWorkspaces, ...participatingWorkspaces]);

          const projectsData = await api.getProjects(token);
          setProjects(projectsData);
        } catch (error) {
          console.error('Ошибка при получении данных:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      alert('Пожалуйста, введите название воркспейса');
      return;
    }

    if (!token) {
      alert('Необходимо авторизоваться для создания воркспейса');
      return;
    }

    try {
      const newWorkspace = await api.createWorkspace(token, {
        name: workspaceName,
        description: workspaceDescription,
      });

      setWorkspaces([newWorkspace, ...workspaces]);
      setShowCreateModal(false);
      setWorkspaceName('');
      setWorkspaceDescription('');
    } catch (error) {
      console.error('Ошибка при создании воркспейса:', error);
      alert('Не удалось создать воркспейс');
    }
  };

  const myWorkspaces = workspaces.filter(ws => ws.is_owner);
  const participatingWorkspaces = workspaces.filter(ws => !ws.is_owner);

  const recentWorkspaces = workspaces.slice(0, 2);
  const recentProjects = projects.slice(0, 2);

  const handleWorkspaceClick = (uuid: string) => {
    navigate(`/workspace/${uuid}`);
  };

  const handleShowAllWorkspaces = () => {
    navigate('/all-workspaces'); // Это может быть отдельная страница или модальное окно
  };

  return (
    <div className="workspaces-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Logo />
        </div>

        <div className="sidebar-content">
          <div>
            <h3>Новые воркспейсы</h3>
            {loading ? (
              <p>Загрузка...</p>
            ) : (
              <>
                <div className="recent-workspaces">
                  {recentWorkspaces.map(workspace => (
                    <div
                      key={workspace.uuid}
                      className="workspace-item"
                      onClick={() => handleWorkspaceClick(workspace.uuid)}
                    >
                      <h4>{workspace.name}</h4>
                      {/*<p>{workspace.description}</p>*/}
                      <div className="workspace-stats">
                        <span>проектов: {workspace.project_count}</span>
                        <span>участников: {workspace.member_count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="recent-workspaces-buttons">
                  <Tooltip content="Создать воркспейс" position="right">
                    <Button
                      className="create-workspace-btn"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none">
                        <path d="M4 12H20M12 4V20" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </Button>
                  </Tooltip>
                  <button
                    className="show-all-workspaces-btn"
                    onClick={handleShowAllWorkspaces}
                  >
                    Показать все
                  </button>
                </div>

              </>
            )}
          </div>

          <div>
            <h3>Новые проекты</h3>
            {loading ? (
              <p>Загрузка...</p>
            ) : (
              <div className="recent-projects">
                {recentProjects.map(project => (
                  <div
                    key={project.uuid}
                    className="project-item"
                    onClick={() => navigate(`/project/${project.uuid}`)}
                  >
                    <h4>{project.name}</h4>
                    <div className="project-stats">
                      <span>прогресс: {project.bug_list_closed_count || 0}/{project.bug_list_count || 0}</span>
                      <span>участников: {project.member_count || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
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
        <div className="workspaces-header">
          <h1>Воркспейсы</h1>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              Мои воркспейсы ({myWorkspaces.length})
            </button>
            <button
              className={`tab ${activeTab === 'participating' ? 'active' : ''}`}
              onClick={() => setActiveTab('participating')}
            >
              В которых участвую ({participatingWorkspaces.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Загрузка воркспейсов...</div>
        ) : (
          <div className="workspaces-grid">
            {activeTab === 'my' && myWorkspaces.length === 0 && participatingWorkspaces.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none">
                    <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <h3>У вас пока нет воркспейсов</h3>
                  <p>Создайте воркспейс для организации ваших проектов</p>
                  <Button onClick={() => setShowCreateModal(true)}>Создать воркспейс</Button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'my' && (
                  <div className="workspace-list">
                    {myWorkspaces.map(workspace => (
                      <div
                        key={workspace.uuid}
                        className="workspace-card"
                        onClick={() => handleWorkspaceClick(workspace.uuid)}
                      >
                        <div className="workspace-card-header">
                          <div className="workspace-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                              <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="workspace-info">
                            <h3>{workspace.name}</h3>
                            <p className="workspace-description">{workspace.description || 'Нет описания'}</p>
                          </div>
                          <div className="workspace-badge owner">Владелец</div>
                        </div>
                        <div className="workspace-stats">
                          <div className="stat">
                            <span className="stat-value">{workspace.project_count}</span>
                            <span className="stat-label">Проектов</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">{workspace.member_count}</span>
                            <span className="stat-label">Участников</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'participating' && (
                  <div className="workspace-list">
                    {participatingWorkspaces.map(workspace => (
                      <div
                        key={workspace.uuid}
                        className="workspace-card"
                        onClick={() => handleWorkspaceClick(workspace.uuid)}
                      >
                        <div className="workspace-card-header">
                          <div className="workspace-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2" />
                              <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="workspace-info">
                            <h3>{workspace.name}</h3>
                            <p className="workspace-description">{workspace.description || 'Нет описания'}</p>
                          </div>
                          <div className="workspace-badge participant">Участник</div>
                        </div>
                        <div className="workspace-stats">
                          <div className="stat">
                            <span className="stat-value">{workspace.project_count}</span>
                            <span className="stat-label">Проектов</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">{workspace.member_count}</span>
                            <span className="stat-label">Участников</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <Modal
        isOpen={showCreateModal}
        title="Создать воркспейс"
        onClose={() => setShowCreateModal(false)}
      >
        <div className="create-workspace-modal">
          <Input
            label="Название воркспейса"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Введите название"
          />
          <Textarea
            label="Описание воркспейса"
            value={workspaceDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWorkspaceDescription(e.target.value)}
            placeholder="Введите описание"
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Отмена</Button>
            <Button onClick={handleCreateWorkspace}>Создать</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};