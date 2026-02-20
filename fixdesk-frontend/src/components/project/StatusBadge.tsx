import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
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
import { CustomStatus, CustomPriority } from '../../types/project';

interface StatusBadgeProps {
    type: 'status' | 'priority';
    value: string;
    size?: 'small' | 'medium' | 'large';
    variant?: 'chip' | 'badge' | 'pill';
    showIcon?: boolean;
    showText?: boolean;
    customStatuses?: CustomStatus[];
    customPriorities?: CustomPriority[];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
    type,
    value,
    size = 'medium',
    variant = 'chip',
    showIcon = true,
    showText = true,
    customStatuses,
    customPriorities
}) => {
    const color = type === 'status'
        ? getCustomStatusColor(value, customStatuses)
        : getCustomPriorityColor(value, customPriorities);

    const text = type === 'status'
        ? getCustomStatusText(value, customStatuses)
        : getCustomPriorityText(value, customPriorities);

    const bgColor = type === 'status'
        ? getCustomStatusBgColor(value, customStatuses)
        : getCustomPriorityBgColor(value, customPriorities);

    const borderColor = type === 'status'
        ? getCustomStatusBorderColor(value, customStatuses)
        : getCustomPriorityBorderColor(value, customPriorities);

    const sizeStyles = {
        small: {
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: '4px',
            iconSize: 10
        },
        medium: {
            fontSize: 12,
            padding: '4px 8px',
            borderRadius: '6px',
            iconSize: 12
        },
        large: {
            fontSize: 14,
            padding: '6px 12px',
            borderRadius: '8px',
            iconSize: 14
        }
    };

    const currentSize = sizeStyles[size];

    if (variant === 'chip') {
        return (
            <Chip
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {showIcon && (
                            <Box
                                sx={{
                                    width: currentSize.iconSize,
                                    height: currentSize.iconSize,
                                    borderRadius: '50%',
                                    bgcolor: color,
                                    border: '1px solid rgba(0, 0, 0, 0.2)',
                                    flexShrink: 0
                                }}
                            />
                        )}
                        {showText && <span>{text}</span>}
                    </Box>
                }
                size={size === 'small' ? 'small' : 'medium'}
                sx={{
                    bgcolor: bgColor,
                    color: '#fff',
                    border: `1px solid ${borderColor}`,
                    fontWeight: 'bold',
                    fontSize: currentSize.fontSize,
                    borderRadius: currentSize.borderRadius,
                    '& .MuiChip-label': {
                        px: 1
                    },
                    '&:hover': {
                        bgcolor: bgColor.replace('0.15', '0.25'),
                        borderColor: borderColor.replace('0.6', '0.8')
                    }
                }}
            />
        );
    }

    if (variant === 'badge') {
        return (
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    bgcolor: bgColor,
                    color: '#fff',
                    border: `1px solid ${borderColor}`,
                    borderRadius: currentSize.borderRadius,
                    padding: currentSize.padding,
                    fontSize: currentSize.fontSize,
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        bgcolor: bgColor.replace('0.15', '0.25'),
                        borderColor: borderColor.replace('0.6', '0.8')
                    }
                }}
            >
                {showIcon && (
                    <Box
                        sx={{
                            width: currentSize.iconSize,
                            height: currentSize.iconSize,
                            borderRadius: '50%',
                            bgcolor: color,
                            border: '1px solid rgba(0, 0, 0, 0.2)',
                            flexShrink: 0
                        }}
                    />
                )}
                {showText && <span>{text}</span>}
            </Box>
        );
    }

    if (variant === 'pill') {
        return (
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    bgcolor: bgColor,
                    color: '#fff',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '20px',
                    padding: currentSize.padding,
                    fontSize: currentSize.fontSize,
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        bgcolor: bgColor.replace('0.15', '0.25'),
                        borderColor: borderColor.replace('0.6', '0.8')
                    }
                }}
            >
                {showIcon && (
                    <Box
                        sx={{
                            width: currentSize.iconSize,
                            height: currentSize.iconSize,
                            borderRadius: '50%',
                            bgcolor: color,
                            border: '1px solid rgba(0, 0, 0, 0.2)',
                            flexShrink: 0
                        }}
                    />
                )}
                {showText && <span>{text}</span>}
            </Box>
        );
    }

    return null;
};

export default StatusBadge; 