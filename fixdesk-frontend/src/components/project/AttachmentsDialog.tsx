import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
    TextField,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    Link as LinkIcon
} from '@mui/icons-material';
import { getFileIcon, getSafeFileName, formatFileSize } from '../../utils/bugUtils';
import BugCustomDialog from '../BugCustomDialog';

interface BugList {
    id: number;
    project_id: number;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_by: number;
    assigned_to?: number;
    created_at: string;
    updated_at: string;
    creator_first_name: string;
    creator_last_name: string;
    assignee_first_name?: string;
    assignee_last_name?: string;
    attachments?: any[];
}

interface AttachmentsDialogProps {
    open: boolean;
    onClose: () => void;
    bug: BugList | null;
    attachments: any[];
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onAddLink: () => void;
    onDeleteAttachment: (attachmentId: number) => void;
    newLinkForm: { name: string; url: string };
    setNewLinkForm: React.Dispatch<React.SetStateAction<{ name: string; url: string }>>;
}

const AttachmentsDialog: React.FC<AttachmentsDialogProps> = ({
    open,
    onClose,
    bug,
    attachments,
    onFileUpload,
    onAddLink,
    onDeleteAttachment,
    newLinkForm,
    setNewLinkForm
}) => {
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    if (!bug) return null;

    return (
        <BugCustomDialog
            open={open}
            onClose={onClose}
            title={<span>Вложения: {bug.title}</span>}
            maxWidth="md"
            actions={
                <Button onClick={onClose}>Закрыть</Button>
            }
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Загрузить файлы
                    </Typography>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AddIcon />}
                    >
                        Выбрать файлы
                        <input
                            type="file"
                            hidden
                            multiple
                            onChange={onFileUpload}
                            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        />
                    </Button>
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Добавить ссылку
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                            label="Название"
                            value={newLinkForm.name}
                            onChange={(e) => setNewLinkForm(prev => ({ ...prev, name: e.target.value }))}
                            size="small"
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            label="URL"
                            value={newLinkForm.url}
                            onChange={(e) => setNewLinkForm(prev => ({ ...prev, url: e.target.value }))}
                            size="small"
                            sx={{ flex: 2 }}
                        />
                        <Button
                            variant="contained"
                            onClick={onAddLink}
                            disabled={!newLinkForm.name || !newLinkForm.url}
                        >
                            Добавить
                        </Button>
                    </Box>
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Вложения ({attachments.length})
                    </Typography>
                    {attachments.length === 0 ? (
                        <Box data-warning="true" sx={{ p: 2 }}>
                            <Typography variant="body2">
                                Вложения отсутствуют. Добавьте файлы или ссылки выше.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {attachments.map((attachment, index) => (
                                <Box
                                    key={attachment.id || index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 2,
                                        borderRadius: 2,
                                        border: '1px solid #404040'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ fontSize: '1.5rem' }}>
                                            {attachment.type === 'link' ? '🔗' : getFileIcon(attachment.mime_type || '')}
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {attachment.type === 'link' 
                                                    ? attachment.name 
                                                    : getSafeFileName(attachment.original_name || attachment.name)
                                                }
                                            </Typography>
                                            {attachment.type === 'link' ? (
                                                <Typography variant="caption" sx={{ color: '#888888' }}>
                                                    {attachment.url}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: '#888888' }}>
                                                    {formatFileSize(attachment.size || 0)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <IconButton
                                        onClick={() => onDeleteAttachment(attachment.id)}
                                        size="small"
                                        title="Удалить вложение"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>
        </BugCustomDialog>
    );
};

export default AttachmentsDialog; 