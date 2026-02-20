import React, { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CreateWorkspaceDto } from '../types/workspace';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const CreateWorkspace: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<CreateWorkspaceDto>({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Название рабочего пространства обязательно');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/workspaces`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create workspace');
            }

            const workspace = await response.json();
            navigate(`/workspaces/${workspace.uuid}`);
        } catch (err: any) {
            setError(err.message || 'Ошибка при создании рабочего пространства');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/workspaces');
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{
                p: 4,
                boxShadow: 'none',
                backgroundColor: '#212134',
            }}>
                <Typography variant="h4" gutterBottom>
                    Добавление воркспейса
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    поможет организовать ваши проекты
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Название *"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoFocus
                        helperText="Например: Разработка мобильного приложения"
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                bgcolor: '#12141b',
                                color: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34',
                                    transition: 'border-color 0.5s cubic-bezier(0.4,0,0.2,1)',

                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#4e55e8',
                                    borderWidth: '1px'
                                },
                            },
                        }}
                        InputLabelProps={{
                            sx: {
                                color: '#6b6f7e',
                                '&.Mui-focused': {
                                    color: '#4e55e8',
                                }
                            }
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Описание"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        margin="normal"
                        multiline
                        rows={4}
                        helperText="Краткое описание целей и задач"
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                bgcolor: '#12141b',
                                color: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34',
                                    transition: 'border-color 0.5s cubic-bezier(0.4,0,0.2,1)',

                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#4e55e8',
                                    borderWidth: '1px'
                                },
                            },
                        }}
                        InputLabelProps={{
                            sx: {
                                color: '#6b6f7e',
                                '&.Mui-focused': {
                                    color: '#4e55e8',
                                }
                            }
                        }}
                    />

                    <Box display="flex" gap={2} mt={3}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            fullWidth
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
                            {loading ? 'Создание...' : 'Создать'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={handleCancel}
                            disabled={loading}
                            sx={{
                                bgcolor: '#212134',
                                borderColor: '#4a4a6a',
                                color: '#fff',
                                fontSize: '0.875rem',
                                px: 10,
                                py: 1,
                                '&:hover': { bgcolor: '#181826' }
                            }}
                        >
                            Отменить
                        </Button>
                    </Box>
                </form>

                <Box mt={4} p={2} bgcolor="background.default" borderRadius={1}>
                    <Typography variant="subtitle2" gutterBottom>
                        После создания вы сможете:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
                        <li>Создавать проекты внутри пространства</li>
                        <li>Приглашать участников в команду</li>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default CreateWorkspace;

