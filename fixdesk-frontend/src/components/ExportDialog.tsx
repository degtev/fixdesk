import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    FormGroup,
    FormControlLabel,
    Checkbox,
    RadioGroup,
    Radio,
    FormLabel,
    Box,
    Typography,
    Alert
} from '@mui/material';
import {
    FileDownload as FileDownloadIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
    projectUuid: string;
}

interface ExportFields {
    title: boolean;
    description: boolean;
    creator: boolean;
    assignee: boolean;
    status: boolean;
    priority: boolean;
    created_at: boolean;
    updated_at: boolean;
    total_time: boolean;
}

function ExportDialog({ open, onClose, projectUuid }: ExportDialogProps) {
    const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
    const [fields, setFields] = useState<ExportFields>({
        title: true,
        description: true,
        creator: true,
        assignee: true,
        status: true,
        priority: true,
        created_at: true,
        updated_at: true,
        total_time: true
    });
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFieldChange = (field: keyof ExportFields) => {
        setFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSelectAll = () => {
        const allSelected = Object.values(fields).every(v => v);
        const newValue = !allSelected;
        setFields({
            title: newValue,
            description: newValue,
            creator: newValue,
            assignee: newValue,
            status: newValue,
            priority: newValue,
            created_at: newValue,
            updated_at: newValue,
            total_time: newValue
        });
    };

    const handleExport = async () => {
        setError(null);

        const selectedFields = Object.keys(fields).filter(
            key => fields[key as keyof ExportFields]
        );

        if (selectedFields.length === 0) {
            setError('Выберите хотя бы одно поле для экспорта');
            return;
        }

        setExporting(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Не авторизован');
                return;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/projects/${projectUuid}/export`,
                {
                    format,
                    fields: selectedFields
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `export_${projectUuid}_${Date.now()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            onClose();
        } catch (error: any) {
            console.error('Error exporting:', error);
            setError(error.response?.data?.message || 'Ошибка экспорта');
        } finally {
            setExporting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: 'transparent',
                        pointerEvents: 'none'
                    }
                }
            }}
            PaperProps={{
                elevation: 0,
                sx: {
                    bgcolor: '#1d212d',
                    color: '#fff',
                    borderRadius: 3,
                    border: '1px solid #32324d'
                }
            }}
        >
            <DialogTitle sx={{
                bgcolor: '#212134',
                color: '#fff',
                borderBottom: '1px solid #32324d',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
            }}>

                <Typography variant="h6">Экспорт элементов</Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2,
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            color: '#f44336',
                            border: '1px solid #f44336'
                        }}
                    >
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 3, mt: 3 }}>
                    <FormLabel component="legend" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
                        Формат файла
                    </FormLabel>
                    <RadioGroup
                        value={format}
                        onChange={(e) => setFormat(e.target.value as 'csv' | 'xlsx')}
                        row
                    >
                        <FormControlLabel
                            value="xlsx"
                            control={<Radio sx={{ color: '#4945ff', '&.Mui-checked': { color: '#4945ff' } }} />}
                            label="XLSX (Excel)"
                            sx={{ color: '#cccccc' }}
                        />
                        <FormControlLabel
                            value="csv"
                            control={<Radio sx={{ color: '#4945ff', '&.Mui-checked': { color: '#4945ff' } }} />}
                            label="CSV"
                            sx={{ color: '#cccccc' }}
                        />
                    </RadioGroup>
                </Box>

                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <FormLabel component="legend" sx={{ color: '#fff', fontWeight: 'bold' }}>
                            Поля для экспорта
                        </FormLabel>
                        <Button
                            size="small"
                            onClick={handleSelectAll}
                            sx={{
                                color: '#4945ff',
                                '&:hover': { bgcolor: 'rgba(73, 69, 255, 0.1)' }
                            }}
                        >
                            {Object.values(fields).every(v => v) ? 'Снять все' : 'Выбрать все'}
                        </Button>
                    </Box>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fields.title}
                                    onChange={() => handleFieldChange('title')}
                                    sx={{
                                        color: '#4945ff',
                                        '&.Mui-checked': { color: '#4945ff' }
                                    }}
                                />
                            }
                            label="Название"
                            sx={{ color: '#cccccc' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fields.description}
                                    onChange={() => handleFieldChange('description')}
                                    sx={{
                                        color: '#4945ff',
                                        '&.Mui-checked': { color: '#4945ff' }
                                    }}
                                />
                            }
                            label="Описание"
                            sx={{ color: '#cccccc' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fields.creator}
                                    onChange={() => handleFieldChange('creator')}
                                    sx={{
                                        color: '#4945ff',
                                        '&.Mui-checked': { color: '#4945ff' }
                                    }}
                                />
                            }
                            label="Постановщик"
                            sx={{ color: '#cccccc' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fields.assignee}
                                    onChange={() => handleFieldChange('assignee')}
                                    sx={{
                                        color: '#4945ff',
                                        '&.Mui-checked': { color: '#4945ff' }
                                    }}
                                />
                            }
                            label="Исполнитель"
                            sx={{ color: '#cccccc' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fields.status}
                                    onChange={() => handleFieldChange('status')}
                                    sx={{
                                        color: '#4945ff',
                                        '&.Mui-checked': { color: '#4945ff' }
                                    }}
                                />
                            }
                            label="Статус"
                            sx={{ color: '#cccccc' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fields.priority}
                                    onChange={() => handleFieldChange('priority')}
                                    sx={{
                                        color: '#4945ff',
                                        '&.Mui-checked': { color: '#4945ff' }
                                    }}
                                />
                            }
                            label="Приоритет"
                            sx={{ color: '#cccccc' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fields.created_at}
                                    onChange={() => handleFieldChange('created_at')}
                                    sx={{
                                        color: '#4945ff',
                                        '&.Mui-checked': { color: '#4945ff' }
                                    }}
                                />
                            }
                            label="Дата создания"
                            sx={{ color: '#cccccc' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fields.updated_at}
                                    onChange={() => handleFieldChange('updated_at')}
                                    sx={{
                                        color: '#4945ff',
                                        '&.Mui-checked': { color: '#4945ff' }
                                    }}
                                />
                            }
                            label="Дата обновления"
                            sx={{ color: '#cccccc' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={fields.total_time}
                                    onChange={() => handleFieldChange('total_time')}
                                    sx={{
                                        color: '#4945ff',
                                        '&.Mui-checked': { color: '#4945ff' }
                                    }}
                                />
                            }
                            label="Общее время"
                            sx={{ color: '#cccccc' }}
                        />
                    </FormGroup>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                bgcolor: '#212134',
                borderTop: '1px solid #32324d',
                p: 2
            }}>
                <Button
                    onClick={onClose}
                    sx={{
                        color: '#cccccc',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                    }}
                >
                    Отмена
                </Button>
                <Button
                    onClick={handleExport}
                    variant="contained"
                    disabled={exporting}
                    sx={{
                        bgcolor: '#4945ff',
                        '&:hover': { bgcolor: '#7b79ff' },
                        '&:disabled': { bgcolor: '#32324d', color: '#666' }
                    }}
                >
                    {exporting ? 'Экспорт...' : 'Экспортировать'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ExportDialog;

