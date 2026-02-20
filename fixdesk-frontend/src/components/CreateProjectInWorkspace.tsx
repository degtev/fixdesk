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
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const CreateProjectInWorkspace: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
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
        
        if (!formData.name.trim() || !formData.description.trim()) {
            setError('Название и описание проекта обязательны');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('workspace_id', workspaceId!);
            formDataToSend.append('iconType', 'default');

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/projects`,
                formDataToSend,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data && response.data.uuid) {
                navigate(`/project/${response.data.uuid}`);
            } else {
                navigate(`/workspaces/${workspaceId}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при создании проекта');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(`/workspaces/${workspaceId}`);
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Создать проект
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Создайте новый проект в рабочем пространстве
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Название проекта *"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoFocus
                        helperText="Краткое и понятное название проекта"
                    />

                    <TextField
                        fullWidth
                        label="Описание проекта *"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        margin="normal"
                        multiline
                        rows={4}
                        required
                        helperText="Подробное описание целей и задач проекта"
                    />

                    <Box display="flex" gap={2} mt={3}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? 'Создание...' : 'Создать проект'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Отмена
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default CreateProjectInWorkspace;

