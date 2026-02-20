-- Добавление кастомных статусов и приоритетов в проекты
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS custom_statuses JSONB DEFAULT '[
  {"code": "open", "name": "Открыто", "color": "#ff6b35"},
  {"code": "in_progress", "name": "В работе", "color": "#4ecdc4"},
  {"code": "resolved", "name": "Решено", "color": "#45b7d1"},
  {"code": "closed", "name": "Закрыто", "color": "#96ceb4", "readonly": true}
]'::jsonb;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS custom_priorities JSONB DEFAULT '[
  {"code": "low", "name": "Низкий", "color": "#4caf50"},
  {"code": "medium", "name": "Средний", "color": "#ff9800"},
  {"code": "high", "name": "Высокий", "color": "#f44336"},
  {"code": "critical", "name": "Критический", "color": "#9c27b0"}
]'::jsonb;

-- Обновление существующих проектов с дефолтными значениями
UPDATE projects 
SET custom_statuses = '[
  {"code": "open", "name": "Открыто", "color": "#ff6b35"},
  {"code": "in_progress", "name": "В работе", "color": "#4ecdc4"},
  {"code": "resolved", "name": "Решено", "color": "#45b7d1"},
  {"code": "closed", "name": "Закрыто", "color": "#96ceb4", "readonly": true}
]'::jsonb
WHERE custom_statuses IS NULL;

UPDATE projects 
SET custom_priorities = '[
  {"code": "low", "name": "Низкий", "color": "#4caf50"},
  {"code": "medium", "name": "Средний", "color": "#ff9800"},
  {"code": "high", "name": "Высокий", "color": "#f44336"},
  {"code": "critical", "name": "Критический", "color": "#9c27b0"}
]'::jsonb
WHERE custom_priorities IS NULL;

