import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { SxProps } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import { GlobalStyles } from '@mui/material';

const DIALOG_COLORS = {
  primary: '#4945ff',
  primaryHover: '#7b79ff',
  primaryLight: 'rgba(106, 108, 240, 0.1)',
  
  background: '#212134',
  inputBackground: '#212134',
  
  border: '#32324d',
  borderLight: 'rgba(255, 152, 0, 0.3)',
  borderSuccess: 'rgba(76, 175, 80, 0.3)',
  
  textPrimary: '#ffffff',
  textSecondary: '#cccccc',
  textDisabled: '#888888',
  
  disabled: '#121212',
  warning: '#ff9800',
  success: '#4caf50',
  error: '#f44336',
  errorHover: '#d32f2f',
  
  shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  
  warningBg: 'rgba(255, 152, 0, 0.1)',
  successBg: 'rgba(76, 175, 80, 0.1)',
} as const;

interface CustomDialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  dialogSx?: SxProps;
  titleSx?: SxProps;
  contentSx?: SxProps;
  actionsSx?: SxProps;
  showCloseIcon?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  fullScreen?: boolean;
  disableEscapeKeyDown?: boolean;
  transitionComponent?: React.JSXElementConstructor<TransitionProps & { children: React.ReactElement<any, any> }>;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  title,
  actions,
  children,
  dialogSx,
  titleSx,
  contentSx,
  actionsSx,
  showCloseIcon = true,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  disableEscapeKeyDown = false,
  transitionComponent,
}) => {
  const defaultDialogSx: SxProps = {
    background: DIALOG_COLORS.background,
    border: `1px solid ${DIALOG_COLORS.border}`,
    boxShadow: DIALOG_COLORS.shadow,
    color: DIALOG_COLORS.textPrimary,
    borderRadius: 3,
    ...dialogSx,
  };

  const defaultTitleSx: SxProps = {
    color: DIALOG_COLORS.primary,
    fontWeight: 'bold',
    borderBottom: `1px solid ${DIALOG_COLORS.border}`,
    ...titleSx,
  };

  const defaultActionsSx: SxProps = {
    borderTop: `1px solid ${DIALOG_COLORS.border}`,
    p: 2,
    ...actionsSx,
  };

  const standardStyles = {
    '& .MuiTextField-root .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: DIALOG_COLORS.inputBackground,
      '& fieldset': {
        borderColor: DIALOG_COLORS.border,
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: DIALOG_COLORS.primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: DIALOG_COLORS.primary,
        borderWidth: '2px',
      },
    },
    '& .MuiTextField-root .MuiInputLabel-root': {
      color: DIALOG_COLORS.textSecondary,
      '&.Mui-focused': {
        color: DIALOG_COLORS.primary,
      },
    },
    '& .MuiTextField-root .MuiInputBase-input': {
      color: DIALOG_COLORS.textPrimary,
    },
    '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: DIALOG_COLORS.inputBackground,
      '& fieldset': {
        borderColor: DIALOG_COLORS.border,
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: DIALOG_COLORS.primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: DIALOG_COLORS.primary,
        borderWidth: '2px',
      },
    },
    '& .MuiAutocomplete-root .MuiInputLabel-root': {
      color: DIALOG_COLORS.textSecondary,
      '&.Mui-focused': {
        color: DIALOG_COLORS.primary,
      },
    },
    '& .MuiAutocomplete-root .MuiInputBase-input': {
      color: DIALOG_COLORS.textPrimary,
    },
    '& .MuiButton-root': {
      borderRadius: '8px !important',
      textTransform: 'none !important',
    },
    '& .MuiButton-outlined': {
      borderColor: `${DIALOG_COLORS.border} !important`,
      color: `${DIALOG_COLORS.textSecondary} !important`,
      '&:hover': {
        borderColor: `${DIALOG_COLORS.primary} !important`,
        color: `${DIALOG_COLORS.primary} !important`,
        backgroundColor: `${DIALOG_COLORS.primaryLight} !important`,
      },
    },
    '& .MuiButton-contained': {
      backgroundColor: `${DIALOG_COLORS.primary} !important`,
      color: `${DIALOG_COLORS.textPrimary} !important`,
      '&:hover': {
        backgroundColor: `${DIALOG_COLORS.primaryHover} !important`,
      },
      '&:disabled': {
        backgroundColor: `${DIALOG_COLORS.disabled} !important`,
        color: `${DIALOG_COLORS.textDisabled} !important`,
      },
    },
    '& .MuiButton-text': {
      color: `${DIALOG_COLORS.textSecondary} !important`,
      '&:hover': {
        color: `${DIALOG_COLORS.primary} !important`,
        backgroundColor: `${DIALOG_COLORS.primaryLight} !important`,
      },
    },
    '& .MuiTypography-root': {
      color: DIALOG_COLORS.textPrimary,
    },
    '& .MuiDialogTitle-root, .MuiDialogActions-root':{
      backgroundColor: '#181826',
    },
    '& .MuiTypography-subtitle2': {
      color: DIALOG_COLORS.textSecondary,
    },
    '& .MuiTypography-body2': {
      color: DIALOG_COLORS.textSecondary,
    },
    '& .MuiAvatar-root': {
      border: `2px solid ${DIALOG_COLORS.border}`,
    },
    '& .MuiBox-root[data-warning="true"]': {
      backgroundColor: DIALOG_COLORS.warningBg,
      border: `1px solid ${DIALOG_COLORS.borderLight}`,
      borderRadius: 2,
    },
    '& .MuiBox-root[data-success="true"]': {
      backgroundColor: DIALOG_COLORS.successBg,
      border: `1px solid ${DIALOG_COLORS.borderSuccess}`,
      borderRadius: 2,
    },
    '& .MuiBox-root[data-error="true"]': {
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      border: '1px solid rgba(244, 67, 54, 0.3)',
      borderRadius: 2,
    },
    '& .MuiBox-root[data-member-card="true"]': {
      display: 'flex ',
      alignItems: 'center ',
      justifyContent: 'space-between ',
      padding: '4px ',
      backgroundColor: `${DIALOG_COLORS.inputBackground}`,
      borderRadius: '8px',
      border: `1px solid ${DIALOG_COLORS.border}`,
    },
    '& .MuiBox-root[data-member-info="true"]': {
      display: 'flex ',
      alignItems: 'center ',
      gap: '8px',
    },
    '& .MuiBox-root[data-member-card="true"] .MuiAvatar-root': {
      width: '32px ',
      height: '32px ',
      border: `2px solid ${DIALOG_COLORS.border} `,
    },
    '& .MuiBox-root[data-member-card="true"] .MuiTypography-body2': {
      color: `${DIALOG_COLORS.textPrimary} `,
    },
    '& .MuiBox-root[data-member-card="true"] .MuiTypography-caption': {
      color: `${DIALOG_COLORS.textSecondary} `,
    },
    '& .MuiBox-root[data-member-card="true"] .MuiIconButton-root[data-delete-member="true"]': {
      color: DIALOG_COLORS.primary,
      '&:hover': { 
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        color: `${DIALOG_COLORS.errorHover} `
      },
    },
    '& .MuiDialogContent-root': {
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: DIALOG_COLORS.border,
        borderRadius: '3px',
        '&:hover': {
          background: DIALOG_COLORS.primary,
        },
      },
      scrollbarWidth: 'thin',
      scrollbarColor: `${DIALOG_COLORS.border} transparent`,
    },
    '& .MuiDialog-paper': {
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: DIALOG_COLORS.border,
        borderRadius: '3px',
        '&:hover': {
          background: DIALOG_COLORS.primary,
        },
      },
      scrollbarWidth: 'thin',
      scrollbarColor: `${DIALOG_COLORS.border} transparent`,
    },
  };

  return (
    <>
      <GlobalStyles
        styles={{
          '.MuiDialog-root .MuiDialog-paper': {
            ...standardStyles,
          },
        }}
      />
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{ sx: defaultDialogSx }}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        fullScreen={fullScreen}
        disableEscapeKeyDown={disableEscapeKeyDown}
        TransitionComponent={transitionComponent}
      >
        {title && (
          <DialogTitle sx={defaultTitleSx}>
            {title}
            {showCloseIcon && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
                size="large"
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
        )}
        <DialogContent sx={{ mt: 1.5, ...contentSx }}>{children}</DialogContent>
        {actions && <DialogActions sx={defaultActionsSx}>{actions}</DialogActions>}
      </Dialog>
    </>
  );
};

export default CustomDialog; 