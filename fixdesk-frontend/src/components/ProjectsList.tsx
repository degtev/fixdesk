import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Avatar,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    BugReport as BugIcon,
    Group as GroupIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    People as PeopleIcon,
    Crop as CropIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import CustomDialog from './CustomDialog';
import { io as socketIOClient } from 'socket.io-client';
import ProjectForm from './ProjectForm';

interface Project {
    id: number;
    name: string;
    description: string;
    icon_url: string;
    created_by: number;
    created_at: string;
    item_name_singular?: string;
    item_name_nominative?: string;
    item_name_genitive?: string;
    item_name_accusative?: string
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    position?: string;
    avatar_url?: string;
}

function ProjectsList() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [participatingProjects, setParticipatingProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [defaultIcons, setDefaultIcons] = useState<string[]>([]);
    const [members] = useState<User[]>([]);
    const [bugLists] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [projectMembers, setProjectMembers] = useState<User[]>([]);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        iconFile: null as File | null
    });

    const [removeIcon, setRemoveIcon] = useState(false);

    useEffect(() => {
        loadDefaultIcons();
        loadCurrentUser();
    }, []);

    useEffect(() => {
        if (!currentUserId) return;
        const socket = socketIOClient(import.meta.env.VITE_SOCKET_URL);
        socket.emit('join_user', currentUserId);
        const handleProjectCreated = (data: any) => {
            setParticipatingProjects(prev => {
                if (prev.some(p => p.id === data.project.id)) return prev;
                return [data.project, ...prev];
            });
        };
        const handleProjectUpdated = (data: any) => {
            setParticipatingProjects(prev => {
                const exists = prev.some(p => p.id === data.project.id);
                if (exists) {
                    return prev.map(p => p.id === data.project.id ? data.project : p);
                } else {
                    return [data.project, ...prev];
                }
            });
        };
        const handleProjectRemoved = (data: any) => {
            setParticipatingProjects(prev => prev.filter(p => p.id !== data.projectId));
        };
        socket.on('project_created', handleProjectCreated);
        socket.on('project_updated', handleProjectUpdated);
        socket.on('project_removed', handleProjectRemoved);
        return () => {
            socket.off('project_created', handleProjectCreated);
            socket.off('project_updated', handleProjectUpdated);
            socket.off('project_removed', handleProjectRemoved);
            socket.disconnect();
        };
    }, [currentUserId]);

    const loadProjects = async (userId?: number | null) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/projects`, config);

            const projects = response.data;

            const actualUserId = userId !== undefined ? userId : currentUserId;

            if (actualUserId !== null && actualUserId !== undefined) {
                const myProjectsList = projects.filter((project: Project) =>
                    Number(project.created_by) === Number(actualUserId)
                );

                const participatingProjectsList = projects.filter((project: Project) =>
                    Number(project.created_by) !== Number(actualUserId)
                );

                setMyProjects(myProjectsList);
                setParticipatingProjects(participatingProjectsList);
            } else {
                setMyProjects([]);
                setParticipatingProjects(projects);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/me`, config);
            setCurrentUserId(response.data.id);

            await loadProjects(response.data.id);
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    };

    const loadDefaultIcons = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/projects/default-icons`);
            setDefaultIcons(response.data.icons || []);
        } catch (error) {
            console.error('Ошибка:', error);
            setDefaultIcons([
                '',
            ]);
        }
    };

    const loadProjectMembers = async (projectUuid: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/projects/${projectUuid}/members`, config);
            setProjectMembers(response.data);
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    const removeProjectMember = async (projectUuid: string, userId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/projects/${projectUuid}/members/${userId}`, config);

            await loadProjectMembers(projectUuid);

            setSnackbar({
                open: true,
                message: 'Участник удален из проекта',
                severity: 'success'
            });
        } catch (error: any) {
            console.error('Ошибка:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Ошибка удаления участника',
                severity: 'error'
            });
        }
    };

    const deleteProject = async (projectUuid: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/projects/${projectUuid}`, config);

            await loadProjects(currentUserId);

            setSnackbar({
                open: true,
                message: 'Проект успешно удален',
                severity: 'success'
            });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Ошибка удаления проекта',
                severity: 'error'
            });
        }
    };

    const searchUsers = async (email: string) => {
        if (!email || email.length < 2) {
            // setSearchResults([]);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/projects/search/users?email=${email}`,
                config
            );
            // setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleCreateProject = async (data: any) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            const formDataToSend = new FormData();
            formDataToSend.append('name', data.name);
            formDataToSend.append('description', data.description);
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
                `${import.meta.env.VITE_BACKEND_URL}/projects`,
                formDataToSend,
                config
            );

            setSnackbar({
                open: true,
                message: 'Проект успешно создан',
                severity: 'success'
            });

            setCreateDialogOpen(false);
            resetForm();
            loadProjects(currentUserId);
        } catch (error: any) {
            console.error('Ошибка создания проекта:', error);
            console.error('Детали ошибки:', error.response?.data);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Ошибка создания проекта',
                severity: 'error'
            });
        }
    };

    const handleEditProject = async (data: any) => {
        try {
            if (!editingProject) return;
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
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

            if (data.removeIcon) {
                formDataToSend.append('iconType', 'remove');
            } else if (data.iconFile) {
                formDataToSend.append('iconType', 'upload');
                formDataToSend.append('icon', data.iconFile);
            }
            if (data.members && data.members.length > 0) {
                data.members.forEach((user: any) => {
                    formDataToSend.append('members', user.id.toString());
                });
            }
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/projects/${editingProject.uuid}`,
                formDataToSend,
                config
            );
            setSnackbar({
                open: true,
                message: 'Проект успешно обновлен',
                severity: 'success'
            });
            setEditDialogOpen(false);
            setEditingProject(null);
            resetForm();
            setRemoveIcon(false);
            loadProjects(currentUserId);
        } catch (error: any) {
            console.error('Ошибка обновления проекта:', error);
            console.error('Детали ошибки:', error.response?.data);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Ошибка обновления проекта',
                severity: 'error'
            });
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            iconFile: null
        });
        setRemoveIcon(false);
    };

    const openEditDialog = async (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description,
            iconFile: null
        });
        setRemoveIcon(false);
        setEditDialogOpen(true);

        await loadProjectMembers(project.uuid);
    };

    const openDeleteDialog = (project: Project) => {
        setDeletingProject(project);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deletingProject) {
            await deleteProject(deletingProject.uuid);
            setDeleteDialogOpen(false);
            setDeletingProject(null);
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setDeletingProject(null);
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const ProjectCard = ({ project }: { project: Project }) => {
        const [membersCount, setMembersCount] = useState<number | null>(null);
        const [bugsCount, setBugsCount] = useState<number | null>(null);
        const [closedBugsCount, setClosedBugsCount] = useState<number | null>(null);
        const navigate = useNavigate();

        useEffect(() => {
            const fetchCounts = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    const config = { headers: { 'Authorization': `Bearer ${token}` } };
                    const membersRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/projects/${project.uuid}/members`, config);
                    setMembersCount(membersRes.data.length);
                    const bugsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/bugs/project/${project.id}`, config);
                    setBugsCount(bugsRes.data.length);
                    setClosedBugsCount(bugsRes.data.filter((bug: any) => bug.status === 'resolved' || bug.status === 'closed').length);
                } catch (e) {
                    setMembersCount(null);
                    setBugsCount(null);
                    setClosedBugsCount(null);
                }
            };
            fetchCounts();
        }, [project.id]);

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
                            src={`${import.meta.env.VITE_BACKEND_URL}${project.icon_url}`}
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
                            icon={<BugIcon />}
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
                        {currentUserId === parseInt(project.created_by.toString()) && (
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
                                    await openEditDialog(project);
                                }}
                                title="Редактировать проект"
                            >
                                <EditIcon />
                            </IconButton>
                        )}
                        {currentUserId === parseInt(project.created_by.toString()) && (
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
                                    openDeleteDialog(project);
                                }}
                                title="Удалить проект"
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}
                    </Box>
                </CardActions>
            </Card>
        );
    };

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                flexDirection: 'column',
                gap: 2
            }}>
                <CircularProgress sx={{ color: '#f06a6a' }} />
                <Typography variant="body1" sx={{ color: '#cccccc' }}>
                    Загрузка проектов...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            py: 4,
            px: { xs: 2, md: 4 },
            '@keyframes fadeInUp': {
                '0%': {
                    opacity: 0,
                    transform: 'translateY(20px)'
                },
                '100%': {
                    opacity: 1,
                    transform: 'translateY(0)'
                }
            }
        }}>
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" sx={{
                        color: '#fff',
                        fontWeight: 'bold'
                    }}>
                        Проекты
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
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

                {myProjects.length > 0 && (
                    <Box sx={{
                        mb: 4,
                        animation: 'fadeInUp 0.6s ease-out'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <PersonIcon sx={{
                                color: '#fff',
                                mr: 1,
                                fontSize: 24
                            }} />
                            <Typography variant="h5" sx={{
                                color: '#fff',
                                fontWeight: 'bold'
                            }}>
                                Мои проекты ({myProjects.length})
                            </Typography>
                        </Box>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 3
                        }}>
                            {myProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </Box>
                    </Box>
                )}

                {participatingProjects.length > 0 && (
                    <Box sx={{
                        mb: 4,
                        animation: 'fadeInUp 0.6s ease-out 0.2s both'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <PeopleIcon sx={{
                                color: '#fff',
                                mr: 1,
                                fontSize: 24
                            }} />
                            <Typography variant="h5" sx={{
                                color: '#fff',
                                fontWeight: 'bold'
                            }}>
                                Проекты, в которых я участвую ({participatingProjects.length})
                            </Typography>
                        </Box>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 3
                        }}>
                            {participatingProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </Box>
                    </Box>
                )}

                {myProjects.length === 0 && participatingProjects.length === 0 && (
                    <Box sx={{
                        textAlign: 'center',
                        py: 8,
                        background: '#212134',
                        borderRadius: 3,
                        border: '1px solid #32324d',
                    }}>
                        <Typography variant="h6" sx={{
                            mb: 2,
                            color: '#fff',
                            fontWeight: 'bold'
                        }}>
                            У вас пока нет проектов
                        </Typography>
                        <Typography variant="body1" sx={{
                            color: '#cccccc',
                            mb: 3,
                            maxWidth: 500,
                            mx: 'auto'
                        }}>
                            Создайте первый проект или присоединитесь к существующему, чтобы начать работу
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateDialogOpen(true)}
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
                )}
            </Box>

            <CustomDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                title="Создать новый проект"
                maxWidth="md"
                fullWidth
            >
                <ProjectForm
                    mode="create"
                    onSubmit={handleCreateProject}
                    onCancel={() => setCreateDialogOpen(false)}
                    defaultIcons={defaultIcons}
                    currentUserId={currentUserId}
                    projectMembers={[]}
                    removeProjectMember={() => { }}
                />
            </CustomDialog>

            <CustomDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                title="Редактировать проект"
                maxWidth="md"
                fullWidth
            >
                <ProjectForm
                    mode="edit"
                    onSubmit={handleEditProject}
                    onCancel={() => setEditDialogOpen(false)}
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
                    projectMembers={projectMembers}
                    removeProjectMember={removeProjectMember}
                />
            </CustomDialog>

            <CustomDialog
                open={deleteDialogOpen}
                onClose={handleCancelDelete}
                title="Подтверждение удаления"
                maxWidth="sm"
                titleSx={{ color: '#f44336', }}
                actions={
                    <>
                        <Button onClick={handleCancelDelete}>
                            Отмена
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            variant="contained"
                        >
                            Удалить
                        </Button>
                    </>
                }
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Вы действительно хотите удалить проект <strong style={{ color: '#fff' }}>"{deletingProject?.name}"</strong>?
                    </Typography>
                    <Box data-error="true" sx={{ p: 2, bgcolor: 'transparent', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#fff', }}>
                            Это действие нельзя отменить. Все данные проекта, включая вложенные элементы и комментарии, будут безвозвратно удалены.
                        </Typography>
                    </Box>
                </Box>
            </CustomDialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        bgcolor: snackbar.severity === 'success' ? 'rgba(76, 175, 80, 0.1)' :
                            snackbar.severity === 'error' ? 'rgba(244, 67, 54, 0.1)' :
                                snackbar.severity === 'warning' ? 'rgba(255, 152, 0, 0.1)' :
                                    'rgba(33, 150, 243, 0.1)',
                        border: snackbar.severity === 'success' ? '1px solid #4caf50' :
                            snackbar.severity === 'error' ? '1px solid #f44336' :
                                snackbar.severity === 'warning' ? '1px solid #ff9800' :
                                    '1px solid #2196f3',
                        color: snackbar.severity === 'success' ? '#4caf50' :
                            snackbar.severity === 'error' ? '#f44336' :
                                snackbar.severity === 'warning' ? '#ff9800' :
                                    '#2196f3',
                        '& .MuiAlert-icon': {
                            color: snackbar.severity === 'success' ? '#4caf50' :
                                snackbar.severity === 'error' ? '#f44336' :
                                    snackbar.severity === 'warning' ? '#ff9800' :
                                        '#2196f3'
                        }
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default ProjectsList; 