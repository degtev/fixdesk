import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import pool from '../db';
import { notifyProjectUpdate } from '../index';
import { getUserById, isEmailNotificationEnabled } from '../models/user';
import {
    createBugList,
    getBugListById,
    getBugListByUuid,
    getBugListWithUsers,
    getBugListWithUsersByUuid,
    getBugListsByProject,
    updateBugList,
    updateBugListByUuid,
    deleteBugList,
    deleteBugListByUuid,
    createBugComment,
    getBugComments,
    isProjectMember,
    getProjectById,
    getProjectByUuid
} from '../models/project';
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

async function sendBugAssignmentEmail(
    assigneeEmail: string,
    assigneeName: string,
    bugTitle: string,
    projectName: string,
    assignedByName: string,
    bugUuid: string,
    projectUuid: string
) {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const bugUrl = `${frontendUrl}/project/${projectUuid}?task=${bugUuid}`;

        const { subject, html } = renderEmailTemplate('bug_assignment', {
            assigneeName,
            bugTitle,
            projectName,
            assignedByName,
            bugUrl
        });
        await transporter.sendMail({
            from: `"FixDesk" <${process.env.SMTP_USER}>`,
            to: assigneeEmail,
            subject,
            html
        });

    } catch (error) {
        console.error(`Ошибка отправки email уведомления о назначении бага пользователю ${assigneeEmail}:`);
        console.error(`   - Детали ошибки:`, error);
        console.error(`   - SMTP конфигурация:`, {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            hasPass: !!process.env.SMTP_PASS
        });
        throw error;
    }
}

