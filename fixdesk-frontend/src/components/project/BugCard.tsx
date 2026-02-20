import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Select,
    FormControl,
    Chip,
    Avatar,
    Tooltip
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    AttachFile as AttachFileIcon,
    Person as PersonIcon,
    Comment as CommentIcon
} from '@mui/icons-material';
import { BugList, CustomStatus, CustomPriority } from '../../types/project';
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
    getCustomStatusColor,
    getCustomStatusText,
    getCustomStatusBgColor,
    getCustomStatusBorderColor,
    getCustomPriorityColor,
    getCustomPriorityText,
    getCustomPriorityBgColor,
    getCustomPriorityBorderColor
} from '../../utils/bugUtils';
import { BUG_STATUSES, BUG_PRIORITIES } from '../../utils/bugStatusConfig';

interface BugCardProps {
    bug: BugList;
    onEdit: (bug: BugList) => void;
    onDelete: (bug: BugList) => void;
    onViewDetails: (bug: BugList) => void;
    onOpenAttachments: (bug: BugList) => void;
    onQuickUpdate: (bugUuid: string, field: 'status' | 'priority', value: string) => void;
    formatTimeAgo: (timestamp: string) => string;
    currentUserId?: number | null;
    hasUnreadComments?: boolean;
    viewersCount?: number;
    customStatuses?: CustomStatus[];
    customPriorities?: CustomPriority[];
}

