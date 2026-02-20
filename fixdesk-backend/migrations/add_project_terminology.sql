-- Добавление полей для кастомизации терминологии в проектах
-- Дата: 2025-10-09

-- Добавляем колонки для склонения названий элементов проекта
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS item_name_singular VARCHAR(50) DEFAULT 'задача',
    ADD COLUMN IF NOT EXISTS item_name_nominative VARCHAR(50) DEFAULT 'задачи',
    ADD COLUMN IF NOT EXISTS item_name_genitive VARCHAR(50) DEFAULT 'задач',
    ADD COLUMN IF NOT EXISTS item_name_accusative VARCHAR(50) DEFAULT 'задачу';

-- Добавляем комментарии для документации
COMMENT ON COLUMN projects.item_name_singular IS '"задача" - для счётчика (1 задача, 21 задача)';
COMMENT ON COLUMN projects.item_name_nominative IS '"задачи" - для счётчика (2 задачи, 3 задачи, 4 задачи)';
COMMENT ON COLUMN projects.item_name_genitive IS '"задач" - для счётчика (5 задач, 10 задач, 100 задач)';
COMMENT ON COLUMN projects.item_name_accusative IS '"задачу" - для действий (Добавить задачу, Создать задачу, Редактировать задачу)';

-- Обновляем существующие проекты значениями по умолчанию (если NULL)
UPDATE projects
SET
    item_name_singular = COALESCE(item_name_singular, 'задача'),
    item_name_nominative = COALESCE(item_name_nominative, 'задачи'),
    item_name_genitive = COALESCE(item_name_genitive, 'задач'),
    item_name_accusative = COALESCE(item_name_accusative, 'задачу')
WHERE
    item_name_singular IS NULL
   OR item_name_nominative IS NULL
   OR item_name_genitive IS NULL
   OR item_name_accusative IS NULL;
