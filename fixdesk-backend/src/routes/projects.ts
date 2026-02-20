import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
    createProject,
    getProjectById,
    getProjectByUuid,
    getProjectsByUser,
    updateProject,
    deleteProject,
    addProjectMember,
    isProjectMember,
    getProjectMembers,
    getProjectMembersForAssignment,
    findUsersByEmail,
    removeProjectMember
} from '../models/project';
import { getUserById, isEmailNotificationEnabled } from '../models/user';
import { renderEmailTemplate } from '../emailTemplates';
const { io } = require('../index');

const router = express.Router();


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


async function sendProjectInvitationEmail(
    userEmail: string,
    userName: string,
    projectName: string,
    inviterName: string,
    projectUuid: string
) {
    try {

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const projectUrl = `${frontendUrl}/project/${projectUuid}`;


        const { subject, html } = renderEmailTemplate('project_invitation', {
            userName,
            projectName,
            inviterName,
            projectUrl
        });


        const result = await transporter.sendMail({
            from: `"FixDesk" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject,
            html
        });


    } catch (error) {

    }
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/project-icons';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'project-icon-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены!'));
        }
    }
});


const defaultIcons = [
    '/api/project-icons/default-1.png',
    '/api/project-icons/default-2.png',
    '/api/project-icons/default-3.png',
    '/api/project-icons/default-4.png',
    '/api/project-icons/default-5.png'
];

router.get('/default-icons', (req, res) => {
    res.json({ icons: defaultIcons });
});

router.post('/', authMiddleware, upload.single('icon'), async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const {
            name,
            description,
            iconType,
            members,
            workspace_id,
            item_name_singular = 'задача',
            item_name_nominative = 'задачи',
            item_name_genitive = 'задач',
            item_name_accusative = 'задачу',
            custom_statuses,
            custom_priorities
        } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!name || !description) {
            return res.status(400).json({ message: 'Название и описание обязательны' });
        }

        if (!workspace_id) {
            return res.status(400).json({ message: 'Workspace ID обязателен' });
        }

        const workspaceAccess = await pool.query(
            `SELECT * FROM workspaces 
             WHERE id = $1 AND (owner_id = $2 OR id IN 
                (SELECT workspace_id FROM workspace_members WHERE user_id = $2))`,
            [workspace_id, authReq.user.userId]
        );

        if (workspaceAccess.rows.length === 0) {
            return res.status(403).json({ message: 'Нет доступа к этому рабочему пространству' });
        }

        let iconUrl = '';

        if (iconType === 'upload' && req.file) {
            iconUrl = `/api/project-icons/${req.file.filename}`;
        } else if (iconType === 'default' && req.body.defaultIcon) {
            iconUrl = req.body.defaultIcon;
        } else {
            iconUrl = defaultIcons[0];
        }

        const project = await createProject({
            name,
            description,
            icon_url: iconUrl,
            created_by: authReq.user.userId,
            workspace_id: parseInt(workspace_id),
            item_name_singular,
            item_name_nominative,
            item_name_genitive,
            item_name_accusative,
            custom_statuses: custom_statuses ? JSON.parse(custom_statuses) : undefined,
            custom_priorities: custom_priorities ? JSON.parse(custom_priorities) : undefined,
        });

        let memberIds: number[] = [];
        if (members) {
            if (Array.isArray(members)) {
                memberIds = members.map(id => parseInt(id.toString()));
            } else if (typeof members === 'string') {
                memberIds = members.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            }

            const creator = await getUserById(authReq.user.userId);
            if (!creator) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }

            for (const memberId of memberIds) {
                if (memberId && memberId !== authReq.user.userId) {
                    try {
                        await addProjectMember(project.id!, memberId, authReq.user.userId);

                        const userToAdd = await getUserById(memberId);
                        if (userToAdd) {

                            const notificationsEnabled = await isEmailNotificationEnabled(userToAdd.id!, 'project_invitations');

                            if (notificationsEnabled) {
                                sendProjectInvitationEmail(
                                    userToAdd.email,
                                    `${userToAdd.first_name} ${userToAdd.last_name}`,
                                    project.name,
                                    `${creator.first_name} ${creator.last_name}`,
                                    project.uuid!
                                ).then(() => {

                                }).catch(error => {

                                });
                            } else {

                            }
                        }
                    } catch (error) {

                    }
                }
            }
        }

        if (io && memberIds && memberIds.length > 0) {
            for (const memberId of memberIds) {
                if (memberId && memberId !== authReq.user.userId) {
                    console.log('Emitting project_created to', memberId, project);
                    io.to(`user_${memberId}`).emit('project_created', { project });
                }
            }
        }

        res.status(201).json(project);
    } catch (error) {

        res.status(500).json({
            message: 'Ошибка создания проекта',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const projects = await getProjectsByUser(authReq.user.userId);
        res.json(projects);
    } catch (error) {

        res.status(500).json({ message: 'Ошибка получения проектов' });
    }
});

router.get('/:uuid', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.uuid;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const hasAccess = await isProjectMember(project.id!, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        res.json(project);
    } catch (error) {

        res.status(500).json({ message: 'Ошибка получения проекта' });
    }
});


router.put('/:uuid', authMiddleware, upload.single('icon'), async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.uuid;
        const {
            name,
            description,
            iconType,
            members,
            item_name_singular,
            item_name_nominative,
            item_name_genitive,
            item_name_accusative,
            custom_statuses,
            custom_priorities
        } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const currentProject = await getProjectByUuid(projectUuid);
        if (!currentProject) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const currentUserId = parseInt(authReq.user.userId.toString());
        const projectCreatorId = parseInt(currentProject.created_by.toString());

        let canEdit = currentUserId === projectCreatorId;

        if (!canEdit && currentProject.workspace_id) {
            const workspaceCheck = await pool.query(
                'SELECT owner_id FROM workspaces WHERE id = $1',
                [currentProject.workspace_id]
            );
            if (workspaceCheck.rows.length > 0) {
                const workspaceOwnerId = parseInt(workspaceCheck.rows[0].owner_id.toString());
                if (workspaceOwnerId === currentUserId) {
                    canEdit = true;
                }
            }
        }

        if (!canEdit) {
            return res.status(403).json({ message: 'Недостаточно прав для редактирования проекта' });
        }

        let iconUrl = currentProject.icon_url;

        if (iconType === 'upload' && req.file) {
            iconUrl = `/api/project-icons/${req.file.filename}`;
        } else if (iconType === 'default' && req.body.defaultIcon) {
            iconUrl = req.body.defaultIcon;
        } else if (iconType === 'remove') {
            iconUrl = defaultIcons[0];
        }

        const updatedProject = await updateProject(currentProject.id!, {
            name: name || currentProject.name,
            description: description || currentProject.description,
            icon_url: iconUrl,
            item_name_singular,
            item_name_nominative,
            item_name_genitive,
            item_name_accusative,
            custom_statuses: custom_statuses ? JSON.parse(custom_statuses) : undefined,
            custom_priorities: custom_priorities ? JSON.parse(custom_priorities) : undefined,
        });

        if (!updatedProject) {
            return res.status(500).json({ message: 'Ошибка обновления проекта' });
        }

        const creator = await getUserById(authReq.user.userId);
        if (!creator) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (members) {
            let memberIds: number[] = [];

            if (Array.isArray(members)) {
                memberIds = members.map(id => parseInt(id.toString()));
            } else if (typeof members === 'string') {
                memberIds = members.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            }


            for (const memberId of memberIds) {
                if (memberId && memberId !== authReq.user.userId) {
                    try {
                        const isAlreadyMember = await isProjectMember(currentProject.id!, memberId);
                        if (!isAlreadyMember) {
                            await addProjectMember(currentProject.id!, memberId, authReq.user.userId);

                            const userToAdd = await getUserById(memberId);
                            if (userToAdd) {

                                const notificationsEnabled = await isEmailNotificationEnabled(userToAdd.id!, 'project_invitations');

                                if (notificationsEnabled) {
                                    sendProjectInvitationEmail(
                                        userToAdd.email,
                                        `${userToAdd.first_name} ${userToAdd.last_name}`,
                                        updatedProject.name,
                                        `${creator.first_name} ${creator.last_name}`,
                                        updatedProject.uuid!
                                    ).then(() => {

                                    }).catch(error => {

                                    });
                                } else {

                                }
                            }
                        } else {

                        }
                    } catch (error) {

                    }
                }
            }
        }


        res.json(updatedProject);
    } catch (error) {

        res.status(500).json({
            message: 'Ошибка обновления проекта',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/:uuid/members', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.uuid;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const hasAccess = await isProjectMember(project.id!, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const members = await getProjectMembers(project.id!);
        res.json(members);
    } catch (error) {

        res.status(500).json({ message: 'Ошибка получения участников проекта' });
    }
});

router.get('/:uuid/members/assignment', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.uuid;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const hasAccess = await isProjectMember(project.id!, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const members = await getProjectMembersForAssignment(project.id!);
        res.json(members);
    } catch (error) {

        res.status(500).json({ message: 'Ошибка получения участников проекта' });
    }
});

router.post('/:uuid/members', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.uuid;
        const { userId } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!userId) {
            return res.status(400).json({ message: 'ID пользователя обязателен' });
        }

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const hasAccess = await isProjectMember(project.id!, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const userToAdd = await getUserById(userId);
        if (!userToAdd) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const inviter = await getUserById(authReq.user.userId);
        if (!inviter) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const member = await addProjectMember(project.id!, userId, authReq.user.userId);

        const notificationsEnabled = await isEmailNotificationEnabled(userToAdd.id!, 'project_invitations');

        if (notificationsEnabled) {

            sendProjectInvitationEmail(
                userToAdd.email,
                `${userToAdd.first_name} ${userToAdd.last_name}`,
                project.name,
                `${inviter.first_name} ${inviter.last_name}`,
                project.uuid!
            ).then(() => {

            }).catch(error => {

            });
        } else {

        }

        const projectFull = await getProjectById(project.id!);
        if (io && projectFull) {
            io.to(`user_${userId}`).emit('project_updated', { project: projectFull });
        }

        res.status(201).json(member);
    } catch (error) {

        res.status(500).json({ message: 'Ошибка добавления участника' });
    }
});

router.delete('/:uuid/members/:userId', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.uuid;
        const userId = parseInt(req.params.userId);

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Неверный ID пользователя' });
        }

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const currentUserId = parseInt(authReq.user.userId.toString());
        const projectCreatorId = parseInt(project.created_by.toString());

        let canManageMembers = currentUserId === projectCreatorId;

        if (!canManageMembers && project.workspace_id) {
            const workspaceCheck = await pool.query(
                'SELECT owner_id FROM workspaces WHERE id = $1',
                [project.workspace_id]
            );
            if (workspaceCheck.rows.length > 0) {
                const workspaceOwnerId = parseInt(workspaceCheck.rows[0].owner_id.toString());
                if (workspaceOwnerId === currentUserId) {
                    canManageMembers = true;
                }
            }
        }

        if (!canManageMembers) {
            return res.status(403).json({ message: 'Недостаточно прав для управления участниками проекта' });
        }

        if (userId === authReq.user.userId) {
            return res.status(400).json({ message: 'Нельзя удалить себя из проекта' });
        }

        const isMember = await isProjectMember(project.id!, userId);
        if (!isMember) {
            return res.status(404).json({ message: 'Пользователь не является участником проекта' });
        }

        await removeProjectMember(project.id!, userId);
        if (io) {
            io.to(`user_${userId}`).emit('project_removed', { projectId: project.id });
        }
        res.json({ message: 'Участник удален из проекта' });
    } catch (error) {

        res.status(500).json({ message: 'Ошибка удаления участника' });
    }
});

router.get('/search/users', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { email } = req.query;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email обязателен' });
        }

        const users = await findUsersByEmail(email);
        res.json(users);
    } catch (error) {

        res.status(500).json({ message: 'Ошибка поиска пользователей' });
    }
});

router.delete('/:uuid', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.uuid;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const currentUserId = parseInt(authReq.user.userId.toString());
        const projectCreatorId = parseInt(project.created_by.toString());

        let canDelete = currentUserId === projectCreatorId;

        if (!canDelete && project.workspace_id) {
            const workspaceCheck = await pool.query(
                'SELECT owner_id FROM workspaces WHERE id = $1',
                [project.workspace_id]
            );
            if (workspaceCheck.rows.length > 0) {
                const workspaceOwnerId = parseInt(workspaceCheck.rows[0].owner_id.toString());
                if (workspaceOwnerId === currentUserId) {
                    canDelete = true;
                }
            }
        }

        if (!canDelete) {
            return res.status(403).json({ message: 'Недостаточно прав для удаления проекта' });
        }

        const deleted = await deleteProject(project.id!);
        if (!deleted) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        res.json({ message: 'Проект успешно удален' });
    } catch (error) {

        res.status(500).json({ message: 'Ошибка удаления проекта' });
    }
});

export default router;