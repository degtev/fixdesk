-- Добавление полей для мягкого удаления пользователей

-- Добавляем поля для мягкого удаления
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP;

-- Создаем индексы для быстрого поиска удаленных аккаунтов
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled_at ON users(deletion_scheduled_at);

-- Комментарии
COMMENT ON COLUMN users.deleted_at IS 'Дата и время когда пользователь удалил аккаунт (мягкое удаление)';
COMMENT ON COLUMN users.deletion_scheduled_at IS 'Дата и время когда аккаунт будет окончательно удален (deleted_at + 30 дней)';

