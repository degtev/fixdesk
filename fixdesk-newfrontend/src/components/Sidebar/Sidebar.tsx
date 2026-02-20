import React, { useState, useRef } from 'react';
import { Logo } from '../LogoPage/Logo';
import { Dropdown } from '../Dropdown';
import { Tooltip } from '../Tooltip/Tooltip';
import { Button } from '../Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

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

interface SidebarProps {
  workspaces: Workspace[];
  projects: Project[];
  loading: boolean;
  onCreateModalToggle: () => void;
  user: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  projects,
  loading,
  onCreateModalToggle,
  user,
  onLogout
}) => {
 const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileAvatarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const recentWorkspaces = workspaces.slice(0, 2);
  const recentProjects = projects.slice(0, 2);

  return (
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
                  <div key={workspace.uuid} className="workspace-item">
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
                    onClick={onCreateModalToggle}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12H20M12 4V20" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </Button>
                </Tooltip>
                <button
                  className="show-all-workspaces-btn"
                  onClick={() => navigate('/all-workspaces')}
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
                <div key={project.uuid} className="project-item">
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
                    <path d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M3 17C3 14.2386 6.13401 12 10 12C13.866 12 17 14.2386 17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )
              },
              {
                label: 'Дашборд',
                onClick: () => navigate('/dasboard'),
                icon: (
                  <svg width="20" height="20" viewBox="0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )
              },
              {
                label: 'Выход',
                onClick: () => {
                  onLogout();
                  navigate('/login');
                },
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 3H4C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10 14L14 10L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 10H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )
              },
            ]}
            anchorElement={profileAvatarRef.current || undefined}
          />
        </div>
      </div>
    </aside>
  );
};