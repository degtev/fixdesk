import { config } from '../config/env';

const API_URL = config.backendUrl;

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  position?: string;
  role: 'internal' | 'external';
  verificationCode?: string;
}

export const api = {
  async login(data: LoginData) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка входа');
    }

    return response.json();
  },

  async registerInternal(data: { email: string; password: string; first_name: string; last_name: string; position: string }) {
    const response = await fetch(`${API_URL}/auth/register/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        position: data.position,
        role: 'internal'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка регистрации');
    }

    return response.json();
  },

  async verifyEmail(data: RegisterData) {
    const response = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка подтверждения');
    }

    return response.json();
  },

  async getMe(token: string) {
    const response = await fetch(`${API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Не авторизован');
    }

    return response.json();
  },

  async requestPasswordReset(email: string) {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка отправки');
    }

    return response.json();
  },

  async resetPassword(token: string, email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка сброса пароля');
    }

    return response.json();
  },

  getGoogleAuthUrl() {
    return `${API_URL}/oauth/google`;
  },

  getYandexAuthUrl() {
    return `${API_URL}/oauth/yandex`;
  },

  getGithubAuthUrl() {
    return `${API_URL}/oauth/github`;
  },

  getTelegramAuthUrl() {
    return `${API_URL}/oauth/telegram`;
  },

  async uploadAvatar(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка загрузки аватара');
    }

    return response.json();
  },

  async updateProfile(token: string, data: { first_name: string; last_name: string; position?: string; avatar_url?: string }) {
    const response = await fetch(`${API_URL}/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка обновления профиля');
    }

    return response.json();
  },

  async changePassword(token: string, currentPassword: string | null, newPassword: string) {
    const response = await fetch(`${API_URL}/auth/set-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка изменения пароля');
    }

    return response.json();
  },

  async deleteAccount(token: string) {
    const response = await fetch(`${API_URL}/auth/delete-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка удаления аккаунта');
    }

    return response.json();
  },

  async restoreAccount(token: string) {
    const response = await fetch(`${API_URL}/auth/restore-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка восстановления аккаунта');
    }

    return response.json();
  },

  async getSocialAccounts(token: string) {
    const response = await fetch(`${API_URL}/oauth/social-accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения социальных аккаунтов');
    }

    return response.json();
  },

  async unlinkSocialAccount(token: string, provider: string) {
    const response = await fetch(`${API_URL}/oauth/social-accounts/${provider}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка отвязки социального аккаунта');
    }

    return response.json();
  },

  async getNotificationSettings(token: string) {
    const response = await fetch(`${API_URL}/auth/notification-settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения настроек уведомлений');
    }

    return response.json();
  },

  async updateNotificationSettings(token: string, settings: {
    project_invitations?: boolean;
    bug_assignments?: boolean;
    bug_comments?: boolean;
    comment_replies?: boolean;
    bug_verification?: boolean;
  }) {
    const response = await fetch(`${API_URL}/auth/notification-settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка обновления настроек уведомлений');
    }

    return response.json();
  },

  async getWorkspaces(token: string) {
    const response = await fetch(`${API_URL}/workspaces`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения воркспейсов');
    }

    return response.json();
  },

  async createWorkspace(token: string, data: { name: string; description?: string }) {
    const response = await fetch(`${API_URL}/workspaces`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка создания воркспейса');
    }

    return response.json();
  },

  async getWorkspaceByUUID(token: string, uuid: string) {
    const response = await fetch(`${API_URL}/workspaces/${uuid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения воркспейса');
    }

    return response.json();
  },

  async getWorkspaceProjects(token: string, uuid: string) {
    const response = await fetch(`${API_URL}/workspaces/${uuid}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения проектов воркспейса');
    }

    return response.json();
  },

  async getWorkspaceMembers(token: string, uuid: string) {
    const response = await fetch(`${API_URL}/workspaces/${uuid}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения участников воркспейса');
    }

    return response.json();
  },

  async updateWorkspace(token: string, uuid: string, data: { name: string; description?: string }) {
    const response = await fetch(`${API_URL}/workspaces/${uuid}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка обновления воркспейса');
    }

    return response.json();
  },

  async deleteWorkspace(token: string, uuid: string) {
    const response = await fetch(`${API_URL}/workspaces/${uuid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка удаления воркспейса');
    }

    return response.json();
  },

  async inviteToWorkspace(token: string, uuid: string, data: { email: string }) {
    const response = await fetch(`${API_URL}/workspaces/${uuid}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка приглашения в воркспейс');
    }

    return response.json();
  },

  async removeWorkspaceMember(token: string, workspaceUuid: string, userUuid: string) {
    const response = await fetch(`${API_URL}/workspaces/${workspaceUuid}/members/${userUuid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка удаления участника воркспейса');
    }

    return response.json();
  },

  async leaveWorkspace(token: string, uuid: string) {
    const response = await fetch(`${API_URL}/workspaces/${uuid}/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка выхода из воркспейса');
    }

    return response.json();
  },

  async getProjects(token: string) {
    const response = await fetch(`${API_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения проектов');
    }

    return response.json();
  },

  async createProjectInWorkspace(token: string, workspaceId: number, data: {
    name: string;
    description: string;
    item_name_singular?: string;
    item_name_nominative?: string;
    item_name_genitive?: string;
    item_name_accusative?: string;
  }) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('workspace_id', workspaceId.toString());
    formData.append('iconType', 'default');
    formData.append('defaultIcon', '/api/project-icons/default-1.png');

    if (data.item_name_singular) formData.append('item_name_singular', data.item_name_singular);
    if (data.item_name_nominative) formData.append('item_name_nominative', data.item_name_nominative);
    if (data.item_name_genitive) formData.append('item_name_genitive', data.item_name_genitive);
    if (data.item_name_accusative) formData.append('item_name_accusative', data.item_name_accusative);

    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка создания проекта в воркспейсе');
    }

    return response.json();
  },

  async getProjectByUUID(token: string, uuid: string) {
    const response = await fetch(`${API_URL}/projects/${uuid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения проекта');
    }

    return response.json();
  },

  async getProjectBugs(token: string, projectUuid: string) {
    const response = await fetch(`${API_URL}/bugs/project/${projectUuid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка получения задач проекта');
    }

    return response.json();
  },
};

