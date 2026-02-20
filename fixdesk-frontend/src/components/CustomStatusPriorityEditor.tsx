import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Button,
    Divider,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon
} from '@mui/icons-material';
import { CustomStatus, CustomPriority } from '../types/project';

interface CustomStatusPriorityEditorProps {
    type: 'status' | 'priority';
    items: CustomStatus[] | CustomPriority[];
    onChange: (items: CustomStatus[] | CustomPriority[]) => void;
}

const DEFAULT_STATUSES: CustomStatus[] = [
    { code: 'open', name: 'Открыто', color: '#ff6b35' },
    { code: 'in_progress', name: 'В работе', color: '#4ecdc4' },
    { code: 'resolved', name: 'Решено', color: '#45b7d1' },
    { code: 'closed', name: 'Закрыто', color: '#96ceb4', readonly: true }
];

const DEFAULT_PRIORITIES: CustomPriority[] = [
    { code: 'low', name: 'Низкий', color: '#4caf50' },
    { code: 'medium', name: 'Средний', color: '#ff9800' },
    { code: 'high', name: 'Высокий', color: '#f44336' },
    { code: 'critical', name: 'Критический', color: '#9c27b0' }
];

const CustomStatusPriorityEditor: React.FC<CustomStatusPriorityEditorProps> = ({
    type,
    items,
    onChange
}) => {
    const isStatus = type === 'status';
    const title = isStatus ? 'Статусы' : 'Приоритеты';
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const normalizeOrder = (items: (CustomStatus | CustomPriority)[]) => {
        if (!isStatus) return items;

        const closedIndex = items.findIndex((item: any) => item.code === 'closed');
        if (closedIndex === -1 || closedIndex === items.length - 1) {
            return items;
        }

        const normalized = [...items];
        const [closedItem] = normalized.splice(closedIndex, 1);
        normalized.push(closedItem);
        return normalized;
    };

    React.useEffect(() => {
        if (!items || items.length === 0) {
            onChange(isStatus ? DEFAULT_STATUSES : DEFAULT_PRIORITIES);
        } else if (items.length > 0) {
            const normalized = normalizeOrder(items);
            if (JSON.stringify(normalized) !== JSON.stringify(items)) {
                onChange(normalized);
            }
        }
    }, []);

    const handleAdd = () => {
        const newCode = `${type}_${Date.now()}`;
        const newItem = {
            code: newCode,
            name: isStatus ? 'Новый статус' : 'Новый приоритет',
            color: '#808080'
        };

        if (isStatus) {
            const closedIndex = items.findIndex((item: any) => item.code === 'closed');
            if (closedIndex !== -1) {
                const updated = [...items];
                updated.splice(closedIndex, 0, newItem);
                onChange(updated);
                return;
            }
        }

        onChange([...items, newItem]);
    };

    const handleUpdate = (index: number, field: 'name' | 'color', value: string) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const handleDelete = (index: number) => {
        const updated = items.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleDragStart = (index: number) => {
        const item = items[index] as any;
        if (isStatus && item.code === 'closed') {
            return;
        }
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        const item = items[index] as any;
        if (isStatus && item.code === 'closed') {
            return;
        }
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        const dropItem = items[dropIndex] as any;
        if (isStatus && dropItem.code === 'closed') {
            setDraggedIndex(null);
            return;
        }

        const updated = [...items];
        const [draggedItem] = updated.splice(draggedIndex, 1);
        updated.splice(dropIndex, 0, draggedItem);

        if (isStatus) {
            const closedIndex = updated.findIndex((item: any) => item.code === 'closed');
            if (closedIndex !== -1 && closedIndex !== updated.length - 1) {
                const [closedItem] = updated.splice(closedIndex, 1);
                updated.push(closedItem);
            }
        }

        onChange(updated);
        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <Box sx={{
            mb: 3,
            p: 2,
            bgcolor: '#212134',
            borderRadius: 2,
            border: '1px solid #32324d'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {title}
                </Typography>
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    sx={{
                        color: '#7b79ff',
                        '&:hover': {
                            bgcolor: 'rgba(123, 121, 255, 0.1)'
                        }
                    }}
                >
                    Добавить
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {items && items.map((item, index) => {
                    const isReadonly = 'readonly' in item && item.readonly;
                    const isClosedStatus = isStatus && item.code === 'closed';
                    const isDragging = draggedIndex === index;

                    return (
                        <Box
                            key={item.code}
                            draggable={!isClosedStatus}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                p: 1.5,
                                bgcolor: isDragging ? '#242438' : '#181826',
                                borderRadius: 1,
                                border: isDragging ? '2px solid #7b79ff' : '1px solid #32324d',
                                opacity: isDragging ? 0.5 : 1,
                                cursor: isClosedStatus ? 'default' : 'move',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <DragIcon sx={{
                                color: isClosedStatus ? '#444' : '#666',
                                cursor: isClosedStatus ? 'not-allowed' : 'grab',
                                fontSize: 20
                            }} />

                            {/* Color picker */}
                            <input
                                type="color"
                                value={item.color}
                                onChange={(e) => handleUpdate(index, 'color', e.target.value)}
                                style={{
                                    width: 40,
                                    height: 32,
                                    borderRadius: 2,
                                    padding: '1px',
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent'
                                }}
                            />

                            {/* Название */}
                            <TextField
                                value={item.name}
                                onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                                size="small"
                                fullWidth
                                sx={{
                                    '& .MuiInputBase-root': {
                                        bgcolor: '#212134',
                                        color: '#fff',
                                        fontSize: '13px',
                                    }
                                }}
                            />

                            {/* 
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#666',
                                    minWidth: 100,
                                    fontSize: '0.7rem',
                                    fontFamily: 'monospace',
                                    display: 'none'
                                }}
                            >
                                {item.code}
                            </Typography>
                            */}

                            {/* Кнопка удаления */}
                            {!isReadonly && (
                                <IconButton
                                    size="small"
                                    onClick={() => handleDelete(index)}
                                    sx={{
                                        color: '#f44336',
                                        '&:hover': {
                                            bgcolor: 'rgba(244, 67, 54, 0.1)'
                                        }
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            )}

                            {isReadonly && (
                                <Tooltip title="Этот статус нельзя удалить">
                                    <Box sx={{ width: 40 }} />
                                </Tooltip>
                            )}
                        </Box>
                    );
                })}
            </Box>

            {isStatus && (
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        mt: 1,
                        color: '#888',
                        fontSize: '0.7rem'
                    }}
                >
                    * Статус "Закрыт" обязателен, не может быть удален и всегда находится в конце списка. Вы можете изменить его название и цвет.
                </Typography>
            )}
        </Box>
    );
};

export default CustomStatusPriorityEditor;

