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

const BUG_DIALOG_COLORS = {
  primary: '#4945ff', 
  primaryHover: '#7b79ff',
  primaryLight: 'rgba(106, 108, 240, 0.1)',
  
  background: '#212134',
  inputBackground: '#212134',
  
  border: '#32324d',
  borderLight: 'rgba(255, 152, 0, 0.3)',
  borderSuccess: 'rgba(76, 175, 80, 0.3)',
  borderError: 'rgba(244, 67, 54, 0.3)',
  
  textPrimary: '#ffffff',
  textSecondary: '#cccccc',
  textDisabled: '#888888',
  
  disabled: '#404040',
  warning: '#ff9800',
  success: '#4caf50',
  error: '#f44336',
  errorHover: '#d32f2f',
  
  shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  
  warningBg: 'rgba(255, 152, 0, 0.1)',
  successBg: 'rgba(76, 175, 80, 0.1)',
  errorBg: 'rgba(244, 67, 54, 0.1)',
} as const;

interface BugCustomDialogProps {
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

const BugCustomDialog: React.FC<BugCustomDialogProps> = ({
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
  maxWidth = 'md',
  fullWidth = true,
  fullScreen = false,
  disableEscapeKeyDown = false,
  transitionComponent,
}) => {
  const defaultDialogSx: SxProps = {
    background: BUG_DIALOG_COLORS.background,
    border: `1px solid ${BUG_DIALOG_COLORS.border}`,
    boxShadow: BUG_DIALOG_COLORS.shadow,
    color: BUG_DIALOG_COLORS.textPrimary,
    borderRadius: 3,
    ...dialogSx,
  };
  const defaultTitleSx: SxProps = {
    color: BUG_DIALOG_COLORS.primary,
    fontWeight: 'bold',
    borderBottom: `1px solid ${BUG_DIALOG_COLORS.border}`,
    bgcolor: BUG_DIALOG_COLORS.background,
    ...titleSx,
  };
  const defaultActionsSx: SxProps = {
    borderTop: `1px solid ${BUG_DIALOG_COLORS.border}`,
    p: 2,
    bgcolor: BUG_DIALOG_COLORS.background,
    ...actionsSx,
  };
  const standardStyles = {
    '& .MuiTextField-root .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: BUG_DIALOG_COLORS.inputBackground,
      '& fieldset': {
        borderColor: BUG_DIALOG_COLORS.border,
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: BUG_DIALOG_COLORS.primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: BUG_DIALOG_COLORS.primary,
        borderWidth: '2px',
      },
    },
    '& .MuiTextField-root .MuiInputLabel-root': {
      color: BUG_DIALOG_COLORS.textSecondary,
      '&.Mui-focused': {
        color: BUG_DIALOG_COLORS.primary,
      },
    },
    '& .MuiTextField-root .MuiInputBase-input': {
      color: BUG_DIALOG_COLORS.textPrimary,
    },
    '& .MuiFormControl-root .MuiInputLabel-root': {
      color: BUG_DIALOG_COLORS.textSecondary,
      '&.Mui-focused': {
        color: BUG_DIALOG_COLORS.primary,
      },
    },
    '& .MuiFormControl-root .MuiSelect-select': {
      color: BUG_DIALOG_COLORS.textPrimary,
      borderRadius: '8px',
      backgroundColor: BUG_DIALOG_COLORS.inputBackground,
    },
    '& .MuiFormControl-root .MuiOutlinedInput-notchedOutline': {
      borderColor: BUG_DIALOG_COLORS.border,
      borderWidth: '1px',
    },
    '& .MuiFormControl-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: BUG_DIALOG_COLORS.primary,
    },
    '& .MuiFormControl-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: BUG_DIALOG_COLORS.primary,
    },
    '& .MuiMenuItem-root': {
      bgcolor: BUG_DIALOG_COLORS.background,
      color: BUG_DIALOG_COLORS.textPrimary,
      '&:hover': {
        bgcolor: BUG_DIALOG_COLORS.primaryLight,
      },
    },
    '& .MuiChip-root': {
      borderRadius: '16px',
      fontWeight: 'bold',
    },
    '& .MuiDivider-root': {
      borderColor: BUG_DIALOG_COLORS.border,
    },
    '& .MuiIconButton-root': {
      color: BUG_DIALOG_COLORS.textSecondary,
      '&:hover': {
        color: BUG_DIALOG_COLORS.primary,
        backgroundColor: BUG_DIALOG_COLORS.primaryLight,
      },
    },
    '& .MuiBox-root[data-warning="true"]': {
      backgroundColor: BUG_DIALOG_COLORS.warningBg,
      border: `1px solid ${BUG_DIALOG_COLORS.borderLight}`,
      borderRadius: 2,
    },
    '& .MuiBox-root[data-success="true"]': {
      backgroundColor: BUG_DIALOG_COLORS.successBg,
      border: `1px solid ${BUG_DIALOG_COLORS.borderSuccess}`,
      borderRadius: 2,
    },
    '& .MuiBox-root[data-error="true"]': {
      backgroundColor: BUG_DIALOG_COLORS.errorBg,
      border: `1px solid ${BUG_DIALOG_COLORS.borderError}`,
      borderRadius: 2,
      color: BUG_DIALOG_COLORS.error,
    },
    '& .MuiButton-root': {
      borderRadius: '8px !important',
      textTransform: 'none !important',
    },
    '& .MuiButton-outlined': {
      borderColor: `${BUG_DIALOG_COLORS.border} !important`,
      color: `${BUG_DIALOG_COLORS.textSecondary} !important`,
      '&:hover': {
        borderColor: `${BUG_DIALOG_COLORS.primary} !important`,
        color: `${BUG_DIALOG_COLORS.primary} !important`,
        backgroundColor: `${BUG_DIALOG_COLORS.primaryLight} !important`,
      },
    },
    '& .MuiButton-contained': {
      backgroundColor: `${BUG_DIALOG_COLORS.primary} !important`,
      color: `${BUG_DIALOG_COLORS.textPrimary} !important`,
      '&:hover': {
        backgroundColor: `${BUG_DIALOG_COLORS.primaryHover} !important`,
      },
      '&:disabled': {
        backgroundColor: `${BUG_DIALOG_COLORS.disabled} !important`,
        color: `${BUG_DIALOG_COLORS.textDisabled} !important`,
      },
    },
    '& .MuiButton-text': {
      color: `${BUG_DIALOG_COLORS.textSecondary} !important`,
      '&:hover': {
        color: `${BUG_DIALOG_COLORS.primary} !important`,
        backgroundColor: `${BUG_DIALOG_COLORS.primaryLight} !important`,
      },
    },
    '& .MuiTypography-root': {
      color: BUG_DIALOG_COLORS.textPrimary,
    },
    '& .MuiTypography-subtitle2': {
      color: BUG_DIALOG_COLORS.textSecondary,
    },
    '& .MuiTypography-body2': {
      color: BUG_DIALOG_COLORS.textSecondary,
    },
    '& .MuiAvatar-root': {
      border: `2px solid ${BUG_DIALOG_COLORS.border}`,
    },
    '& .MuiDialogContent-root': {
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: BUG_DIALOG_COLORS.border,
        borderRadius: '3px',
        '&:hover': {
          background: BUG_DIALOG_COLORS.primary,
        },
      },
      scrollbarWidth: 'thin',
      scrollbarColor: `${BUG_DIALOG_COLORS.border} transparent`,
    },
    '& .MuiDialog-paper': {
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: BUG_DIALOG_COLORS.border,
        borderRadius: '3px',
        '&:hover': {
          background: BUG_DIALOG_COLORS.primary,
        },
      },
      scrollbarWidth: 'thin',
      scrollbarColor: `${BUG_DIALOG_COLORS.border} transparent`,
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
        sx={{
          '& .MuiBackdrop-root': {
            bgcolor: 'rgba(0, 0, 0, 0.5)'
          }
        }}
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
        <DialogContent sx={{ p: 3, mt: 1.5, ...contentSx }}>{children}</DialogContent>
        {actions && <DialogActions sx={defaultActionsSx}>{actions}</DialogActions>}
      </Dialog>
    </>
  );
};

export default BugCustomDialog; 