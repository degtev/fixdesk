import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    Chip,
    Avatar,
    Button,
    Divider,
    IconButton,
    Snackbar,
    Alert,
    Tooltip
} from '@mui/material';
import {
    ContentCopy as CopyIcon,
    Visibility as VisibilityIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
    getStatusColor,
    getStatusText,
    getStatusIcon,
    getStatusBgColor,
    getStatusBorderColor,
    getPriorityColor,
    getPriorityText,
    getPriorityIcon,
    getPriorityBgColor,
    getPriorityBorderColor,
    formatDate,
    formatDateTime,
    formatDateTimeShort,
    getFileIcon,
    getSafeFileName
} from '../../utils/bugUtils';
import BugComments from './BugComments';
import StatusBadge from './StatusBadge';
import BugCustomDialog from '../BugCustomDialog';
import { io as socketIOClient } from 'socket.io-client';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

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

interface BugDetailDialogProps {
    open: boolean;
    onClose: () => void;
    bug: BugList | null;
    currentUserId?: number;
    projectId?: string;
    viewers: any[];
}

const BugDetailDialog: React.FC<BugDetailDialogProps> = ({ open, onClose, bug, currentUserId, projectId, viewers }) => {
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const [isTracking, setIsTracking] = useState(false);
    const [timer, setTimer] = useState(0);
    const [total, setTotal] = useState(0);
    const [allTracks, setAllTracks] = useState<any[]>([]);
    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const [showUsers, setShowUsers] = useState(false);
    const [imagePreview, setImagePreview] = useState({
        open: false,
        url: ''
    });

    const isImageFile = (url: string): boolean => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
        const lowerUrl = url.toLowerCase();
        return imageExtensions.some(ext => lowerUrl.endsWith(ext));
    };

    const handleAttachmentClick = (attachment: any) => {
        const fullUrl = attachment.type === 'file'
            ? `${import.meta.env.VITE_BACKEND_URL}${attachment.url}`
            : attachment.url;

        if (attachment.type === 'file' && isImageFile(attachment.url)) {
            setImagePreview({
                open: true,
                url: fullUrl
            });
        } else {
            window.open(fullUrl, '_blank');
        }
    };

    const handleDownload = (attachment: any) => {
        const fullUrl = attachment.type === 'file'
            ? `${import.meta.env.VITE_BACKEND_URL}${attachment.url}`
            : attachment.url;

        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchTracks = async () => {
        if (!bug?.id || !currentUserId) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/bugs/${bug.uuid}/time-track`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const tracks = await res.json();
            let sum = 0;
            let active = null;
            for (const t of tracks) {
                if (t.end_time) sum += t.duration || 0;
                else active = t;
            }
            setTotal(sum);
            if (active) {
                setIsTracking(true);
                const start = new Date(active.start_time);
                setTimer(Math.floor((Date.now() - start.getTime()) / 1000));
            } else {
                setIsTracking(false);
                setTimer(0);
            }
        }
        const resAll = await fetch(`${import.meta.env.VITE_BACKEND_URL}/bugs/${bug.uuid}/time-track/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resAll.ok) {
            const all = await resAll.json();
            setAllTracks(all);
        }
    };

    useEffect(() => {
        if (!open || !bug?.id || !currentUserId) return;
        fetchTracks();
        return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
    }, [open, bug?.id, currentUserId]);

    useEffect(() => {
        if (isTracking) {
            timerInterval.current = setInterval(() => setTimer(t => t + 1), 1000);
        } else if (timerInterval.current) {
            clearInterval(timerInterval.current);
        }
        return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
    }, [isTracking]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return [h, m, s].map(x => String(x).padStart(2, '0')).join(':');
    };

    const handleStart = async () => {
        const token = localStorage.getItem('token');
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/bugs/${bug.uuid}/time-track/start`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsTracking(true);
        setTimer(0);
    };
    const handleStop = async () => {
        const token = localStorage.getItem('token');
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/bugs/${bug.uuid}/time-track/stop`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsTracking(false);
        await fetchTracks();
    };

    const handleCopyLink = async () => {
        try {
            const link = `${window.location.origin}/project/${projectId}?task=${bug.uuid}`;
            await navigator.clipboard.writeText(link);
            setSnackbar({
                open: true,
                message: 'Ссылка скопирована в буфер обмена',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Ошибка копирования ссылки',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const totalAll = allTracks.reduce((acc, t) => acc + (t.duration || 0), 0) + (isTracking ? timer : 0);
    const userTimes: { [userId: number]: { name: string, time: number } } = {};
    for (const t of allTracks) {
        if (!userTimes[t.user_id]) userTimes[t.user_id] = { name: `${t.first_name} ${t.last_name}`, time: 0 };
        userTimes[t.user_id].time += t.duration || 0;
    }
    if (isTracking && currentUserId && userTimes[currentUserId]) {
        userTimes[currentUserId].time += timer;
    }

    const plural = (n: number, one: string, few: string, many: string): string => {
        const mod10 = n % 10, mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return one;
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
        return many;
    };

    if (!bug) return null;

    return (
        <BugCustomDialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            dialogSx={{
                borderRadius: 4,
                padding: '0px!important',
                margin: '0px!important',
                bgcolor: '#1d212d',
            }}
            contentSx={{
                p: 0,
                m: 0,
            }}
        >
            <Box
                sx={{
                    display: 'flex', gap: 1, flexDirection: { xs: 'column', md: 'row' }
                }}>
                <Box flex={1} p={2}>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '20px' }}>
                        {bug.title}
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 3, color: '#b2b8cd!important', lineHeight: 1.1 }}>
                        {bug.description}
                    </Typography>

                    {bug.attachments && bug.attachments.length > 0 && (
                        <>
                            <Divider sx={{ my: 2, borderColor: '#404040' }} />
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2, color: '#b2b8cd!important', fontWeight: 'bold', fontSize: '1rem' }}>
                                    Вложения ({bug.attachments.length})
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                    {bug.attachments.map((attachment) => (
                                        <Chip
                                            key={attachment.id}
                                            icon={
                                                attachment.type === 'link' ?
                                                    <Box component="span">🔗</Box> :
                                                    (attachment.type === 'file' && isImageFile(attachment.url) ?
                                                        <Box component="span">🖼️</Box> :
                                                        <Box component="span">{getFileIcon(attachment.mime_type || '')}</Box>
                                                    )
                                            }
                                            label={getSafeFileName(attachment.name)}
                                            onClick={() => handleAttachmentClick(attachment)}
                                            deleteIcon={
                                                <DownloadIcon
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(attachment);
                                                    }}
                                                />
                                            }
                                            onDelete={() => { }}
                                            sx={{
                                                color: '#cccccc',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    color: '#fff!important',
                                                    bgcolor: 'rgba(131, 106, 240, 0.1)!important'
                                                },
                                                '& .MuiChip-deleteIcon': {
                                                    color: '#cccccc',
                                                    '&:hover': {
                                                        color: '#fff!important'
                                                    }
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </>
                    )}

                    {currentUserId && projectId && (
                        <BugComments bugUuid={bug.uuid} currentUserId={currentUserId} projectId={Number(projectId)} />
                    )}

                </Box>

                <Box sx={{
                    minWidth: 260,
                    bgcolor: 'rgba(255,255,255,0.025)',
                    px: 2, py: 2,
                    maxWidth: { xs: '100%', md: 300 },
                }}>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}
                    >
                        <IconButton
                            onClick={handleCopyLink}
                            size="small"
                            sx={{
                                color: '#cccccc',
                                backgroundColor: 'transparent',
                                '&:hover': {
                                    color: '#7b79ff',
                                    backgroundColor: 'rgba(233, 224, 224, 1)',
                                },
                                '&:hover svg': {
                                    color: '#7b79ff',
                                },
                                '& svg': {
                                    color: '#fff',
                                }
                            }}
                            title="Скопировать ссылку"
                        >
                            <CopyIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {viewers.length === 0 ? (
                            <Typography variant="body2" sx={{ color: '#cccccc' }}>
                                Никто не смотрит
                            </Typography>
                        ) : (
                            <>
                                <Box sx={{ display: 'flex', gap: 0, position: 'relative' }}>
                                    {viewers.map((user, idx) => (
                                        <Tooltip key={user.userId} title={user.name} arrow>
                                            <Avatar sx={{
                                                width: 28,
                                                height: 28,
                                                bgcolor: '#7b79ff',
                                                fontSize: 14,
                                                cursor: 'pointer',
                                                position: 'relative',
                                                zIndex: viewers.length - idx,
                                                ml: idx === 0 ? 0 : '-10px',
                                                border: '2px solid #181826',
                                            }}>
                                                {user.name.charAt(0)}
                                            </Avatar>
                                        </Tooltip>
                                    ))}
                                </Box>
                                <Typography variant="body2" sx={{ color: '#cccccc', ml: 1 }}>
                                    {viewers.length} {plural(viewers.length, 'человек', 'человека', 'человек')} {plural(viewers.length, 'смотрит', 'смотрит', 'смотрят')}
                                </Typography>
                            </>
                        )}
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                            <Typography variant="body2" sx={{ color: '#b2b8cd' }}>
                                Статус:
                            </Typography>
                            <StatusBadge type="status" value={bug.status} size="medium" variant="chip" />
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                            <Typography variant="body2" sx={{ color: '#b2b8cd' }}>
                                Приоритет:
                            </Typography>
                            <StatusBadge type="priority" value={bug.priority} size="medium" variant="chip" />
                        </Box>
                    </Box>
                    <Divider sx={{ my: 2, borderColor: '#404040' }} />
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                            <Typography variant="body2" sx={{ color: '#b2b8cd' }}>
                                Создан:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#b2b8cd' }}>
                                {formatDateTimeShort(bug.created_at)}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                            <Typography variant="body2" sx={{ color: '#b2b8cd' }}>
                                Обновлен:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#b2b8cd' }}>
                                {formatDateTimeShort(bug.updated_at)}
                            </Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ my: 2, borderColor: '#404040' }} />
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                            <Typography variant="body2" sx={{ color: '#b2b8cd' }}>
                                Постановщик:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                {bug.creator_first_name} {bug.creator_last_name}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                            <Typography variant="body2" sx={{ color: '#b2b8cd' }}>
                                Исполнитель:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                {bug.assignee_first_name} {bug.assignee_last_name}
                            </Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ my: 2, borderColor: '#404040' }} />
                    <Box sx={{}}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                size="small"
                                onClick={isTracking ? handleStop : handleStart}
                                sx={{
                                    bgcolor: '#4945ff !important',
                                    color: '#fff !important',
                                    '&:hover': { bgcolor: '#7b79ff !important', color: '#fff !important' },
                                    width: 18,
                                    height: 18
                                }}
                            >
                                {isTracking ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                            </IconButton>
                            <Typography variant="h6" sx={{ fontWeight: 'normal', color: '#fff', minWidth: 70, fontSize: '0.95rem' }}>
                                {formatTime(timer)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#cccccc', ml: 1, fontSize: '0.75rem' }}>
                                Общее: {formatTime(totalAll)}
                            </Typography>
                            <IconButton size="small" onClick={() => setShowUsers(v => !v)}>
                                {showUsers ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                        </Box>
                        {showUsers && Object.keys(userTimes).length > 0 && (
                            <Box sx={{ mt: 1, ml: 1 }}>
                                <Typography variant="body2" sx={{ color: '#cccccc', mb: 1, fontWeight: 'bold' }}>Время по пользователям:</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {Object.entries(userTimes).map(([uid, u]) => (
                                        <Typography key={uid} variant="body2" sx={{ color: '#cccccc' }}>
                                            {u.name}: {formatTime(u.time)}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>


                </Box>

            </Box>


            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{
                        bgcolor: snackbar.severity === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        border: snackbar.severity === 'success' ? '1px solid #4caf50' : '1px solid #f44336',
                        color: snackbar.severity === 'success' ? '#4caf50' : '#f44336',
                        '& .MuiAlert-icon': {
                            color: snackbar.severity === 'success' ? '#4caf50' : '#f44336'
                        }
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Модальное окно для просмотра изображений */}
            <Dialog
                open={imagePreview.open}
                onClose={() => setImagePreview({ open: false, url: '' })}
                maxWidth={false}
                fullWidth
                hideBackdrop={true}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.98)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 0,
                        boxShadow: 'none',
                        m: 0,
                        maxWidth: '100vw',
                        maxHeight: '100vh',
                        height: '100vh',
                        width: '100vw'
                    }
                }}
                sx={{
                    '& .MuiBackdrop-root': {
                        backgroundColor: 'transparent !important',
                    }
                }}
            >
                <Box sx={{
                    position: 'relative',
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Кнопка закрытия */}
                    <IconButton
                        onClick={() => setImagePreview({ open: false, url: '' })}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: '#fff',
                            bgcolor: 'rgba(0, 0, 0, 0.1)',
                            width: 25,
                            height: 25,
                            zIndex: 9999,
                        }}
                    >
                        <Box component="span" sx={{ fontSize: 11 }}>✕</Box>
                    </IconButton>

                    {/* Зум и пан */}
                    <TransformWrapper
                        initialScale={1}
                        minScale={0.5}
                        maxScale={5}
                        centerOnInit={true}
                        centerZoomedOut={true}
                        wheel={{ step: 0.1 }}
                        doubleClick={{ mode: 'zoomIn' }}
                        limitToBounds={false}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                <TransformComponent
                                    wrapperStyle={{
                                        width: '100%',
                                        height: '100%'
                                    }}
                                    contentStyle={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={imagePreview.url}
                                        alt="Предпросмотр"
                                        sx={{
                                            maxWidth: '90vw',
                                            maxHeight: '90vh',
                                            objectFit: 'contain',
                                            userSelect: 'none',
                                            cursor: 'grab',
                                            '&:active': {
                                                cursor: 'grabbing'
                                            }
                                        }}
                                    />
                                </TransformComponent>
                            </>
                        )}
                    </TransformWrapper>

                    {/* Подсказка */}
                    <Typography
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: { xs: 10, sm: 12, md: 12 },
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            px: { xs: 1, sm: 2 },
                            py: { xs: 0.5, sm: 1 },
                            borderRadius: 1,
                            textAlign: 'center',
                            maxWidth: { xs: '90%', sm: 'auto' },
                        }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                            Колесо мыши для зума • Двойной клик для увеличения • Перетаскивание для перемещения
                        </Box>
                        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                            Зум • Двойной тап • Перетаскивание
                        </Box>
                    </Typography>
                </Box>
            </Dialog>

        </BugCustomDialog>
    );
};

export default BugDetailDialog; 