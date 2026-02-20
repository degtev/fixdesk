import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    ListItemSecondaryAction,
    Chip,
    Divider,
    Paper,
    CardActions
} from '@mui/material';
import {
    Edit as EditIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    Folder as FolderIcon,
    BugReport as BugReportIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { WorkspaceWithStats, WorkspaceMember } from '../types/workspace';
import { Project } from '../types/project';
import ProjectForm from './ProjectForm';
import CustomDialog from './CustomDialog';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
};

const WorkspaceView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [workspace, setWorkspace] = useState<WorkspaceWithStats | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [defaultIcons, setDefaultIcons] = useState<string[]>([]);

    const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
    const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<WorkspaceMember | null>(null);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);

    const [editForm, setEditForm] = useState({ name: '', description: '' });
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState('');

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const ProjectCard = ({ project }: { project: Project }) => {
        const [membersCount, setMembersCount] = useState<number | null>(null);
        const [bugsCount, setBugsCount] = useState<number | null>(null);
        const [closedBugsCount, setClosedBugsCount] = useState<number | null>(null);

        useEffect(() => {
            const fetchCounts = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    const config = { headers: { 'Authorization': `Bearer ${token}` } };
                    const membersRes = await axios.get(`${BACKEND_URL}/projects/${project.uuid}/members`, config);
                    setMembersCount(membersRes.data.length);
                    const bugsRes = await axios.get(`${BACKEND_URL}/bugs/project/${project.uuid}`, config);
                    setBugsCount(bugsRes.data.length);
                    setClosedBugsCount(bugsRes.data.filter((bug: any) => bug.status === 'resolved' || bug.status === 'closed').length);
                } catch (e) {
                    setMembersCount(null);
                    setBugsCount(null);
                    setClosedBugsCount(null);
                }
            };
            fetchCounts();
        }, [project.uuid]);

        return (
            <Card sx={{
                background: '#212134',
                border: '1px solid #32324d',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-1px)',
                    borderColor: '#c0c0cf'
                }
            }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                            src={`${BACKEND_URL}${project.icon_url}`}
                            sx={{
                                width: 48,
                                height: 48,
                                mr: 2,
                                bgcolor: '#fff',
                                p: 0,
                            }}
                        >
                            {project.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{
                                fontWeight: 'bold',
                                color: '#ffffff'
                            }}>
                                {project.name}
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: '#cccccc',
                                fontSize: '0.875rem'
                            }}>
                                Создан {formatDate(project.created_at)}
                            </Typography>
                        </Box>
                    </Box>

                    <Typography
                        variant="body2"
                        sx={{
                            color: '#cccccc',
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5
                        }}
                    >
                        {project.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                            icon={<GroupIcon />}
                            label={membersCount !== null ? `Участники: ${membersCount}` : 'Участники'}
                            size="small"
                            sx={{
                                bgcolor: 'transparent',
                                color: '#7b79ff',
                                '& .MuiChip-icon': {
                                    color: '#7b79ff'
                                }
                            }}
                        />
                        <Chip
                            icon={<BugReportIcon />}
                            label={
                                bugsCount !== null && closedBugsCount !== null
                                    ? `Прогресс: ${closedBugsCount}/${bugsCount}`
                                    : 'Прогресс'
                            }
                            size="small"
                            sx={{
                                bgcolor: 'transparent',
                                color: '#36b37e',
                                '& .MuiChip-icon': {
                                    color: '#36b37e'
                                }
                            }}
                        />
                    </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                        size="small"
                        onClick={() => navigate(`/project/${project.uuid}`)}
                        sx={{
                            bgcolor: '#212134',
                            borderColor: '#4a4a6a',
                            color: '#fff',
                            fontSize: '0.875rem',
                            px: 2,
                            py: 1,
                            '&:hover': { bgcolor: '#181826' }
                        }}
                    >
                        Открыть проект
                    </Button>
                    <Box>
                        {(workspace?.is_owner || project.created_by === currentUserId) && (
                            <>
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: '#fff',
                                        '&:hover': {
                                            color: '#fff',
                                            bgcolor: 'rgba(0, 0, 0, 0.3)'
                                        }
                                    }}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await openEditProjectDialog(project);
                                    }}
                                    title="Редактировать проект"
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: '#fff',
                                        '&:hover': {
                                            color: '#fff',
                                            bgcolor: 'rgba(0, 0, 0, 0.3)'
                                        }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteProjectDialog(project);
                                    }}
                                    title="Удалить проект"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </CardActions>
            </Card>
        );
    };

    useEffect(() => {
        fetchWorkspaceData();
        fetchDefaultIcons();
        fetchCurrentUser();
    }, [id]);

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BACKEND_URL}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCurrentUserId(response.data.id);
        } catch (err) {
            console.error('Error fetching current user:', err);
        }
    };

    const fetchDefaultIcons = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/projects/default-icons`);
            setDefaultIcons(response.data.icons || []);
        } catch (err) {
            console.error('Error fetching default icons:', err);
        }
    };

    const fetchWorkspaceData = async () => {
        try {
            const token = localStorage.getItem('token');

            const workspaceResponse = await fetch(`${API_URL}/workspaces/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!workspaceResponse.ok) throw new Error('Failed to fetch workspace');
            const workspaceData = await workspaceResponse.json();
            setWorkspace(workspaceData);
            setEditForm({ name: workspaceData.name, description: workspaceData.description || '' });

            const projectsResponse = await fetch(`${API_URL}/workspaces/${id}/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (projectsResponse.ok) {
                const workspaceProjects = await projectsResponse.json();
                setProjects(workspaceProjects);
            }

            const membersResponse = await fetch(`${API_URL}/workspaces/${id}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (membersResponse.ok) {
                const membersData = await membersResponse.json();
                setMembers(membersData);
            }

        } catch (err: any) {
            setError(err.message || 'Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (data: any) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('name', data.name);
            formDataToSend.append('description', data.description);
            formDataToSend.append('workspace_id', workspace!.id.toString());
            formDataToSend.append('iconType', 'upload');
            formDataToSend.append('item_name_singular', data.item_name_singular || 'задача');
            formDataToSend.append('item_name_nominative', data.item_name_nominative || 'задачи');
            formDataToSend.append('item_name_genitive', data.item_name_genitive || 'задач');
            formDataToSend.append('item_name_accusative', data.item_name_accusative || 'задачу');

            if (data.custom_statuses) {
                formDataToSend.append('custom_statuses', JSON.stringify(data.custom_statuses));
            }

            if (data.custom_priorities) {
                formDataToSend.append('custom_priorities', JSON.stringify(data.custom_priorities));
            }

            if (data.iconFile) {
                formDataToSend.append('icon', data.iconFile);
            }

            if (data.members && data.members.length > 0) {
                data.members.forEach((user: any) => {
                    formDataToSend.append('members', user.id.toString());
                });
            }

            const response = await axios.post(
                `${BACKEND_URL}/projects`,
                formDataToSend,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setCreateProjectDialogOpen(false);
            await fetchWorkspaceData();
        } catch (error: any) {
            console.error('Ошибка создания проекта:', error);
            setError(error.response?.data?.message || 'Ошибка создания проекта');
        }
    };

    const handleEditWorkspace = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/workspaces/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            if (!response.ok) throw new Error('Failed to update workspace');

            await fetchWorkspaceData();
            setEditDialogOpen(false);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) {
            setInviteError('Email обязателен');
            return;
        }

        setInviteLoading(true);
        setInviteError('');
        setInviteSuccess('');

        try {
            console.log('Sending workspace invitation to:', inviteEmail);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/workspaces/${id}/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: inviteEmail })
            });

            console.log('Invitation response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Invitation error:', errorData);
                throw new Error(errorData.error || 'Failed to send invitation');
            }

            const result = await response.json();
            console.log('Invitation sent successfully:', result);

            setInviteSuccess('Приглашение успешно отправлено на email');
            setInviteEmail('');
            setTimeout(() => {
                setInviteDialogOpen(false);
                setInviteSuccess('');
            }, 2000);
        } catch (err: any) {
            console.error('Error inviting member:', err);
            setInviteError(err.message || 'Ошибка при отправке приглашения');
        } finally {
            setInviteLoading(false);
        }
    };

    const openDeleteMemberDialog = (member: WorkspaceMember) => {
        setMemberToDelete(member);
        setDeleteMemberDialogOpen(true);
    };

    const handleRemoveMember = async () => {
        if (!memberToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/workspaces/${id}/members/${memberToDelete.user_id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to remove member');

            setDeleteMemberDialogOpen(false);
            setMemberToDelete(null);
            await fetchWorkspaceData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteWorkspace = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/workspaces/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete workspace');

            navigate('/workspaces');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleProjectClick = (projectUuid: string) => {
        navigate(`/project/${projectUuid}`);
    };

    const openEditProjectDialog = async (project: Project) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const membersResponse = await axios.get(`${BACKEND_URL}/projects/${project.uuid}/members`, config);
            setEditingProject({ ...project, members: membersResponse.data });
            setEditProjectDialogOpen(true);
        } catch (error) {
            console.error('Error loading project members:', error);
            setEditingProject(project);
            setEditProjectDialogOpen(true);
        }
    };

    const openDeleteProjectDialog = (project: Project) => {
        setProjectToDelete(project);
        setDeleteProjectDialogOpen(true);
    };

    const handleEditProject = async (data: any) => {
        try {
            if (!editingProject) return;
            const token = localStorage.getItem('token');

            const formDataToSend = new FormData();
            formDataToSend.append('name', data.name);
            formDataToSend.append('description', data.description);
            formDataToSend.append('item_name_singular', data.item_name_singular || 'задача');
            formDataToSend.append('item_name_nominative', data.item_name_nominative || 'задачи');
            formDataToSend.append('item_name_genitive', data.item_name_genitive || 'задач');
            formDataToSend.append('item_name_accusative', data.item_name_accusative || 'задачу');

            if (data.custom_statuses) {
                formDataToSend.append('custom_statuses', JSON.stringify(data.custom_statuses));
            }

            if (data.custom_priorities) {
                formDataToSend.append('custom_priorities', JSON.stringify(data.custom_priorities));
            }

            if (data.iconFile) {
                formDataToSend.append('icon', data.iconFile);
            }

            if (data.members && data.members.length > 0) {
                data.members.forEach((user: any) => {
                    formDataToSend.append('members', user.id.toString());
                });
            }

            await axios.put(
                `${BACKEND_URL}/projects/${editingProject.uuid}`,
                formDataToSend,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setEditProjectDialogOpen(false);
            await fetchWorkspaceData();
        } catch (error: any) {
            console.error('Ошибка обновления проекта:', error);
            setError(error.response?.data?.message || 'Ошибка обновления проекта');
        }
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/projects/${projectToDelete.uuid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setDeleteProjectDialogOpen(false);
            setProjectToDelete(null);
            await fetchWorkspaceData();
        } catch (error: any) {
            console.error('Ошибка удаления проекта:', error);
            setError(error.response?.data?.message || 'Ошибка удаления проекта');
        }
    };

    if (loading) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!workspace) {
        return (
            <Container sx={{ mt: 10 }}>
                <Alert severity="error">Воркспейс не найден</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: 3, mb: 3, backgroundColor: '#212134', boxShadow: 'none',
                borderRadius: '12px',
                border: '1px solid #32324d',
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="h4">
                                {workspace.name}
                            </Typography>
                            {workspace.is_owner && (
                                <Chip label="Владелец" size="small" color="primary" />
                            )}
                        </Box>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {workspace.description || 'Нет описания'}
                        </Typography>
                        <Box display="flex" gap={3}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <FolderIcon color="action" />
                                <Typography variant="body2">
                                    Проекты: {workspace.project_count}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                                <PersonAddIcon color="action" />
                                <Typography variant="body2">
                                    Участники: {workspace.member_count}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    {workspace.is_owner && (
                        <Box display="flex" gap={1}>
                            <IconButton onClick={() => setEditDialogOpen(true)} color="#fff">
                                <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => setDeleteDialogOpen(true)} color="#fff">
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Tabs */}
            <Paper elevation={0} sx={{ backgroundColor: 'transparent' }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}
                    sx={{
                        backgroundColor: '#212134',
                        borderRadius: '12px',
                        border: '1px solid #32324d',
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#fff',
                        },
                        '& .MuiTab-root': {
                            color: '#9e9e9e',
                        },
                        '& .MuiTab-root.Mui-selected': {
                            color: '#fff',
                        },
                    }}>
                    <Tab label={`Проекты (${projects.length})`} />
                    <Tab label={`Участники (${members.length})`} />
                </Tabs>

                {/* Projects Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateProjectDialogOpen(true)}
                            sx={{
                                bgcolor: '#4945ff',
                                borderColor: '#4945ff',
                                fontSize: '0.875rem',
                                px: 2,
                                py: 1,
                                '&:hover': {
                                    bgcolor: '#7b79ff',
                                    borderColor: '#7b79ff'
                                },
                                color: '#ffffff'
                            }}
                        >
                            Создать проект
                        </Button>
                    </Box>

                    {projects.length === 0 ? (
                        <Box sx={{
                            textAlign: 'center',
                            py: 8,
                            background: '#212134',
                            borderRadius: 3,
                            border: '1px solid #32324d',
                        }}>
                            <FolderIcon sx={{ fontSize: 80, color: '#cccccc', mb: 2 }} />
                            <Typography variant="h6" sx={{
                                mb: 2,
                                color: '#fff',
                                fontWeight: 'bold'
                            }}>
                                Пока нет проектов
                            </Typography>
                            <Typography variant="body1" sx={{
                                color: '#cccccc',
                                mb: 3,
                                maxWidth: 500,
                                mx: 'auto'
                            }}>
                                Создайте первый проект для начала работы с задачами
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setCreateProjectDialogOpen(true)}
                                sx={{
                                    bgcolor: '#4945ff',
                                    borderColor: '#4945ff',
                                    '&:hover': { bgcolor: '#7b79ff', borderColor: '#7b79ff' },
                                    color: '#ffffff',
                                    fontWeight: 'bold'
                                }}
                            >
                                Создать проект
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 3
                        }}>
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </Box>
                    )}
                </TabPanel>

                {/* Members Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box display="flex" justifyContent="flex-end" mb={2}>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => setInviteDialogOpen(true)}
                            sx={{
                                bgcolor: '#4945ff',
                                borderColor: '#4945ff',
                                fontSize: '0.875rem',
                                px: 2,
                                py: 1,
                                '&:hover': {
                                    bgcolor: '#7b79ff',
                                    borderColor: '#7b79ff'
                                },
                                color: '#ffffff',
                            }}
                        >
                            Пригласить участника
                        </Button>
                    </Box>

                    <Card elevation={0} sx={{
                        textAlign: 'center',
                        py: 8,
                        boxShadow: 'none',
                        p: 0,
                        backgroundColor: '#212134',
                        borderRadius: '12px',
                        border: '1px solid #32324d',
                        mt: 3,
                    }}>
                        <List>
                            {members.map((member, index) => (
                                <React.Fragment key={member.user_id}>
                                    {index > 0 && <Divider />}
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar sx={{ backgroundColor: '#fff' }}>
                                                {member.first_name?.[0] || member.email[0].toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography>
                                                        {member.first_name && member.last_name
                                                            ? `${member.first_name} ${member.last_name}`
                                                            : member.email}
                                                    </Typography>
                                                    {member.is_owner && (
                                                        <Chip label="Владелец" size="small" color="primary" />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    {member.email}
                                                    {member.position && ` • ${member.position}`}
                                                </>
                                            }
                                        />
                                        {workspace.is_owner && !member.is_owner && (
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => openDeleteMemberDialog(member)}
                                                    color="#fff"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        )}
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    </Card>


                </TabPanel>
            </Paper>

            {/* Create Project Dialog */}
            <CustomDialog
                open={createProjectDialogOpen}
                onClose={() => setCreateProjectDialogOpen(false)}
                title="Создать проект"
                maxWidth="md"
                fullWidth
            >
                <ProjectForm
                    mode="create"
                    onSubmit={handleCreateProject}
                    onCancel={() => setCreateProjectDialogOpen(false)}
                    defaultIcons={defaultIcons}
                    currentUserId={currentUserId}
                    projectMembers={[]}
                    removeProjectMember={() => { }}
                    availableUsers={members.map(member => ({
                        id: member.user_id,
                        first_name: member.first_name || '',
                        last_name: member.last_name || '',
                        email: member.email,
                        position: member.position
                    }))}
                />
            </CustomDialog>

            {/* Edit Workspace Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать воркспейс</DialogTitle>
                <DialogContent elevation={0} sx={{
                    textAlign: 'center',
                    py: 8,
                    boxShadow: 'none',
                    p: 4,
                    backgroundColor: '#212134',
                }}>
                    <TextField
                        fullWidth
                        label="Название"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        margin="normal"
                        required
                        sx={{ mt: 5 }}
                    />
                    <TextField
                        fullWidth
                        label="Описание"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleEditWorkspace} variant="contained">Сохранить</Button>
                </DialogActions>
            </Dialog>

            {/* Invite Dialog */}
            <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Пригласить участника</DialogTitle>
                <DialogContent elevation={0} sx={{
                    textAlign: 'center',
                    py: 8,
                    boxShadow: 'none',
                    p: 4,
                    backgroundColor: '#212134',
                }}>
                    <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                        Введите email пользователя, которого хотите пригласить в рабочее пространство.
                        На указанный email будет отправлено приглашение.
                    </Typography>

                    {inviteError && <Alert severity="error" sx={{ mb: 2 }}>{inviteError}</Alert>}
                    {inviteSuccess && <Alert severity="success" sx={{ mb: 2 }}>{inviteSuccess}</Alert>}

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        margin="normal"
                        required
                        autoFocus

                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)} disabled={inviteLoading}>
                        Отмена
                    </Button>
                    <Button onClick={handleInviteMember} variant="contained" disabled={inviteLoading}>
                        {inviteLoading ? 'Отправка...' : 'Отправить приглашение'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Удалить воркспейс?</DialogTitle>
                <DialogContent elevation={0} sx={{
                    textAlign: 'center',
                    boxShadow: 'none',
                    backgroundColor: '#212134',
                    py: 5
                }}>
                    <Typography sx={{ mt: 5 }}>
                        Вы уверены, что хотите удалить воркспейс "{workspace.name}"?
                        Все проекты внутри него также будут удалены. Это действие необратимо.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleDeleteWorkspace} color="error" variant="contained">
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Member Confirmation Dialog */}
            <Dialog open={deleteMemberDialogOpen} onClose={() => setDeleteMemberDialogOpen(false)}>
                <DialogTitle>Удалить участника?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить участника{' '}
                        <strong>
                            {memberToDelete?.first_name} {memberToDelete?.last_name}
                        </strong>
                        {' '}из рабочего пространства?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteMemberDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleRemoveMember} color="error" variant="contained">
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Project Dialog */}
            <CustomDialog
                open={editProjectDialogOpen}
                onClose={() => setEditProjectDialogOpen(false)}
                title="Редактировать проект"
                maxWidth="md"
                fullWidth
            >
                <ProjectForm
                    mode="edit"
                    onSubmit={handleEditProject}
                    onCancel={() => setEditProjectDialogOpen(false)}
                    editingProject={editingProject}
                    initialData={editingProject ? {
                        name: editingProject.name,
                        description: editingProject.description,
                        iconFile: null,
                        item_name_singular: editingProject.item_name_singular || 'задача',
                        item_name_nominative: editingProject.item_name_nominative || 'задачи',
                        item_name_genitive: editingProject.item_name_genitive || 'задач',
                        item_name_accusative: editingProject.item_name_accusative || 'задачу'
                    } : undefined}
                    defaultIcons={defaultIcons}
                    currentUserId={currentUserId}
                    projectMembers={editingProject?.members || []}
                    removeProjectMember={() => { }}
                    availableUsers={members.map(member => ({
                        id: member.user_id,
                        first_name: member.first_name || '',
                        last_name: member.last_name || '',
                        email: member.email,
                        position: member.position
                    }))}
                />
            </CustomDialog>

            {/* Delete Project Confirmation Dialog */}
            <CustomDialog
                open={deleteProjectDialogOpen}
                onClose={() => setDeleteProjectDialogOpen(false)}
                title="Подтверждение удаления"
                maxWidth="sm"
            >
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Вы уверены, что хотите удалить проект "{projectToDelete?.name}"?
                        </Typography>
                        <Typography variant="body2">
                            Все задачи, комментарии и данные проекта будут безвозвратно удалены.
                            Это действие нельзя отменить.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteProjectDialogOpen(false)} sx={{ color: '#fff' }}>
                        Отмена
                    </Button>
                    <Button
                        onClick={handleDeleteProject}
                        variant="contained"
                        color="error"
                        sx={{
                            bgcolor: '#f06a6a',
                            '&:hover': { bgcolor: '#d55a5a' }
                        }}
                    >
                        Удалить проект
                    </Button>
                </DialogActions>
            </CustomDialog>
        </Container>
    );
};

export default WorkspaceView;