const BugCard: React.FC<BugCardProps> = ({
    bug,
    onEdit,
    onDelete,
    onViewDetails,
    onOpenAttachments,
    onQuickUpdate,
    formatTimeAgo,
    currentUserId,
    hasUnreadComments,
    viewersCount = 0,
    customStatuses = [],
    customPriorities = []
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const isAssignedToCurrentUser = bug.assigned_to === currentUserId;
    const isClosed = bug.status === 'closed';
    const isAssignedToMe = bug.assigned_to === currentUserId;

    return (
        <Card
            sx={{
                position: 'relative',
                bgcolor: isAssignedToMe ? '#212134' : '#212134',
                border: hasUnreadComments ? '2px solid #7b79ff' : (isAssignedToMe ? '1px solid #0088ff' : '1px solid #32324d'),
                borderRadius: 2,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                backgroundImage:'none',
                boxShadow: hasUnreadComments ? '0 0 8px #7b79ff' : undefined,
                '&:hover': {
                    borderColor: isAssignedToMe ? '#c0c0cf' : '#c0c0cf',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }
            }}
            onClick={(e) => {
                if (!anchorEl) {
                    onViewDetails(bug);
                }
            }}
        >

            {viewersCount > 0 && (
                <Box sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    right: 12, 
                    display: 'flex', 
                    alignItems: 'center', 
                    zIndex: 2,
                    bgcolor: 'rgba(123,121,255,0.10)',
                    borderRadius: '10px',
                    px: 1,
                    py: 0.2
                }}>
                    <VisibilityIcon sx={{ color: '#7b79ff', fontSize: 14, mr: 0.5 }} />
                    <Typography variant="caption" sx={{ color: '#7b79ff', fontWeight: 'bold', fontSize: '0.8rem' }}>{viewersCount}</Typography>
                </Box>
            )}
            <CardContent sx={{ 
                px: isClosed ? 0.75 : 1, 
                pt: isClosed ? 0.75 : 1, 
                pb: isClosed ? 0.75 : 0.1,
                paddingBottom:'10px!important',
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                    <Box sx={{ flex: 1, mr: 1.5 }}>
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                color: isClosed ? '#ffffff' : '#ffffff', 
                                mb: 0.25,
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.95rem'
                            }}
                        >
                            {isAssignedToCurrentUser && (
                                <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: '#0088ff' }} />
                            )}
                            {bug.title}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: isClosed ? '#a5a5ba' : '#a5a5ba',
                                mb: 0.75,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                fontSize: '0.8rem',
                                lineHeight: 1.4
                            }}
                        >
                            {bug.description}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FormControl size="small" sx={{ minWidth: 90 }}>
                            <Select
                                value={bug.status}
                                onChange={e => onQuickUpdate(bug.uuid, 'status', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    bgcolor: getCustomStatusBgColor(bug.status, customStatuses),
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: 11,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: `1px solid ${getCustomStatusBorderColor(bug.status, customStatuses)}`,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none'
                                    },
                                    '&:hover': {
                                        bgcolor: getCustomStatusBgColor(bug.status, customStatuses).replace('0.15', '0.25'),
                                        borderColor: getCustomStatusBorderColor(bug.status, customStatuses).replace('0.6', '0.8')
                                    },
                                    '& .MuiSelect-select': {
                                        color: '#fff',
                                        fontWeight: 'bold'
                                    }
                                }}
                                renderValue={(value) => (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box
                                            sx={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                bgcolor: getCustomStatusColor(value, customStatuses),
                                                border: '1px solid rgba(0, 0, 0, 0.2)',
                                                flexShrink: 0
                                            }}
                                        />
                                        <span style={{ 
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            textShadow: '0 0 1px rgba(0,0,0,0.5)'
                                        }}>{getCustomStatusText(value, customStatuses)}</span>
                                    </Box>
                                )}
                            >
                                {customStatuses.map(opt => (
                                    <MenuItem key={opt.code} value={opt.code} sx={{ 
                                        fontSize: 11,
                                        bgcolor: '#1a1a1a',
                                        color: '#ffffff',
                                        '&:hover': {
                                            bgcolor: getCustomStatusBgColor(opt.code, customStatuses)
                                        }
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: opt.color,
                                                    border: '1px solid rgba(0, 0, 0, 0.2)',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <span>{opt.name}</span>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 90 }}>
                            <Select
                                value={bug.priority}
                                onChange={e => onQuickUpdate(bug.uuid, 'priority', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    bgcolor: getCustomPriorityBgColor(bug.priority, customPriorities),
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: 11,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: `1px solid ${getCustomPriorityBorderColor(bug.priority, customPriorities)}`,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        border: 'none'
                                    },
                                    '&:hover': {
                                        bgcolor: getCustomPriorityBgColor(bug.priority, customPriorities).replace('0.15', '0.25'),
                                        borderColor: getCustomPriorityBorderColor(bug.priority, customPriorities).replace('0.6', '0.8')
                                    },
                                    '& .MuiSelect-select': {
                                        color: '#fff',
                                        fontWeight: 'bold'
                                    }
                                }}
                                renderValue={(value) => (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box
                                            sx={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                bgcolor: getCustomPriorityColor(value, customPriorities),
                                                border: '1px solid rgba(0, 0, 0, 0.2)',
                                                flexShrink: 0
                                            }}
                                        />
                                        <span style={{ 
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            textShadow: '0 0 1px rgba(0,0,0,0.5)'
                                        }}>{getCustomPriorityText(value, customPriorities)}</span>
                                    </Box>
                                )}
                            >
                                {customPriorities.map(opt => (
                                    <MenuItem key={opt.code} value={opt.code} sx={{ 
                                        fontSize: 11,
                                        bgcolor: '#1a1a1a',
                                        color: '#ffffff',
                                        '&:hover': {
                                            bgcolor: getCustomPriorityBgColor(opt.code, customPriorities)
                                        }
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: opt.color,
                                                    border: '1px solid rgba(0, 0, 0, 0.2)',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <span>{opt.name}</span>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {bug.attachments && bug.attachments.length > 0 && (
                            <Tooltip title={`${bug.attachments.length} вложений`}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenAttachments(bug);
                                    }}
                                    sx={{ 
                                        color: '#fff', 
                                        p: 0.5,
                                        '&:hover': {
                                            color: '#0088ff',
                                            bgcolor: '#181826'
                                        }
                                    }}
                                >
                                    <AttachFileIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {hasUnreadComments && (
                            <Tooltip title="Новый комментарий">
                                <CommentIcon sx={{ color: '#7b79ff', fontSize: 28, filter: 'drop-shadow(0 0 6px #7b79ff)' }} />
                            </Tooltip>
                        )}
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e);
                            }}
                            sx={{ 
                                color: '#fff', 
                                        p: 0.5,
                                        '&:hover': {
                                            color: '#0088ff',
                                            bgcolor: '#181826'
                                        }
                            }}
                        >
                            <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ 
                            color: '#a5a5ba', 
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                        }}>
                            {new Date(bug.created_at).toLocaleDateString('ru-RU', { year: '2-digit', month: '2-digit', day: '2-digit' })} {new Date(bug.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Avatar sx={{ 
                            width: 16, 
                            height: 16, 
                            fontSize: 9,
                            bgcolor: '#181826',
                            color:'#fff',
                            border:'1px solid #32324d',
                            lineHeight:'16px',
                        }}>
                            {(bug.creator_first_name && bug.creator_first_name.charAt(0)) || '?'}
                        </Avatar>
                        <Typography variant="caption" sx={{ 
                            color: '#fff', 
                            fontSize: '0.7rem',
                            fontWeight: ''
                        }}>
                            {bug.creator_first_name} {bug.creator_last_name}
                        </Typography>
                        {bug.assignee_first_name && (
                            <>
                                <Typography variant="caption" sx={{ 
                                    color: '#7b79ff',
                                    fontWeight: 'bold'
                                }}>
                                    →
                                </Typography>
                                <Avatar sx={{ 
                                    width: 16, 
                                    height: 16, 
                                    fontSize: 9,
                                    bgcolor: '#4945ff',
                                    color:'#fff',
                                    border:'1px solid #32324d',
                                    lineHeight:'16px',
                                }}>
                                    {(bug.assignee_first_name && bug.assignee_first_name.charAt(0)) || '?'}
                                </Avatar>
                                <Typography variant="caption" sx={{ 
                                    color: '#fff', 
                                    fontSize: '0.7rem',
                                    fontWeight: ''
                                }}>
                                    {bug.assignee_first_name} {bug.assignee_last_name}
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>
            </CardContent>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        bgcolor: '#212134',
                        color: '#ffffff',
                        border: '1px solid #32324d',
                        borderRadius: 2,
                        backgroundImage:"none",
                    }
                }}
            >
                <MenuItem 
                    onClick={() => { onViewDetails(bug); handleMenuClose(); }}
                    sx={{
                        '&:hover': {
                            bgcolor: '#181826'
                        }
                    }}
                >
                    <VisibilityIcon sx={{ mr: 1, fontSize: 16, color: '#fff' }} />
                    Просмотр
                </MenuItem>
                <MenuItem 
                    onClick={() => { onEdit(bug); handleMenuClose(); }}
                    sx={{
                        '&:hover': {
                            bgcolor: '#181826'
                        }
                    }}
                >
                    <EditIcon sx={{ mr: 1, fontSize: 16, color: '#fff' }} />
                    Редактировать
                </MenuItem>
                <MenuItem 
                    onClick={() => { onDelete(bug); handleMenuClose(); }}
                    sx={{
                        '&:hover': {
                            bgcolor: '#181826'
                        }
                    }}
                >
                    <DeleteIcon sx={{ mr: 1, fontSize: 16, color: '#fff' }} />
                    Удалить
                </MenuItem>
            </Menu>
        </Card>
    );
};

export default BugCard; 