async function sendBugCommentEmail(
    recipientEmail: string,
    recipientName: string,
    bugTitle: string,
    projectName: string,
    commentAuthorName: string,
    commentText: string,
    bugUuid: string,
    projectUuid: string,
    isReply: boolean = false,
    parentCommentAuthor?: string
) {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const bugUrl = `${frontendUrl}/project/${projectUuid}?task=${bugUuid}`;

        const { subject: commentSubject, html: commentHtml } = renderEmailTemplate(isReply ? 'bug_comment_reply' : 'bug_comment', {
            recipientName,
            bugTitle,
            projectName,
            commentAuthorName,
            commentText,
            bugUrl,
            parentCommentAuthor
        });
        await transporter.sendMail({
            from: `"FixDesk" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            subject: commentSubject,
            html: commentHtml
        });

    } catch (error) {
        console.error(`Ошибка отправки email уведомления о комментарии к багу пользователю ${recipientEmail}:`);
        console.error(`   - Детали ошибки:`, error);
        console.error(`   - SMTP конфигурация:`, {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            hasPass: !!process.env.SMTP_PASS
        });
        throw error;
    }
}

async function sendBugVerificationEmail(
    creatorEmail: string,
    creatorName: string,
    bugTitle: string,
    projectName: string,
    bugUuid: string,
    projectUuid: string
) {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const bugUrl = `${frontendUrl}/project/${projectUuid}?task=${bugUuid}`;
        const { subject: verifySubject, html: verifyHtml } = renderEmailTemplate('bug_verification', {
            creatorName,
            bugTitle,
            projectName,
            bugUrl
        });
        await transporter.sendMail({
            from: `"FixDesk" <${process.env.SMTP_USER}>`,
            to: creatorEmail,
            subject: verifySubject,
            html: verifyHtml
        });
    } catch (error) {
        console.error(`Ошибка отправки email уведомления о необходимости проверки бага постановщику ${creatorEmail}:`, error);
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/bug-attachments';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bug-attachment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Неподдерживаемый тип файла'));
        }
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { project_uuid, title, description, status, priority, assigned_to } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!project_uuid || !title || !description) {
            return res.status(400).json({ message: 'UUID проекта, название и описание обязательны' });
        }

        const project = await getProjectByUuid(project_uuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const hasAccess = await isProjectMember(project.id!, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const bugList = await createBugList({
            project_id: project.id!,
            title,
            description,
            status: status || 'open',
            priority: priority || 'medium',
            created_by: authReq.user.userId,
            assigned_to: assigned_to ? parseInt(assigned_to) : undefined
        });

        const fullBugData = await getBugListWithUsers(bugList.id!);

        if (assigned_to && assigned_to !== authReq.user.userId) {
            try {
                const assignee = await getUserById(parseInt(assigned_to));
                if (assignee) {
                    const creator = await getUserById(authReq.user.userId);
                    if (creator && project) {

                        const notificationsEnabled = await isEmailNotificationEnabled(assignee.id!, 'bug_assignments');

                        if (notificationsEnabled) {
                            sendBugAssignmentEmail(
                                assignee.email,
                                `${assignee.first_name} ${assignee.last_name}`,
                                title,
                                project.name,
                                `${creator.first_name} ${creator.last_name}`,
                                bugList.uuid!,
                                project.uuid!
                            ).then(() => {
                            }).catch(error => {
                            });
                        } else {
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка при отправке email уведомления о назначении бага:', error);
            }
        }

        const { io } = require('../index');
        if (io && project.id) {
            io.to(`project_${project.id}`).emit('bug_created', {
                projectId: project.id,
                bug: fullBugData
            });
        }

        notifyProjectUpdate(project.id!.toString(), {
            type: 'bug_created',
            bug: fullBugData
        });

        res.status(201).json(fullBugData);
    } catch (error) {
        console.error('Error creating bug list:', error);
        res.status(500).json({ message: 'Ошибка создания баг-листа' });
    }
});

router.get('/project/:projectUuid', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.projectUuid;

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

        const bugLists = await getBugListsByProject(project.id!);
        res.json(bugLists);
    } catch (error) {
        console.error('Error getting bug lists:', error);
        res.status(500).json({ message: 'Ошибка получения баг-листов' });
    }
});

router.get('/test-comments', (req, res) => {
    res.json({ message: 'Comments router is working!' });
});

router.get('/:bugUuid/comments', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const bugUuid = req.params.bugUuid;
        if (!authReq.user) return res.status(401).json({ message: 'Не авторизован' });
        const bug = await getBugListByUuid(bugUuid);
        if (!bug) return res.status(404).json({ message: 'Баг не найден' });
        const hasAccess = await isProjectMember(bug.project_id, authReq.user.userId);
        if (!hasAccess) return res.status(403).json({ message: 'Нет доступа к проекту' });
        const comments = await getBugComments(bug.id!);
        res.json(comments);
    } catch (error) {
        console.error('Error getting bug comments:', error);
        res.status(500).json({ message: 'Ошибка получения комментариев' });
    }
});

router.post('/:bugUuid/comments', authMiddleware, upload.single('attachment'), async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const bugUuid = req.params.bugUuid;
        const { comment, parent_id } = req.body;
        let attachment_url = undefined;
        if (!authReq.user) return res.status(401).json({ message: 'Не авторизован' });
        if (!comment) return res.status(400).json({ message: 'Текст комментария обязателен' });
        const bug = await getBugListByUuid(bugUuid);
        if (!bug) return res.status(404).json({ message: 'Баг не найден' });
        const hasAccess = await isProjectMember(bug.project_id, authReq.user.userId);
        if (!hasAccess) return res.status(403).json({ message: 'Нет доступа к проекту' });
        if (req.file) {
            attachment_url = `/uploads/bug-attachments/${req.file.filename}`;
        }
        const newComment = await createBugComment({
            bug_id: bug.id!,
            user_id: authReq.user.userId,
            comment,
            attachment_url,
            parent_id: parent_id ? parseInt(parent_id) : null
        });

        try {
            const fullBugData = await getBugListWithUsers(bug.id!);
            if (fullBugData) {
                const project = await getProjectById(bug.project_id);
                if (project) {
                    const commentAuthor = await getUserById(authReq.user.userId);
                    if (commentAuthor) {

                        if (parent_id) {
                            const parentComment = await getBugComments(bug.id!);
                            const parentCommentData = parentComment.find(c => c.id === parseInt(parent_id));

                            if (parentCommentData && parentCommentData.user_id !== authReq.user.userId) {
                                const parentCommentAuthor = await getUserById(parentCommentData.user_id);
                                if (parentCommentAuthor) {

                                    const notificationsEnabled = await isEmailNotificationEnabled(parentCommentAuthor.id!, 'comment_replies');

                                    if (notificationsEnabled) {
                                        sendBugCommentEmail(
                                            parentCommentAuthor.email,
                                            `${parentCommentAuthor.first_name} ${parentCommentAuthor.last_name}`,
                                            fullBugData.title,
                                            project.name,
                                            `${commentAuthor.first_name} ${commentAuthor.last_name}`,
                                            comment,
                                            bug.uuid!,
                                            project.uuid!,
                                            true,
                                            `${parentCommentAuthor.first_name} ${parentCommentAuthor.last_name}`
                                        ).then(() => {
                                        }).catch(error => {
                                        });
                                    } else {
                                    }
                                }
                            }
                        } else {
                            if (fullBugData.assigned_to && fullBugData.assigned_to !== authReq.user.userId) {
                                const assignee = await getUserById(fullBugData.assigned_to);
                                if (assignee) {

                                    const notificationsEnabled = await isEmailNotificationEnabled(assignee.id!, 'bug_comments');

                                    if (notificationsEnabled) {
                                        sendBugCommentEmail(
                                            assignee.email,
                                            `${assignee.first_name} ${assignee.last_name}`,
                                            fullBugData.title,
                                            project.name,
                                            `${commentAuthor.first_name} ${commentAuthor.last_name}`,
                                            comment,
                                            bug.uuid!,
                                            project.uuid!,
                                            false
                                        ).then(() => {
                                        }).catch(error => {
                                        });
                                    } else {
                                    }
                                }
                            } else {
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при отправке email уведомления о комментарии:', error);
        }

        notifyProjectUpdate(bug.project_id.toString(), {
            type: 'comment_added',
            bugId: bug.id!,
            bugUuid: bug.uuid,
            comment: newComment
        });

        const { io } = require('../index');
        if (io && bug && bug.project_id) {
            io.to(`project_${bug.project_id}`).emit('new_comment', {
                projectId: bug.project_id,
                bugId: bug.id!,
                bugUuid: bug.uuid,
                comment: newComment,
                userId: authReq.user.userId
            });
        }

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error creating bug comment:', error);
        res.status(500).json({ message: 'Ошибка создания комментария' });
    }
});

router.get('/:bugUuid/share', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const bugUuid = req.params.bugUuid;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const bugList = await getBugListWithUsersByUuid(bugUuid);
        if (!bugList) {
            return res.status(404).json({ message: 'Баг-лист не найден' });
        }

        const hasAccess = await isProjectMember(bugList.project_id, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const { getProjectById } = require('../models/project');
        const project = await getProjectById(bugList.project_id);

        res.json({
            bug: bugList,
            project: project
        });
    } catch (error) {
        console.error('Error getting bug for sharing:', error);
        res.status(500).json({ message: 'Ошибка получения информации о баге' });
    }
});

router.get('/:bugUuid', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const bugUuid = req.params.bugUuid;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const bugList = await getBugListByUuid(bugUuid);
        if (!bugList) {
            return res.status(404).json({ message: 'Баг-лист не найден' });
        }
        const hasAccess = await isProjectMember(bugList.project_id, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        res.json(bugList);
    } catch (error) {
        console.error('Error getting bug list:', error);
        res.status(500).json({ message: 'Ошибка получения баг-листа' });
    }
});

router.put('/:bugUuid', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const bugUuid = req.params.bugUuid;
        const { title, description, status, priority, assigned_to } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const existingBug = await getBugListByUuid(bugUuid);
        if (!existingBug) {
            return res.status(404).json({ message: 'Баг-лист не найден' });
        }

        const hasAccess = await isProjectMember(existingBug.project_id, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const updatedBug = await updateBugListByUuid(bugUuid, {
            title,
            description,
            status,
            priority,
            assigned_to: assigned_to ? parseInt(assigned_to) : undefined
        });

        if (!updatedBug) {
            return res.status(404).json({ message: 'Баг-лист не найден' });
        }

        const fullBugData = await getBugListWithUsersByUuid(bugUuid);

        if (
            status !== undefined &&
            status === 'resolved' &&
            existingBug.status !== 'resolved'
        ) {
            const creator = await getUserById(existingBug.created_by);
            if (creator && creator.email) {
                const notificationsEnabled = await isEmailNotificationEnabled(creator.id!, 'bug_verification');
                if (notificationsEnabled) {
                    const project = await getProjectById(existingBug.project_id);
                    await sendBugVerificationEmail(
                        creator.email,
                        `${creator.first_name} ${creator.last_name}`,
                        updatedBug.title,
                        project?.name || '',
                        existingBug.uuid!,
                        project?.uuid || ''
                    );
                }
            }
        }

        const assignmentChanged = existingBug.assigned_to !== updatedBug.assigned_to;

        if (assignmentChanged && updatedBug.assigned_to && updatedBug.assigned_to !== authReq.user.userId) {
            try {
                const newAssignee = await getUserById(updatedBug.assigned_to);
                if (newAssignee) {
                    const assignedBy = await getUserById(authReq.user.userId);
                    if (assignedBy) {
                        const project = await getProjectById(existingBug.project_id);
                        if (project) {

                            const notificationsEnabled = await isEmailNotificationEnabled(newAssignee.id!, 'bug_assignments');

                            if (notificationsEnabled) {
                                sendBugAssignmentEmail(
                                    newAssignee.email,
                                    `${newAssignee.first_name} ${newAssignee.last_name}`,
                                    updatedBug.title,
                                    project.name,
                                    `${assignedBy.first_name} ${assignedBy.last_name}`,
                                    existingBug.uuid!,
                                    project.uuid!
                                ).then(() => {
                                }).catch(error => {
                                });
                            } else {
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка при отправке email уведомления об изменении назначения бага:', error);
            }
        }

        notifyProjectUpdate(existingBug.project_id.toString(), {
            type: assignmentChanged ? 'bug_assignment_changed' : 'bug_updated',
            bug: fullBugData,
            previousAssignee: existingBug.assigned_to,
            newAssignee: updatedBug.assigned_to
        });

        const { io } = require('../index');
        if (io && existingBug.project_id) {
            io.to(`project_${existingBug.project_id}`).emit('bug_updated', {
                projectId: existingBug.project_id,
                bug: fullBugData
            });
        }

        res.json(fullBugData);
    } catch (error) {
        console.error('Error updating bug list:', error);
        res.status(500).json({ message: 'Ошибка обновления баг-листа' });
    }
});

router.patch('/:bugUuid', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const bugUuid = req.params.bugUuid;
        const { status, priority, assigned_to } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const existingBug = await getBugListByUuid(bugUuid);
        if (!existingBug) {
            return res.status(404).json({ message: 'Баг-лист не найден' });
        }

        const hasAccess = await isProjectMember(existingBug.project_id, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to ? parseInt(assigned_to) : undefined;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Не указаны поля для обновления' });
        }

        const updatedBug = await updateBugListByUuid(bugUuid, updateData);

        if (!updatedBug) {
            return res.status(404).json({ message: 'Баг-лист не найден' });
        }

        const fullBugData = await getBugListWithUsersByUuid(bugUuid);

        if (
            status !== undefined &&
            status === 'resolved' &&
            existingBug.status !== 'resolved'
        ) {
            const creator = await getUserById(existingBug.created_by);
            if (creator && creator.email) {
                const notificationsEnabled = await isEmailNotificationEnabled(creator.id!, 'bug_verification');
                if (notificationsEnabled) {
                    const project = await getProjectById(existingBug.project_id);
                    await sendBugVerificationEmail(
                        creator.email,
                        `${creator.first_name} ${creator.last_name}`,
                        updatedBug.title,
                        project?.name || '',
                        existingBug.uuid!,
                        project?.uuid || ''
                    );
                }
            }
        }

        const assignmentChanged = existingBug.assigned_to !== updatedBug.assigned_to;

        if (assignmentChanged && updatedBug.assigned_to && updatedBug.assigned_to !== authReq.user.userId) {
            try {
                const newAssignee = await getUserById(updatedBug.assigned_to);
                if (newAssignee) {
                    const assignedBy = await getUserById(authReq.user.userId);
                    if (assignedBy) {
                        const project = await getProjectById(existingBug.project_id);
                        if (project) {

                            const notificationsEnabled = await isEmailNotificationEnabled(newAssignee.id!, 'bug_assignments');

                            if (notificationsEnabled) {
                                sendBugAssignmentEmail(
                                    newAssignee.email,
                                    `${newAssignee.first_name} ${newAssignee.last_name}`,
                                    updatedBug.title,
                                    project.name,
                                    `${assignedBy.first_name} ${assignedBy.last_name}`,
                                    existingBug.uuid!,
                                    project.uuid!
                                ).then(() => {
                                }).catch(error => {
                                });
                            } else {
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка при отправке email уведомления о быстром изменении назначения бага:', error);
            }
        }

        notifyProjectUpdate(existingBug.project_id.toString(), {
            type: assignmentChanged ? 'bug_assignment_changed' : 'bug_quick_updated',
            bug: fullBugData,
            previousAssignee: existingBug.assigned_to,
            newAssignee: updatedBug.assigned_to
        });

        const { io } = require('../index');
        if (io && existingBug.project_id) {
            io.to(`project_${existingBug.project_id}`).emit('bug_updated', {
                projectId: existingBug.project_id,
                bug: fullBugData
            });
        }

        res.json(fullBugData);
    } catch (error) {
        console.error('Error updating bug list:', error);
        res.status(500).json({ message: 'Ошибка обновления баг-листа' });
    }
});

router.delete('/:bugUuid', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const bugUuid = req.params.bugUuid;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const existingBug = await getBugListByUuid(bugUuid);
        if (!existingBug) {
            return res.status(404).json({ message: 'Баг-лист не найден' });
        }

        const hasAccess = await isProjectMember(existingBug.project_id, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const deleted = await deleteBugListByUuid(bugUuid);
        if (!deleted) {
            return res.status(404).json({ message: 'Баг-лист не найден' });
        }

        const { io } = require('../index');
        if (io && existingBug.project_id) {
            io.to(`project_${existingBug.project_id}`).emit('bug_deleted', {
                projectId: existingBug.project_id,
                bugId: existingBug.id,
                bugUuid: bugUuid
            });
        }

        notifyProjectUpdate(existingBug.project_id.toString(), {
            type: 'bug_deleted',
            bugId: existingBug.id,
            bugUuid: bugUuid
        });

        res.json({ message: 'Баг-лист успешно удален' });
    } catch (error) {
        console.error('Error deleting bug list:', error);
        res.status(500).json({ message: 'Ошибка удаления баг-листа' });
    }
});


router.post('/:bugUuid/time-track/start', authMiddleware, async (req, res) => {
    try {
        const bugUuid = req.params.bugUuid;
        const userId = (req as AuthRequest).user?.userId;
        if (!userId) return res.status(401).json({ message: 'Не авторизован' });
        const bug = await getBugListByUuid(bugUuid);
        if (!bug) return res.status(404).json({ message: 'Баг не найден' });
        const active = await pool.query(
            'SELECT * FROM bug_time_tracks WHERE bug_id = $1 AND user_id = $2 AND end_time IS NULL',
            [bug.id, userId]
        );
        if (active.rows.length > 0) return res.status(400).json({ message: 'Трек уже запущен' });
        const now = new Date();
        await pool.query(
            'INSERT INTO bug_time_tracks (bug_id, user_id, start_time) VALUES ($1, $2, $3)',
            [bug.id, userId, now]
        );
        res.json({ message: 'Трек запущен', start_time: now });
    } catch (e) {
        res.status(500).json({ message: 'Ошибка запуска трека' });
    }
});

router.post('/:bugUuid/time-track/stop', authMiddleware, async (req, res) => {
    try {
        const bugUuid = req.params.bugUuid;
        const userId = (req as AuthRequest).user?.userId;
        if (!userId) return res.status(401).json({ message: 'Не авторизован' });
        const bug = await getBugListByUuid(bugUuid);
        if (!bug) return res.status(404).json({ message: 'Баг не найден' });
        const active = await pool.query(
            'SELECT * FROM bug_time_tracks WHERE bug_id = $1 AND user_id = $2 AND end_time IS NULL',
            [bug.id, userId]
        );
        if (active.rows.length === 0) return res.status(400).json({ message: 'Нет активного трека' });
        const now = new Date();
        const start = new Date(active.rows[0].start_time);
        const duration = Math.floor((now.getTime() - start.getTime()) / 1000);
        await pool.query(
            'UPDATE bug_time_tracks SET end_time = $1, duration = $2 WHERE id = $3',
            [now, duration, active.rows[0].id]
        );
        res.json({ message: 'Трек остановлен', end_time: now, duration });
    } catch (e) {
        res.status(500).json({ message: 'Ошибка остановки трека' });
    }
});

router.get('/:bugUuid/time-track', authMiddleware, async (req, res) => {
    try {
        const bugUuid = req.params.bugUuid;
        const userId = (req as AuthRequest).user?.userId;
        if (!userId) return res.status(401).json({ message: 'Не авторизован' });
        const bug = await getBugListByUuid(bugUuid);
        if (!bug) return res.status(404).json({ message: 'Баг не найден' });
        const tracks = await pool.query(
            'SELECT * FROM bug_time_tracks WHERE bug_id = $1 AND user_id = $2 ORDER BY start_time DESC',
            [bug.id, userId]
        );
        res.json(tracks.rows);
    } catch (e) {
        res.status(500).json({ message: 'Ошибка получения треков' });
    }
});

router.get('/:bugUuid/time-track/all', authMiddleware, async (req, res) => {
    try {
        const bugUuid = req.params.bugUuid;
        const bug = await getBugListByUuid(bugUuid);
        if (!bug) return res.status(404).json({ message: 'Баг не найден' });
        const tracks = await pool.query(
            `SELECT t.*, u.first_name, u.last_name
             FROM bug_time_tracks t
             JOIN users u ON t.user_id = u.id
             WHERE t.bug_id = $1
             ORDER BY t.start_time DESC`,
            [bug.id]
        );
        res.json(tracks.rows);
    } catch (e) {
        res.status(500).json({ message: 'Ошибка получения треков' });
    }
});

router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'Файл слишком большой. Максимальный размер: 10 МБ'
            });
        }
        return res.status(400).json({
            message: `Ошибка загрузки файла: ${error.message}`
        });
    }

    if (error && error.message === 'Неподдерживаемый тип файла') {
        return res.status(400).json({
            message: 'Неподдерживаемый тип файла. Разрешены: JPEG, PNG, GIF, PDF, DOC, DOCX, TXT, ZIP, RAR'
        });
    }

    next(error);
});

export default router;
