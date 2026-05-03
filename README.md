# FixDesk — Self-Hosted Task & Bug Tracker

FixDesk — это self-hosted система управления задачами и трекинга багов для команд. Создавайте рабочие пространства, проекты, назначайте задачи с приоритетами и дедлайнами, комментируйте в реальном времени и получайте уведомления в Telegram или Email. Вход через Google, GitHub или Yandex. Построена на Node.js, React, PostgreSQL и поддерживает импорт/экспорт CSV/Excel.

## Возможности

- **Рабочие пространства** — изолируйте проекты разных команд или клиентов в независимые пространства.
- **Проекты** — создавайте проекты внутри рабочих пространств с гибкой настройкой.
- **Задачи** — полный жизненный цикл: статусы, приоритеты, дедлайны, описания, комментарии и вложения.
- **Real-time обновления** — изменения (новые комментарии, смена статуса) отображаются у всех участников мгновенно благодаря WebSocket (Socket.IO).
- **Telegram бот** — просматривайте и создавайте задачи, получайте уведомления прямо в Telegram.
- **OAuth-аутентификация** — удобный вход через Google, GitHub или Yandex без запоминания паролей.
- **Email-уведомления** — оповещения о назначении задач, новых комментариях и важных событиях.
- **Импорт/Экспорт** — переносите данные через CSV и Excel (например, миграция из других трекеров).

## Технологии

- **Backend:** Node.js, Express, TypeScript, PostgreSQL, Socket.IO
- **Frontend:** React, TypeScript, Material UI, Vite
- **Admin:** React, Ant Design

## Запуск

### Требования

- Node.js 18+
- PostgreSQL 14+

### Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/fixdesk.git
cd fixdesk
```

2. Установите зависимости:
```bash
cd fixdesk-backend && npm install
cd ../fixdesk-frontend && npm install
cd ../fixdesk-admin && npm install
```

3. Настройте переменные окружения:

**Backend** (fixdesk-backend/.env):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/fixdesk
JWT_SECRET=your-secret-key
PORT=3888

SMTP_HOST=smtp.example.com
SMTP_USER=your@email.com
SMTP_PASS=password
SMTP_PORT=465

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3888

# OAuth (опционально)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=
```

**Frontend** (fixdesk-frontend/.env):
```env
VITE_BACKEND_URL=http://localhost:3888
VITE_SOCKET_URL=http://localhost:3888
```

4. Создайте базу данных и примените миграции:
```bash
cd fixdesk-backend
# Создайте БД, затем выполните SQL файлы из папки migrations/
```

5. Запустите серверы:

```bash
# Backend (терминал 1)
cd fixdesk-backend
npm run dev

# Frontend (терминал 2)
cd fixdesk-frontend
npm run dev

# Admin панель (терминал 3, опционально)
cd fixdesk-admin
npm run dev
```

Приложение будет доступно:
- Frontend: http://localhost:5173
- Admin: http://localhost:5174
- API: http://localhost:3888

## Структура проекта

```
fixdesk/
├── fixdesk-backend/     # API сервер
├── fixdesk-frontend/    # Основной интерфейс
├── fixdesk-admin/       # Админ-панель
└── fixdesk-newfrontend/ # Новый интерфейс (в разработке)
```

## License

MIT License — делайте с кодом что хотите.
