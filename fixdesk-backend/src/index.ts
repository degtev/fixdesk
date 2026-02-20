import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

declare global {
  var projectClients: Map<string, Set<{ res: Response; clientId: string }>> | undefined;
}

import authRoutes from './routes/auth';
import googleAuthRoutes from './routes/google-auth';
import yandexAuthRoutes from './routes/yandex-auth';
import githubAuthRoutes from './routes/github-auth';
import telegramAuthRoutes from './routes/telegram-auth';
import projectRoutes from './routes/projects';
import bugRoutes from './routes/bugs';
import activityRoutes from './routes/activity';
import attachmentRoutes from './routes/attachments';
import importExportRoutes from './routes/import-export';
import workspaceRoutes from './routes/workspaces';
import adminRoutes from './routes/admin';
import { initTelegramBot } from './telegram-bot';

import { authMiddleware, AuthRequest } from './middleware/auth';
import { createUsersTable } from './models/user';
import { getUserById, getInvitationsByInviterId, getInvitedUsers } from './models/user';
import { createProjectTables, checkTableStructure, cleanDuplicateProjectMembers, isProjectMember } from './models/project';
import { createSocialAccountsTables } from './models/socialAccount';
import pool from './db';

let io: Server;

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + extension);
  }
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('FixDesk API is running');
});

