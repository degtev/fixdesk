import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Box,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import {
    FileUpload as FileUploadIcon,
    Close as CloseIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface ImportDialogProps {
    open: boolean;
    onClose: () => void;
    projectUuid: string;
    onImportComplete: () => void;
}

interface PreviewData {
    preview: any[];
    columns: string[];
    totalRows: number;
}

function ImportDialog({ open, onClose, projectUuid, onImportComplete }: ImportDialogProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [delimiter, setDelimiter] = useState(';');
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [columnMapping, setColumnMapping] = useState<{
        title: string;
        description: string;
    }>({
        title: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<{
        imported: number;
        total: number;
        errors: string[];
    } | null>(null);

    const steps = ['Загрузка файла', 'Настройка', 'Предпросмотр', 'Импорт'];

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
            setError('Поддерживаются только файлы CSV и XLSX');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setPreviewData(null);
        setColumnMapping({ title: '', description: '' });
    };

    const handlePreview = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Не авторизован');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('delimiter', delimiter);
            formData.append('columnMapping', JSON.stringify(columnMapping));

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/projects/${projectUuid}/import/preview`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setPreviewData(response.data);

            if (response.data.columns.length > 0) {
                const titleCol = response.data.columns.find((col: string) =>
                    col.toLowerCase().includes('назв') ||
                    col.toLowerCase().includes('title') ||
                    col.toLowerCase().includes('name')
                ) || response.data.columns[0];

                const descCol = response.data.columns.find((col: string) =>
                    col.toLowerCase().includes('опис') ||
                    col.toLowerCase().includes('description') ||
                    col.toLowerCase().includes('desc')
                ) || (response.data.columns[1] || response.data.columns[0]);

                setColumnMapping({
                    title: titleCol,
                    description: descCol
                });
            }

            setActiveStep(2);
        } catch (error: any) {
            console.error('Error previewing:', error);
            setError(error.response?.data?.message || 'Ошибка предпросмотра');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!file || !columnMapping.title) {
            setError('Необходимо указать колонку для названия');
            return;
        }

        setImporting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Не авторизован');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('delimiter', delimiter);
            formData.append('columnMapping', JSON.stringify(columnMapping));

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/projects/${projectUuid}/import`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setImportResult(response.data);
            setActiveStep(3);
            onImportComplete();
        } catch (error: any) {
            console.error('Error importing:', error);
            setError(error.response?.data?.message || 'Ошибка импорта');
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setActiveStep(0);
        setFile(null);
        setDelimiter(';');
        setPreviewData(null);
        setColumnMapping({ title: '', description: '' });
        setError(null);
        setImportResult(null);
        onClose();
    };

    const handleNext = () => {
        if (activeStep === 0 && file) {
            setActiveStep(1);
        } else if (activeStep === 1) {
            handlePreview();
        } else if (activeStep === 2) {
            handleImport();
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
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
                gap: 1
            }}>

                <Typography variant="h6">Импорт элементов</Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel
                                sx={{
                                    '& .MuiStepLabel-label': { color: '#cccccc' },
                                    '& .MuiStepLabel-label.Mui-active': { color: '#fff' },
                                    '& .MuiStepLabel-label.Mui-completed': { color: '#4caf50' },
                                    '& .MuiStepIcon-root': { color: '#32324d' },
                                    '& .MuiStepIcon-root.Mui-active': { color: '#fff' },
                                    '& .MuiStepIcon-root.Mui-completed': { color: '#4caf50' }
                                }}
                            >
                                {label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2,
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            color: '#f44336',
                            border: '1px solid #f44336'
                        }}
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                {/* Шаг 1: Загрузка файла */}
                {activeStep === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <input
                            accept=".csv,.xlsx,.xls"
                            style={{ display: 'none' }}
                            id="import-file"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="import-file">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUploadIcon />}
                                sx={{
                                    borderColor: '#4945ff',
                                    color: '#4945ff',
                                    '&:hover': {
                                        borderColor: '#7b79ff',
                                        bgcolor: 'rgba(73, 69, 255, 0.1)'
                                    },
                                    py: 2,
                                    px: 4
                                }}
                            >
                                Выбрать файл
                            </Button>
                        </label>
                        {file && (
                            <Typography variant="body2" sx={{ mt: 2, color: '#4caf50' }}>
                                Выбран файл: {file.name}
                            </Typography>
                        )}
                        <Typography variant="body2" sx={{ mt: 2, color: '#cccccc' }}>
                            Поддерживаются форматы: CSV, XLSX
                        </Typography>
                    </Box>
                )}

                {/* Шаг 2: Настройка */}
                {activeStep === 1 && (
                    <Box>
                        {file?.name.endsWith('.csv') && (
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel
                                    sx={{
                                        color: '#cccccc',
                                        '&.Mui-focused': { color: '#4945ff' }
                                    }}
                                >
                                    Разделитель
                                </InputLabel>
                                <Select
                                    value={delimiter}
                                    onChange={(e) => setDelimiter(e.target.value)}
                                    label="Разделитель"
                                    sx={{
                                        color: '#fff',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#32324d'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#4945ff'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#4945ff'
                                        }
                                    }}
                                >
                                    <MenuItem value=";" sx={{ bgcolor: '#1a1a1a', color: '#fff' }}>Точка с запятой (;)</MenuItem>
                                    <MenuItem value="," sx={{ bgcolor: '#1a1a1a', color: '#fff' }}>Запятая (,)</MenuItem>
                                    <MenuItem value="\t" sx={{ bgcolor: '#1a1a1a', color: '#fff' }}>Табуляция</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        <Alert
                            severity="info"
                            sx={{
                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                color: '#2196f3',
                                border: '1px solid #2196f3'
                            }}
                        >
                            На следующем шаге вы сможете сопоставить колонки из файла с полями системы.
                            Все импортированные элементы будут созданы с первым статусом и приоритетом,
                            а постановщиком станете вы.
                        </Alert>
                    </Box>
                )}

                {/* Шаг 3: Предпросмотр и сопоставление */}
                {activeStep === 2 && previewData && (
                    <Box>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Сопоставление колонок
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <FormControl fullWidth required>
                                    <InputLabel
                                        sx={{
                                            color: '#cccccc',
                                            '&.Mui-focused': { color: '#4945ff' }
                                        }}
                                    >
                                        Название *
                                    </InputLabel>
                                    <Select
                                        value={columnMapping.title}
                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, title: e.target.value }))}
                                        label="Название *"
                                        sx={{
                                            color: '#fff',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#32324d'
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#4945ff'
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#4945ff'
                                            }
                                        }}
                                    >
                                        {previewData.columns.map(col => (
                                            <MenuItem key={col} value={col} sx={{ bgcolor: '#1a1a1a', color: '#fff' }}>
                                                {col}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel
                                        sx={{
                                            color: '#cccccc',
                                            '&.Mui-focused': { color: '#4945ff' }
                                        }}
                                    >
                                        Описание
                                    </InputLabel>
                                    <Select
                                        value={columnMapping.description}
                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, description: e.target.value }))}
                                        label="Описание"
                                        sx={{
                                            color: '#fff',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#32324d'
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#4945ff'
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#4945ff'
                                            }
                                        }}
                                    >
                                        <MenuItem value="" sx={{ bgcolor: '#1a1a1a', color: '#fff' }}>
                                            <em>Не выбрано</em>
                                        </MenuItem>
                                        {previewData.columns.map(col => (
                                            <MenuItem key={col} value={col} sx={{ bgcolor: '#1a1a1a', color: '#fff' }}>
                                                {col}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Предпросмотр (первые 5 строк из {previewData.totalRows})
                        </Typography>
                        <TableContainer
                            component={Paper}
                            sx={{
                                bgcolor: '#212134',
                                maxHeight: 300,
                                border: '1px solid #32324d'
                            }}
                        >
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {previewData.columns.map(col => (
                                            <TableCell
                                                key={col}
                                                sx={{
                                                    bgcolor: '#1a1a1a',
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    borderBottom: '1px solid #32324d'
                                                }}
                                            >
                                                {col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewData.preview.map((row, idx) => (
                                        <TableRow key={idx}>
                                            {previewData.columns.map(col => (
                                                <TableCell
                                                    key={col}
                                                    sx={{
                                                        color: '#cccccc',
                                                        borderBottom: '1px solid #32324d'
                                                    }}
                                                >
                                                    {row[col]}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Шаг 4: Результат импорта */}
                {activeStep === 3 && importResult && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#4caf50' }}>
                            ✓ Импорт завершен
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            Импортировано: <strong>{importResult.imported}</strong> из <strong>{importResult.total}</strong>
                        </Typography>
                        {importResult.errors.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: '#ff9800' }}>
                                    Ошибки:
                                </Typography>
                                <Box sx={{
                                    maxHeight: 150,
                                    overflow: 'auto',
                                    textAlign: 'left',
                                    bgcolor: '#212134',
                                    p: 2,
                                    borderRadius: 1
                                }}>
                                    {importResult.errors.map((err, idx) => (
                                        <Typography key={idx} variant="body2" sx={{ color: '#ff9800' }}>
                                            {err}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: '#4945ff' }} />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{
                bgcolor: '#212134',
                borderTop: '1px solid #32324d',
                p: 2
            }}>
                {activeStep === 3 ? (
                    <Button
                        onClick={handleClose}
                        variant="contained"
                        sx={{
                            bgcolor: '#4945ff',
                            '&:hover': { bgcolor: '#7b79ff' }
                        }}
                    >
                        Закрыть
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={handleClose}
                            sx={{
                                color: '#cccccc',
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                            }}
                        >
                            Отмена
                        </Button>
                        {activeStep > 0 && activeStep < 3 && (
                            <Button
                                onClick={handleBack}
                                sx={{
                                    color: '#cccccc',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                                }}
                            >
                                Назад
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            variant="contained"
                            disabled={
                                loading ||
                                importing ||
                                (activeStep === 0 && !file) ||
                                (activeStep === 2 && !columnMapping.title)
                            }
                            sx={{
                                bgcolor: '#4945ff',
                                '&:hover': { bgcolor: '#7b79ff' },
                                '&:disabled': { bgcolor: '#32324d', color: '#666' }
                            }}
                        >
                            {activeStep === 2 ? (importing ? 'Импорт...' : 'Импортировать') : 'Далее'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default ImportDialog;

