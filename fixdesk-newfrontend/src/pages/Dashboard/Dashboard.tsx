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
import { Sidebar } from '../../components/Sidebar/Sidebar';
import './Dashboard.css';

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

export const Dashboard: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
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

  const recentWorkspaces = workspaces.slice(0, 2);
  const recentProjects = projects.slice(0, 2);

  return (
    <div className="dashboard-page">
      <Sidebar
        workspaces={workspaces}
        projects={projects}
        loading={loading}
        onCreateModalToggle={() => setShowCreateModal(true)}
        user={user}
        onLogout={logout}
      />

      <main className="main-content">
        <h1>Дашборд</h1>
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