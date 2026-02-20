import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, Button, List, ListItem, CircularProgress, Alert } from '@mui/material';

interface Project {
    id: number;
    name: string;
    description?: string;
    created_by?: number;
}

function CreateProject() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [creating, setCreating] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            setError('Пользователь не авторизован');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        axios
            .get(`${import.meta.env.VITE_BACKEND_URL}/projects/create`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then(res => {
                if (Array.isArray(res.data)) {
                    setProjects(res.data);
                } else if (Array.isArray(res.data.projects)) {
                    setProjects(res.data.projects);
                } else {
                    setProjects([]);
                }
            })
            .catch(err => {
                setError('Ошибка загрузки проектов: ' + (err.response?.data?.message || err.message));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token]);

    const handleCreate = () => {
        if (!newProjectName.trim()) {
            setError('Название проекта обязательно');
            return;
        }
        if (!token) {
            setError('Пользователь не авторизован');
            return;
        }

        setCreating(true);
        setError('');
        axios
            .post(
                `${import.meta.env.VITE_BACKEND_URL}/projects`,
                { name: newProjectName.trim(), description: newProjectDesc.trim() },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            .then(res => {
                if (res.data && res.data.id) {
                    setProjects(prev => [...prev, res.data]);
                    setNewProjectName('');
                    setNewProjectDesc('');
                } else {
                    setError('Ошибка: неверный ответ от сервера при создании проекта');
                }
            })
            .catch(err => {
                setError('Ошибка при создании проекта: ' + (err.response?.data?.message || err.message));
            })
            .finally(() => setCreating(false));
    };

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ p: 3, maxWidth: 600, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Проекты
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <List>
                {(projects && Array.isArray(projects) ? projects : []).map(proj => (
                    <ListItem key={proj.id} divider>
                        <Box>
                            <Typography variant="h6">{proj.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {proj.description || 'Без описания'}
                            </Typography>
                        </Box>
                    </ListItem>
                ))}
            </List>

            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Создать проект
                </Typography>
                <TextField
                    label="Название"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    name="name"
                />
                <TextField
                    label="Описание"
                    value={newProjectDesc}
                    onChange={e => setNewProjectDesc(e.target.value)}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={3}
                    name="description"
                />
                <Button variant="contained" onClick={handleCreate} disabled={creating}>
                    {creating ? 'Создаем...' : 'Создать'}
                </Button>
            </Box>
        </Box>
    );
}

export default CreateProject;
