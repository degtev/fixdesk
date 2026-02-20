import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import { Add as AddIcon, Group as GroupIcon, Work as WorkIcon, People as PeopleIcon, Folder as FolderIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { WorkspaceWithStats } from '../types/workspace';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const WorkspacesList: React.FC = () => {
    const [myWorkspaces, setMyWorkspaces] = useState<WorkspaceWithStats[]>([]);
    const [participatingWorkspaces, setParticipatingWorkspaces] = useState<WorkspaceWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/workspaces`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch workspaces');
            }

            const data = await response.json();

            const owned = data.filter((ws: WorkspaceWithStats) => ws.is_owner);
            const participating = data.filter((ws: WorkspaceWithStats) => !ws.is_owner);

            setMyWorkspaces(owned);
            setParticipatingWorkspaces(participating);
        } catch (err) {
            setError('Ошибка при загрузке рабочих пространств');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = () => {
        navigate('/workspaces/create');
    };

    const handleWorkspaceClick = (workspaceUuid: string) => {
        navigate(`/workspaces/${workspaceUuid}`);
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

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={10}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Мое рабочее пространство
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Управляйте своими воркспейсамии и проектами
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateWorkspace}
                    size="large"
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
                    Создать воркспейс
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {myWorkspaces.length === 0 && participatingWorkspaces.length === 0 ? (
                <Card elevation={0} sx={{
                    textAlign: 'center',
                    py: 8,
                    boxShadow: 'none',
                    p: 4,
                    backgroundColor: '#212134',
                }}>
                    <CardContent>
                        <WorkIcon sx={{ fontSize: 80, color: '#fff', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            У вас пока нет воркспейса
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Создайте воркспейс для организации проектов
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateWorkspace}
                            size="large"
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
                            Создать
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {myWorkspaces.length > 0 && (
                        <Box mb={4}>
                            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                Мои воркспейсы
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                gap: 3
                            }}>
                                {myWorkspaces.map((workspace) => (
                                    <Box key={workspace.id}>
                                        <Card
                                            sx={{
                                                background: '#212134',
                                                border: '1px solid #32324d',
                                                borderRadius: 3,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    borderColor: '#c0c0cf'
                                                }
                                            }}
                                            onClick={() => handleWorkspaceClick(workspace.uuid)}
                                        >
                                            <CardContent sx={{ flexGrow: 1 }}>

                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                                                    <WorkIcon color="#fff" sx={{ fontSize: 30 }} />
                                                    <Box>
                                                        <Typography variant="h6" sx={{
                                                            fontWeight: 'bold',
                                                            color: '#ffffff'
                                                        }}>
                                                            {workspace.name}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{
                                                            color: '#cccccc',
                                                            fontSize: '0.875rem',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                        }}>
                                                            {workspace.description || 'Нет описания'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Chip
                                                    label="Владелец"
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ mb: 2 }}
                                                />
                                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                    <Chip
                                                        icon={<GroupIcon />}
                                                        label={workspace.member_count !== null ? `Участники: ${workspace.member_count}` : 'Участники'}
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
                                                        icon={<WorkIcon />}
                                                        label={workspace.project_count !== null ? `Проекты: ${workspace.project_count}` : 'Проекты'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'transparent',
                                                            color: '#fff',
                                                            '& .MuiChip-icon': {
                                                                color: '#fff'
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </CardContent>
                                            <CardActions sx={{ px: 2, pb: 2 }}>
                                                <Button
                                                    size="small"
                                                    fullWidth
                                                    variant="outlined"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleWorkspaceClick(workspace.uuid);
                                                    }}
                                                    sx={{
                                                        bgcolor: '#212134',
                                                        border: 'none',
                                                        color: '#fff',
                                                        fontSize: '0.875rem',
                                                        px: 2,
                                                        py: 1,
                                                        '&:hover': { bgcolor: '#181826' }
                                                    }}
                                                >
                                                    Открыть
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {participatingWorkspaces.length > 0 && (
                        <Box>
                            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                Воркспейсы, в которых я участвую
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                gap: 3
                            }}>
                                {participatingWorkspaces.map((workspace) => (
                                    <Box key={workspace.id}>
                                        <Card
                                            sx={{
                                                background: '#212134',
                                                border: '1px solid #32324d',
                                                borderRadius: 3,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    borderColor: '#c0c0cf'
                                                }
                                            }}
                                            onClick={() => handleWorkspaceClick(workspace.uuid)}
                                        >
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                                                    <WorkIcon color="#fff" sx={{ fontSize: 30 }} />
                                                    <Box>
                                                        <Typography variant="h6" sx={{
                                                            fontWeight: 'bold',
                                                            color: '#ffffff'
                                                        }}>
                                                            {workspace.name}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{
                                                            color: '#cccccc',
                                                            fontSize: '0.875rem',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                        }}>
                                                            {workspace.description || 'Нет описания'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Chip
                                                    label="Участник"
                                                    size="small"
                                                    color="secondary"
                                                    variant="outlined"
                                                    sx={{ mb: 2 }}
                                                />
                                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                    <Chip
                                                        icon={<GroupIcon />}
                                                        label={workspace.member_count !== null ? `Участники: ${workspace.member_count}` : 'Участники'}
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
                                                        icon={<WorkIcon />}
                                                        label={workspace.project_count !== null ? `Проекты: ${workspace.project_count}` : 'Проекты'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'transparent',
                                                            color: '#fff',
                                                            '& .MuiChip-icon': {
                                                                color: '#fff'
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </CardContent>
                                            <CardActions sx={{ px: 2, pb: 2 }}>
                                                <Button
                                                    size="small"
                                                    fullWidth
                                                    variant="outlined"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleWorkspaceClick(workspace.uuid);
                                                    }}
                                                    sx={{
                                                        bgcolor: '#212134',
                                                        border: 'none',
                                                        color: '#fff',
                                                        fontSize: '0.875rem',
                                                        px: 2,
                                                        py: 1,
                                                        '&:hover': { bgcolor: '#181826' }
                                                    }}
                                                >
                                                    Открыть
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
};

export default WorkspacesList;

