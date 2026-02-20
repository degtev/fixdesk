import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Avatar, Autocomplete, Snackbar, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CropIcon from '@mui/icons-material/Crop';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import ReactCrop from 'react-image-crop';
import CustomStatusPriorityEditor from './CustomStatusPriorityEditor';
import { CustomStatus, CustomPriority } from '../types/project';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  avatar_url?: string;
}

interface ProjectFormProps {
  mode: 'create' | 'edit';
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    name: string;
    description: string;
    iconFile: File | null;
      item_name_singular: string;
      item_name_nominative: string;
      item_name_genitive: string;
      item_name_accusative: string;

  };
  editingProject?: any;
  currentUserId?: number | null;
  defaultIcons: string[];
  projectMembers: User[];
  removeProjectMember: (projectId: number, userId: number) => void;
  availableUsers?: User[]; // Список доступных пользователей для добавления (участники workspace)
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  mode,
  onSubmit,
  onCancel,
  initialData,
  editingProject,
  currentUserId,
  defaultIcons,
  projectMembers,
  removeProjectMember,
  availableUsers,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    iconFile: initialData?.iconFile || null,
      item_name_singular: initialData?.item_name_singular || 'задача',
      item_name_nominative: initialData?.item_name_nominative || 'задачи',
      item_name_genitive: initialData?.item_name_genitive || 'задач',
      item_name_accusative: initialData?.item_name_accusative || 'задачу'
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning'; }>({ open: false, message: '', severity: 'info' });

  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>(
    editingProject?.custom_statuses || []
  );
  const [customPriorities, setCustomPriorities] = useState<CustomPriority[]>(
    editingProject?.custom_priorities || []
  );

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ unit: '%' as const, width: 100, height: 100, x: 0, y: 0 });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);

  const searchUsers = async (email: string) => {
    if (!email || email.length < 2) {
      setSearchResults([]);
      return;
    }

    // Если передан список доступных пользователей (участники workspace), фильтруем по нему
    if (availableUsers && availableUsers.length > 0) {
      const filtered = availableUsers.filter(user => 
        user.email.toLowerCase().includes(email.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(email.toLowerCase())
      );
      setSearchResults(filtered);
      return;
    }

    // Иначе делаем запрос на сервер (для обычных проектов без workspace)
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/projects/search/users?email=${email}`, config);
      setSearchResults(response.data);
    } catch (error) {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    setFormData({
      name: initialData?.name || '',
        description: initialData?.description || '',
      iconFile: initialData?.iconFile || null,
        item_name_singular: initialData?.item_name_singular || 'задача',
        item_name_nominative: initialData?.item_name_nominative || 'задачи',
        item_name_genitive: initialData?.item_name_genitive || 'задач',
        item_name_accusative: initialData?.item_name_accusative || 'задачу'

    });
  }, [initialData]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImg = (image: HTMLImageElement, crop: any): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
          resolve(file);
        }
      }, 'image/png');
    });
  };

  const handleCropComplete = async () => {
    if (imageRef && crop.width && crop.height) {
      try {
        const croppedFile = await getCroppedImg(imageRef, crop);
        setCroppedImageFile(croppedFile);
        setFormData(prev => ({ ...prev, iconFile: croppedFile }));
        setCropDialogOpen(false);
        setSelectedImage(null);
      } catch (error) {
        // ...
      }
    }
  };
  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setSelectedImage(null);
    setCroppedImageFile(null);
  };

  const handleSubmit = async () => {
    try {
      const allMembers = [
        ...selectedUsers,
        ...projectMembers.filter(
          m => !selectedUsers.some(u => u.id === m.id)
        )
      ];
      await onSubmit({ 
        ...formData, 
        members: allMembers, 
        removeIcon: false,
        custom_statuses: customStatuses,
        custom_priorities: customPriorities
      });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Ошибка', severity: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
      <TextField
        label="Название проекта"
        value={formData.name}
        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
        fullWidth
        required
      />
      <TextField
        label="Описание проекта"
        value={formData.description}
        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
        fullWidth
        multiline
        rows={3}
        required
      />
      <Button
        variant="outlined"
        component="label"
        startIcon={<CropIcon />}
      >
        {mode === 'edit' ? 'Заменить иконку' : 'Загрузить иконку проекта'}
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageUpload(file);
            }
          }}
        />
      </Button>
      {croppedImageFile && (
        <Box data-success="true" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <Avatar src={URL.createObjectURL(croppedImageFile)} sx={{ width: 48, height: 48 }} />
          <Typography variant="body2" sx={{ color: '#4caf50' }}>
            {mode === 'edit' ? 'Новая иконка готова' : 'Иконка готова'}
          </Typography>
        </Box>
      )}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#212134', borderRadius: 2, border: '1px solid #32324d' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff', fontWeight: 'bold' }}>
                Терминология (как называть элементы в проекте)
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Единственное число (что?)"
                    placeholder="баг, задача, тикет"
                    value={formData.item_name_singular}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name_singular: e.target.value }))}
                    fullWidth
                    helperText="Пример: '1 задача', '21 баг'"
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: '#181826', color: '#fff' },
                        '& .MuiInputLabel-root': { color: '#cccccc' },
                        '& .MuiFormHelperText-root': { color: '#888' }
                    }}
                />

                <TextField
                    label="Множественное число (что?)"
                    placeholder="баги, задачи, тикеты"
                    value={formData.item_name_nominative}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name_nominative: e.target.value }))}
                    fullWidth
                    helperText="Пример: '2 задачи', '3 бага', '24 тикета'"
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: '#181826', color: '#fff' },
                        '& .MuiInputLabel-root': { color: '#cccccc' },
                        '& .MuiFormHelperText-root': { color: '#888' }
                    }}
                />

                <TextField
                    label="Родительный падеж (чего?)"
                    placeholder="бага, задач, тикетов"
                    value={formData.item_name_genitive}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name_genitive: e.target.value }))}
                    fullWidth
                    helperText="Пример: '5 задач', '10 багов', '0 тикетов'"
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: '#181826', color: '#fff' },
                        '& .MuiInputLabel-root': { color: '#cccccc' },
                        '& .MuiFormHelperText-root': { color: '#888' }
                    }}
                />

                <TextField
                    label="Винительный падеж (что?)"
                    placeholder="задачу, баг, тикет"
                    value={formData.item_name_accusative}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name_accusative: e.target.value }))}
                    fullWidth
                    helperText="Пример: 'Добавить задачу', 'Создать баг'"
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: '#181826', color: '#fff' },
                        '& .MuiInputLabel-root': { color: '#cccccc' },
                        '& .MuiFormHelperText-root': { color: '#888' }
                    }}
                />

            </Box>
        </Box>

        <CustomStatusPriorityEditor
          type="status"
          items={customStatuses}
          onChange={setCustomStatuses}
        />

        <CustomStatusPriorityEditor
          type="priority"
          items={customPriorities}
          onChange={setCustomPriorities}
        />

        <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Добавить участников (необязательно):
        </Typography>
        {availableUsers && availableUsers.length > 0 && (
          <Typography variant="caption" sx={{ mb: 1, color: '#7b79ff', display: 'block' }}>
            Можно добавить только участников рабочего пространства
          </Typography>
        )}
        <Autocomplete
          multiple
          options={searchResults}
          value={selectedUsers}
          onChange={(_, newValue) => setSelectedUsers(newValue)}
          getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
          onInputChange={(_, newInputValue) => {
            setSearchEmail(newInputValue);
            searchUsers(newInputValue);
          }}
          noOptionsText={
            availableUsers && availableUsers.length > 0 
              ? "Участники не найдены. Сначала добавьте пользователей в рабочее пространство."
              : "Введите email пользователя"
          }
          renderInput={(params) => (
            <TextField 
              {...params} 
              label={
                availableUsers && availableUsers.length > 0
                  ? "Поиск участников workspace по email или имени"
                  : "Поиск по email"
              }
            />
          )}
        />
      </Box>
      {mode === 'edit' && projectMembers.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#cccccc', fontWeight: 'bold' }}>
            Текущие участники проекта:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {projectMembers.map((member) => (
              <Box key={member.id} data-member-card="true">
                <Box data-member-info="true">
                  <Avatar src={member.avatar_url}>{member.first_name.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="body2">{member.first_name} {member.last_name}</Typography>
                    <Typography variant="caption">{member.email}</Typography>
                  </Box>
                </Box>
                {member.id !== currentUserId && (
                  <IconButton
                    size="small"
                    onClick={() => removeProjectMember(editingProject!.id, member.id)}
                    data-delete-member="true"
                    title="Удалить из проекта"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog 
        open={cropDialogOpen} 
        onClose={handleCropCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#2a2a2a',
            border: '1px solid #404040',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            color: '#ffffff',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#f06a6a', 
          fontWeight: 'bold',
          borderBottom: '1px solid #404040'
        }}>
          Обрезка иконки проекта
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" sx={{ 
              color: '#cccccc',
              bgcolor: 'rgba(240, 106, 106, 0.1)',
              p: 2,
              borderRadius: 2,
              border: '1px solid rgba(240, 106, 106, 0.3)'
            }}>
              Выберите область изображения для иконки проекта. Иконка будет отображаться в круглой форме.
            </Typography>
            {selectedImage && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{
                  '& .ReactCrop__crop-selection': {
                    border: '2px solid #f06a6a',
                    borderRadius: '50%'
                  }
                }}>
                  <ReactCrop
                    crop={crop}
                    onChange={(c: any) => setCrop(c)}
                    aspect={1}
                    circularCrop
                  >
                    <img
                      src={selectedImage}
                      onLoad={(e) => setImageRef(e.currentTarget as HTMLImageElement)}
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                    />
                  </ReactCrop>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #404040', p: 2 }}>
          <Button 
            onClick={handleCropCancel} 
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
            onClick={handleCropComplete}
            variant="contained"
            disabled={!crop.width || !crop.height}
            sx={{ 
              bgcolor: '#f06a6a',
              '&:hover': { bgcolor: '#e55a5a' },
              '&:disabled': {
                bgcolor: '#404040',
                color: '#888888'
              }
            }}
          >
            Применить обрезку
          </Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        <Button onClick={onCancel}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name || !formData.description}>
          {mode === 'create' ? 'Создать проект' : 'Сохранить изменения'}
        </Button>
      </Box>
    </Box>
  );
};

export default ProjectForm; 