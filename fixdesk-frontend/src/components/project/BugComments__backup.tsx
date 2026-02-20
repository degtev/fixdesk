import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Avatar,
    Button,
    TextField,
    IconButton,
    Divider,
    Paper,
    Chip,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Reply as ReplyIcon,
    AttachFile as AttachFileIcon,
    Send as SendIcon,
    Download as DownloadIcon,
    Link as LinkIcon
} from '@mui/icons-material';
import { formatTimeAgo, getFileIcon, getSafeFileName, formatFileSize } from '../../utils/bugUtils';
import { io as socketIOClient } from 'socket.io-client';

interface BugComment {
    id: number;
    bug_id: number;
    user_id: number;
    comment: string;
    attachment_url?: string;
    parent_id?: number | null;
    created_at: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    replies?: BugComment[];
}

interface BugCommentsProps {
    bugId: number;
    currentUserId: number;
    projectId?: number;
}

const BugComments: React.FC<BugCommentsProps> = ({ bugId, currentUserId, projectId }) => {
    const [comments, setComments] = useState<BugComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const [linkDialog, setLinkDialog] = useState<{
        open: boolean;
        selectedText: string;
        url: string;
        isReply: boolean;
    }>({
        open: false,
        selectedText: '',
        url: '',
        isReply: false
    });

    const [typingUsers, setTypingUsers] = useState<{ userId: number; name: string }[]>([]);
    const typingTimeouts = useRef<{ [userId: number]: number }>({});

    const socket = socketIOClient(import.meta.env.VITE_SOCKET_URL);

    const loadComments = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/bugs/${bugId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            } else {
                throw new Error('Ошибка загрузки комментариев');
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            showSnackbar('Ошибка загрузки комментариев', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const formData = new FormData();
            formData.append('comment', newComment);
            if (attachment) {
                formData.append('attachment', attachment);
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/bugs/${bugId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                setNewComment('');
                setAttachment(null);
                await loadComments();
                showSnackbar('Комментарий добавлен', 'success');
            } else {
                throw new Error('Ошибка добавления комментария');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showSnackbar('Ошибка добавления комментария', 'error');
        }
    };

    const handleAddReply = async (parentId: number) => {
        if (!replyText.trim()) return;

        try {
            const formData = new FormData();
            formData.append('comment', replyText);
            formData.append('parent_id', parentId.toString());
            if (replyAttachment) {
                formData.append('attachment', replyAttachment);
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/bugs/${bugId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                setReplyText('');
                setReplyAttachment(null);
                setReplyingTo(null);
                await loadComments();
                showSnackbar('Ответ добавлен', 'success');
            } else {
                throw new Error('Ошибка добавления ответа');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            showSnackbar('Ошибка добавления ответа', 'error');
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, isReply: boolean = false) => {
        const file = event.target.files?.[0];
        if (file) {
            if (isReply) {
                setReplyAttachment(file);
            } else {
                setAttachment(file);
            }
        }
    };

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = `${import.meta.env.VITE_BACKEND_URL}${url}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const createLink = () => {
        const linkText = `[${linkDialog.selectedText}](${linkDialog.url})`;
        
        if (linkDialog.isReply) {
            setReplyText(prev => {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const textNode = range.startContainer;
                    if (textNode.nodeType === Node.TEXT_NODE) {
                        const text = textNode.textContent || '';
                        const start = range.startOffset;
                        const end = range.endOffset;
                        const newText = text.substring(0, start) + linkText + text.substring(end);
                        return newText;
                    }
                }
                return prev + linkText;
            });
        } else {
            setNewComment(prev => {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const textNode = range.startContainer;
                    if (textNode.nodeType === Node.TEXT_NODE) {
                        const text = textNode.textContent || '';
                        const start = range.startOffset;
                        const end = range.endOffset;
                        const newText = text.substring(0, start) + linkText + text.substring(end);
                        return newText;
                    }
                }
                return prev + linkText;
            });
        }
        
        setLinkDialog({ open: false, selectedText: '', url: '', isReply: false });
    };

    const renderTextWithLinks = (text: string) => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            
            parts.push(
                <a
                    key={match.index}
                    href={match[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: '#1976d2',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                    }}
                >
                    {match[1]}
                </a>
            );
            
            lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        
        return parts.length > 0 ? parts : text;
    };

    const emitTyping = (isReply: boolean = false) => {
      socket.emit('typing_comment', {
        projectId,
        bugId,
        userId: currentUserId,
        name: localStorage.getItem('userName') || 'Пользователь',
        isReply
      });
    };

    useEffect(() => {
        loadComments();
    }, [bugId]);

    useEffect(() => {
        if (!projectId) return;
        socket.emit('join_project', projectId);

        const handleNewComment = (data: any) => {
            if (data.projectId === projectId && data.bugId === bugId) {
                const newComment = data.comment;
                setComments((prev: BugComment[]) => {
                    if (newComment.parent_id) {
                        let found = false;
                        const updated: BugComment[] = prev.map(comment => {
                            if (comment.id === newComment.parent_id) {
                                found = true;
                                const updatedReplies = [...(comment.replies || []), newComment];
                                updatedReplies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                                return { ...comment, replies: updatedReplies };
                            }
                            return comment;
                        });
                        return found ? updated : prev;
                    } else {
                        return [newComment, ...prev];
                    }
                });
            }
        };
        socket.on('new_comment', handleNewComment);

        const handleTyping = (data: any) => {
            if (data.projectId !== projectId || data.bugId !== bugId) return;
            if (data.userId === currentUserId) return;
            setTypingUsers(prev => {
              if (prev.some(u => u.userId === data.userId)) return prev;
              return [...prev, { userId: data.userId, name: data.name }];
            });
            if (typingTimeouts.current[data.userId]) {
              clearTimeout(typingTimeouts.current[data.userId]);
            }
            typingTimeouts.current[data.userId] = setTimeout(() => {
              setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
            }, 2000);
        };
        socket.on('typing_comment', handleTyping);

        return () => {
            socket.off('new_comment', handleNewComment);
            socket.off('typing_comment', handleTyping);
            socket.emit('leave_project', projectId);
            Object.values(typingTimeouts.current).forEach(clearTimeout);
            typingTimeouts.current = {};
        };
    }, [projectId, bugId, currentUserId]);

    const renderComment = (comment: BugComment, isReply: boolean = false) => (
        <Box
            key={comment.id}
            sx={{
                mb: 2,
                ml: isReply ? 4 : 0,
                borderLeft: isReply ? '3px solid #4945ff' : 'none',
                pl: isReply ? 2 : 0,
                bgcolor: isReply ? 'rgba(10, 5, 255, 0.05)' : 'transparent',
                borderRadius: isReply ? 1 : 0
            }}
        >
            <Paper sx={{ p: 2, bgcolor: '#212134', border: '1px solid #32324d' }}>
                <Box sx={{ 
                    display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1 
                    }}>
                    <Avatar src={comment.avatar_url} sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: '#7b79ff'
                    }}>
                        {comment.first_name?.charAt(0) || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                                {comment.first_name || 'Неизвестный'} {comment.last_name || ''}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#717180!important' }}>
                                {formatTimeAgo(comment.created_at)}
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#717180', mb: 1, lineHeight: 1.5 }}>
                            {renderTextWithLinks(comment.comment)}
                        </Typography>
                        
                        {comment.attachment_url && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Box sx={{ fontSize: 16 }}>
                                    {comment.attachment_url.includes('http') ? '🔗' : getFileIcon('')}
                                </Box>
                                <Typography variant="caption" sx={{ color: '#888888' }}>
                                    {getSafeFileName(comment.attachment_url.split('/').pop() || '')}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDownload(
                                        comment.attachment_url!,
                                        comment.attachment_url!.split('/').pop() || 'file'
                                    )}
                                    sx={{ 
                                        color: '#cccccc',
                                        '&:hover': { 
                                            color: '#fff!important',
                                            bgcolor: 'rgba(131, 106, 240, 0.1)!important'
                                        }
                                    }}
                                >
                                    <DownloadIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        )}

                        {!isReply && (
                            <Button
                                size="small"
                                startIcon={<ReplyIcon />}
                                onClick={() => setReplyingTo(comment.id)}
                                sx={{
                                    color: '#4945ff !important',
                                    '&:hover': {
                                      color: '#1976d2 !important',
                                      backgroundColor: 'transparent !important',
                                    }
                                  }}
                            >
                                Ответить
                            </Button>
                        )}
                    </Box>
                </Box>

                {replyingTo === comment.id && !isReply && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#2c2c3e', borderRadius: 1, border: '1px solid #2c2c3e' }}>
                        <Box sx={{ position: 'relative' }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Написать ответ... (выделите текст и нажмите кнопку ссылки)"
                                value={replyText}
                                onChange={e => {
                                    setReplyText(e.target.value);
                                    emitTyping(true);
                                }}
                                inputProps={{ 'data-reply-field': 'true' }}
                                sx={{
                                    mb: 1,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        backgroundColor: '#1a1a1a',
                                        '& fieldset': { 
                                            borderColor: '#404040',
                                            borderWidth: '1px'
                                        },
                                        '&:hover fieldset': { 
                                            borderColor: '#f06a6a'
                                        },
                                        '&.Mui-focused fieldset': { 
                                            borderColor: '#f06a6a',
                                            borderWidth: '2px'
                                        }
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: '#cccccc'
                                    }
                                }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => {
                                    const selection = window.getSelection();
                                    if (selection && selection.toString().trim()) {
                                        setLinkDialog({
                                            open: true,
                                            selectedText: selection.toString().trim(),
                                            url: '',
                                            isReply: true
                                        });
                                    }
                                }}
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    color: '#cccccc',
                                    '&:hover': { color: '#f06a6a' }
                                }}
                            >
                                <LinkIcon />
                            </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                startIcon={<AttachFileIcon />}
                                sx={{
                                    borderColor: '#404040',
                                    color: '#cccccc',
                                    borderRadius: '6px',
                                    '&:hover': { 
                                        borderColor: '#f06a6a',
                                        color: '#f06a6a',
                                        bgcolor: 'rgba(240, 106, 106, 0.1)'
                                    }
                                }}
                            >
                                Вложение
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => handleFileChange(e, true)}
                                />
                            </Button>
                            {replyAttachment && (
                                <Chip
                                    label={replyAttachment.name}
                                    size="small"
                                    onDelete={() => setReplyAttachment(null)}
                                    sx={{ 
                                        bgcolor: 'rgba(240, 106, 106, 0.1)',
                                        color: '#f06a6a',
                                        border: '1px solid rgba(240, 106, 106, 0.3)'
                                    }}
                                />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAddReply(comment.id)}
                                disabled={!replyText.trim()}
                                startIcon={<SendIcon />}
                                sx={{ 
                                    bgcolor: '#f06a6a',
                                    '&:hover': { bgcolor: '#e55a5a' },
                                    '&:disabled': {
                                        bgcolor: '#404040',
                                        color: '#888888'
                                    }
                                }}
                            >
                                Отправить
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                    setReplyAttachment(null);
                                }}
                                sx={{ 
                                    color: '#cccccc',
                                    '&:hover': {
                                        color: '#f06a6a',
                                        bgcolor: 'rgba(240, 106, 106, 0.1)'
                                    }
                                }}
                            >
                                Отмена
                            </Button>
                        </Box>
                    </Box>
                )}

                {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
            </Paper>
        </Box>
    );

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#f06a6a', fontWeight: 'bold' }}>
                Комментарии ({comments.length})
            </Typography>

            {typingUsers.length > 0 && (
                <Box sx={{ mb: 1 }}>
                    {typingUsers.map(u => (
                        <Typography key={u.userId} variant="body2" sx={{ color: '#8888ff', fontStyle: 'italic' }}>
                            {u.name} печатает...
                        </Typography>
                    ))}
                </Box>
            )}

            <Paper sx={{ p: 2, mb: 3, bgcolor: '#212134', border: '1px solid #32324d' }}>
                <Box sx={{ position: 'relative' }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Добавить комментарий... (выделите текст и нажмите кнопку ссылки)"
                        value={newComment}
                        onChange={e => {
                            setNewComment(e.target.value);
                            emitTyping(false);
                        }}
                        inputProps={{ 'data-comment-field': 'true' }}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                color: '#ffffff',
                                borderRadius: '8px',
                                backgroundColor: '#212134',
                                '& fieldset': { 
                                    borderColor: '#32324d',
                                    borderWidth: '1px'
                                },
                                '&:hover fieldset': { 
                                    borderColor: '#4945ff!important'
                                },
                                '&.Mui-focused fieldset': { 
                                    borderColor: '#4945ff!important',
                                    borderWidth: '1px'
                                }
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: '#cccccc'
                            }
                        }}
                    />
                    <IconButton
                        size="small"
                        onClick={() => {
                            const selection = window.getSelection();
                            if (selection && selection.toString().trim()) {
                                setLinkDialog({
                                    open: true,
                                    selectedText: selection.toString().trim(),
                                    url: '',
                                    isReply: false
                                });
                            }
                        }}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: '#fff!important',
                            '&:hover': { color: '#fff!important',backgroundColor:'#4945ff!important' }
                        }}
                    >
                        <LinkIcon />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AttachFileIcon />}
                        sx={{
                            borderColor: '#404040',
                            color: '#cccccc',
                            borderRadius: '6px',
                            '&:hover': { 
                                borderColor: '#f06a6a',
                                color: '#f06a6a',
                                bgcolor: 'rgba(240, 106, 106, 0.1)'
                            }
                        }}
                    >
                        Добавить вложение
                        <input
                            type="file"
                            hidden
                            onChange={(e) => handleFileChange(e)}
                        />
                    </Button>
                    {attachment && (
                        <Chip
                            label={attachment.name}
                            size="small"
                            onDelete={() => setAttachment(null)}
                            sx={{ 
                                bgcolor: 'rgba(240, 106, 106, 0.1)',
                                color: '#f06a6a',
                                border: '1px solid rgba(240, 106, 106, 0.3)'
                            }}
                        />
                    )}
                </Box>
                <Button
                    variant="contained"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || loading}
                    startIcon={<SendIcon />}
                    sx={{ 
                        bgcolor: '#f06a6a',
                        '&:hover': { bgcolor: '#e55a5a' },
                        '&:disabled': {
                            bgcolor: '#404040',
                            color: '#888888',
                        }
                    }}
                >
                    Добавить комментарий
                </Button>
            </Paper>

            {comments.length === 0 ? (
                <Typography sx={{ color: '#888888', textAlign: 'center', py: 4, fontStyle: 'italic' }}>
                    Комментариев пока нет
                </Typography>
            ) : (
                <Box>
                    {comments.map(comment => renderComment(comment))}
                </Box>
            )}

            <Snackbar
                open={snackbar.open && snackbar.severity === 'error'}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity}
                    sx={{ 
                        width: '100%',
                        bgcolor: snackbar.severity === 'error' ? 'rgba(244, 67, 54, 0.1)' : undefined,
                        border: snackbar.severity === 'error' ? '1px solid #f44336' : undefined,
                        color: snackbar.severity === 'error' ? '#f44336' : undefined,
                        '& .MuiAlert-icon': {
                            color: snackbar.severity === 'error' ? '#f44336' : undefined
                        }
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog 
                open={linkDialog.open} 
                onClose={() => setLinkDialog({ open: false, selectedText: '', url: '', isReply: false })}
                PaperProps={{
                    sx: {
                        bgcolor: '#2a2a2a',
                        color: '#ffffff',
                        border: '1px solid #404040',
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    borderBottom: '1px solid #404040',
                    pb: 2,
                    bgcolor: '#2a2a2a'
                }}>
                    <Typography variant="inherit" sx={{ color: '#f06a6a', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        Создать ссылку
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#888888', mb: 1 }}>
                            Выделенный текст:
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#cccccc', fontStyle: 'italic' }}>
                            "{linkDialog.selectedText}"
                        </Typography>
                    </Box>
                    <TextField
                        fullWidth
                        label="URL ссылки"
                        placeholder="https://example.com"
                        value={linkDialog.url}
                        onChange={(e) => setLinkDialog(prev => ({ ...prev, url: e.target.value }))}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: '#ffffff',
                                borderRadius: '8px',
                                backgroundColor: '#1a1a1a',
                                '& fieldset': { 
                                    borderColor: '#404040',
                                    borderWidth: '1px'
                                },
                                '&:hover fieldset': { 
                                    borderColor: '#f06a6a'
                                },
                                '&.Mui-focused fieldset': { 
                                    borderColor: '#f06a6a',
                                    borderWidth: '2px'
                                }
                            },
                            '& .MuiInputLabel-root': {
                                color: '#cccccc',
                                '&.Mui-focused': {
                                    color: '#f06a6a'
                                }
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: '#888888'
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ 
                    borderTop: '1px solid #404040', 
                    p: 2 
                }}>
                    <Button 
                        onClick={() => setLinkDialog({ open: false, selectedText: '', url: '', isReply: false })}
                        sx={{ 
                            color: '#cccccc',
                            '&:hover': {
                                color: '#f06a6a',
                                bgcolor: 'rgba(240, 106, 106, 0.1)'
                            }
                        }}
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={createLink}
                        disabled={!linkDialog.url.trim()}
                        variant="contained"
                        sx={{ 
                            bgcolor: '#f06a6a',
                            '&:hover': { bgcolor: '#e55a5a' },
                            '&:disabled': {
                                bgcolor: '#404040',
                                color: '#888888'
                            }
                        }}
                    >
                        Создать ссылку
                    </Button>
                </DialogActions>
            </Dialog>


        </Box>
    );
};

export default BugComments; 