app.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    return res.status(401).json({ message: 'Не авторизован' });
  }

  try {
    const user = await getUserById(authReq.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const invitations = await getInvitationsByInviterId(authReq.user.userId);

    const invitedUsers = await getInvitedUsers(authReq.user.userId);

    const response = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      position: user.position,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || null,
      email_verified: user.email_verified || false,
      invited_by: user.invited_by || null,
      has_password: !!user.password_hash,
      is_deleted: authReq.user.isDeleted || false,
      deletion_scheduled_at: authReq.user.deletionScheduledAt || null,
      invitations: invitations,
      invited_users: invitedUsers
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.put('/me', authMiddleware, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { first_name, last_name, position, avatar_url } = req.body;

  console.log(req.body);
  if (!authReq.user) {
    console.log('Не авторизован');
    return res.status(401).json({ message: 'Не авторизован' });
  }

  if (!first_name || !last_name) {
    console.log('Имя и фамилия обязательны');
    return res.status(400).json({ message: 'Имя и фамилия обязательны' });
  }

  try {
    const result = await pool.query(
      `UPDATE users 
             SET first_name = $1, last_name = $2, position = $3, avatar_url = $4, updated_at = NOW()
             WHERE id = $5 
             RETURNING id, email, first_name, last_name, role, position, avatar_url`,
      [first_name, last_name, position || null, avatar_url || null, authReq.user.userId]
    );


    if (result.rows.length === 0) {
      console.log('Пользователь не найден');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const updatedUser = result.rows[0];

    res.json({
      message: 'Профиль успешно обновлен',
      user: updatedUser
    });
  } catch (err) {
    console.log('Ошибка обновления профиля', err);
    res.status(500).json({ message: 'Ошибка обновления профиля' });
  }
});

app.use('/uploads', express.static('uploads'));

app.use('/api/project-icons', express.static('uploads/project-icons'));

app.use('/auth', authRoutes);
app.use('/oauth', googleAuthRoutes);
app.use('/oauth', yandexAuthRoutes);
app.use('/oauth', githubAuthRoutes);
app.use('/oauth', telegramAuthRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/projects', projectRoutes);
app.use('/bugs', bugRoutes);
app.use('/admin', adminRoutes);
app.use('/', activityRoutes);
app.use('/', attachmentRoutes);
app.use('/', importExportRoutes);

app.post('/upload-avatar', authMiddleware, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Нет файла' });
    }

    const url = `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/avatars/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    res.status(500).json({ message: 'Ошибка загрузки аватара' });
  }
});

app.use((error: any, req: Request, res: Response, next: any) => {
  if (req.path === '/upload-avatar') {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Размер файла превышает 5MB' });
      }
      return res.status(400).json({ message: error.message });
    }
    if (error) {
      return res.status(400).json({ message: error.message || 'Ошибка загрузки файла' });
    }
  }
  next(error);
});

app.get('/projects/:projectId/bug-viewers', authMiddleware, (req, res) => {
  const { projectId } = req.params;
  const result: Record<string, any[]> = {};
  for (const [bugId, viewersMap] of bugViewers.entries()) {
    const anyViewer = Array.from(viewersMap.values())[0] as any;
    if (anyViewer && String(anyViewer.projectId) === String(projectId)) {
      result[String(bugId)] = Array.from(viewersMap.values());
    }
  }
  res.json(result);
});

app.get('/project/:projectId/updates', (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const token = req.query.token as string;

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.id || decoded.userId;

    isProjectMember(parseInt(projectId), userId).then((hasAccess: boolean) => {

      if (!hasAccess) {
        return res.status(403).json({ message: 'Нет доступа к проекту' });
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      res.write('data: {"type": "connected", "message": "Connected to project updates"}\n\n');

      const clientId = `${projectId}-${userId}-${Date.now()}`;

      if (!global.projectClients) {
        global.projectClients = new Map();
      }

      if (!global.projectClients.has(projectId)) {
        global.projectClients.set(projectId, new Set());
      }

      global.projectClients.get(projectId)!.add({ res, clientId });

      req.on('close', () => {
        if (global.projectClients && global.projectClients.has(projectId)) {
          global.projectClients.get(projectId)!.delete({ res, clientId });
        }
      });
    }).catch((error: any) => {
      return res.status(500).json({ message: 'Ошибка проверки доступа к проекту' });
    });
  } catch (error: any) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
});

export const notifyProjectUpdate = (projectId: string, data: any) => {
  if (global.projectClients && global.projectClients.has(projectId)) {
    const clients = global.projectClients.get(projectId)!;
    clients.forEach(({ res }) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }
};

const bugViewers = new Map();
const socketUnreadBugs = new Map();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await createUsersTable();
    await createProjectTables();
    await createSocialAccountsTables();

    await checkTableStructure();

    await cleanDuplicateProjectMembers();

    try {
      const fs = require('fs');
      const path = require('path');
      const migrationsDir = path.join(__dirname, '../migrations');
      if (fs.existsSync(migrationsDir)) {
        const migrationOrder = [
          'add_bug_uuid.sql',
          'add_custom_statuses_priorities.sql',
          'add_project_terminology.sql',
          'add_project_uuid.sql',
          'add_social_accounts.sql',
          'add_soft_delete.sql',
          'add_workspaces.sql',
          'add_workspace_uuid.sql',
          'bug_attachments.sql',
          'bug_time_tracks.sql',
          'user_activities.sql'
        ];

        for (const fileName of migrationOrder) {
          const filePath = path.join(migrationsDir, fileName);
          if (fs.existsSync(filePath)) {
            const migrationSQL = fs.readFileSync(filePath, 'utf8');
            await pool.query(migrationSQL);
            console.log(`Миграция ${fileName} применена`);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка применения миграций:', error);
    }

    const server = app.listen(PORT, () => {
      console.log('Сервер запущен на порту', process.env.PORT || 3000);
    });

    io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

    io.on('connection', (socket) => {
      socketUnreadBugs.set(socket.id, new Set());

      socket.on('join_user', (userId) => {
        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`Socket ${socket.id} joined user_${userId}`);
        }
      });

      const userId = socket.handshake.query.userId;
      if (userId) {
        socket.join(`user_${userId}`);
      }

      socket.on('join_project', (projectId) => {
        socket.join(`project_${projectId}`);
      });
      socket.on('leave_project', (projectId) => {
        socket.leave(`project_${projectId}`);
      });
      socket.on('new_comment', (bugId) => {
        socketUnreadBugs.get(socket.id)?.add(bugId);
      });
      socket.on('read_comments', (bugId) => {
        socketUnreadBugs.get(socket.id)?.delete(bugId);
        socket.emit('comments_read', bugId);
      });
      socket.on('typing_comment', (data) => {
        if (data && data.projectId) {
          socket.to(`project_${data.projectId}`).emit('typing_comment', data);
        }
      });
      socket.on('view_bug', (data) => {
        const { projectId, bugId, userId, name } = data;
        console.log('view_bug event:', data);
        if (!bugViewers.has(bugId)) bugViewers.set(bugId, new Map());
        bugViewers.get(bugId).set(userId, { userId, name, socketId: socket.id, projectId });
        const viewersArr = Array.from(bugViewers.get(bugId).values());
        io.to(`project_${projectId}`).emit('bug_viewers', { bugId, viewers: viewersArr });
        socket.emit('bug_viewers', { bugId, viewers: viewersArr });
      });

      socket.on('leave_bug', (data) => {
        const { projectId, bugId, userId } = data;
        if (bugViewers.has(bugId)) {
          bugViewers.get(bugId).delete(userId);
          const viewersArr = Array.from(bugViewers.get(bugId).values());
          io.to(`project_${projectId}`).emit('bug_viewers', { bugId, viewers: viewersArr });
        }
      });

      socket.on('disconnect', () => {
        socketUnreadBugs.delete(socket.id);
        for (const [bugId, viewersMap] of bugViewers.entries()) {
          for (const [userId, viewer] of viewersMap.entries()) {
            if (viewer.socketId === socket.id) {
              viewersMap.delete(userId);
              io.to(`project_${viewer.projectId}`).emit('bug_viewers', { bugId, viewers: Array.from(viewersMap.values()) });
            }
          }
        }
      });
    });

    (module.exports as any).io = io;

    await initTelegramBot();
  } catch (err) {
    console.error('Ошибка запуска сервера:', err);
    console.error('Стек ошибки:', (err as Error).stack);
    process.exit(1);
  }
})();
