import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

import pool, { query } from '../db';
import { User, createInvitation, getInvitationByToken, updateInvitationStatus, getInvitationsByInviter, getInvitedUsers, getUserById, createInvitationRequest, getInvitationRequests, updateInvitationRequestStatus, getInvitationRequestsByRequester, updateInvitationRegistrationTime, deleteUserSafely, getEmailNotificationSettings, updateEmailNotificationSettings } from '../models/user';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { renderEmailTemplate } from '../emailTemplates';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const emailVerificationCodes = new Map<string, { code: string; newEmail: string; expiresAt: number }>();

function isValidEmail(email: string) {
    const trimmedEmail = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
}


function trimEmail(email: string): string {
    return email.trim().toLowerCase();
}


async function userExists(email: string) {
    const trimmedEmail = trimEmail(email);
    const result = await query('SELECT 1 FROM users WHERE email = $1', [trimmedEmail]);
    return result.rows.length > 0;
}


router.post('/register/internal', async (req, res) => {
    try {
        const { email, password, first_name, last_name, position, role, avatar_url } = req.body;

        if (role !== 'internal') {
            return res.status(400).json({ message: 'Несуществующая роль' });
        }

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
        }

        const trimmedEmail = trimEmail(email);

        if (!isValidEmail(trimmedEmail)) {
            return res.status(400).json({ message: 'Неверный формат почты' });
        }

        if (await userExists(trimmedEmail)) {
            return res.status(400).json({ message: 'Пользователь существует' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpiry = new Date(Date.now() + 15 * 60 * 1000);

        await query(
            `INSERT INTO email_verifications (email, verification_code, expires_at) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) 
             DO UPDATE SET verification_code = $2, expires_at = $3`,
            [trimmedEmail, verificationCode, codeExpiry]
        );

        const { subject, html } = renderEmailTemplate('register_confirmation', { verificationCode });
        await transporter.sendMail({
            from: `"FixDesk" <${process.env.SMTP_USER}>`,
            to: trimmedEmail,
            subject,
            html
        });

        res.json({ message: 'Код подтверждения отправлен на ваш email' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email и пароль обязательны' });
        }

        const trimmedEmail = trimEmail(email);

        const result = await query('SELECT * FROM users WHERE email = $1', [trimmedEmail]);

        if (result.rows.length === 0) {

            return res.status(400).json({ message: 'Неверный логин или пароль' });
        }

        const user: User = result.rows[0];

        if (!user.password_hash) {
            return res.status(400).json({ message: 'Этот аккаунт использует OAuth авторизацию. Войдите через Google.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный логин или пароль' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/register/external/invite', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { email } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!email) {
            return res.status(400).json({ message: 'Email обязателен' });
        }

        const trimmedEmail = trimEmail(email);

        if (!isValidEmail(trimmedEmail)) {
            return res.status(400).json({ message: 'Неверный формат email' });
        }

        const existingUser = await query('SELECT * FROM users WHERE email = $1', [trimmedEmail]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Пользователь существует' });
        }

        const existingInvite = await query('SELECT * FROM invitations WHERE invitee_email = $1 AND status = $2', [trimmedEmail, 'pending']);

        let token: string;

        if (existingInvite.rows.length > 0) {
            token = existingInvite.rows[0].token;
        } else {
            const crypto = await import('crypto');
            token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await createInvitation(authReq.user.userId, trimmedEmail, token, expiresAt);
        }

        const registrationLink = `${process.env.FRONTEND_URL}/auth/register/external?token=${token}&email=${trimmedEmail}`;
        const { subject, html } = renderEmailTemplate('register_invite', { registrationLink });
        await transporter.sendMail({
            from: `"FixDesk" <${process.env.SMTP_USER}>`,
            to: trimmedEmail,
            subject,
            html
        });

        res.json({ message: 'Приглашение отправлено' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/register/external/complete', async (req, res) => {
    try {
        const { token, password, first_name, last_name, position, avatar_url } = req.body;

        if (!token || !password || !first_name || !last_name) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        const invitation = await getInvitationByToken(token);

        if (!invitation) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const email = invitation.invitee_email;
        const trimmedEmail = trimEmail(email);

        if (await userExists(trimmedEmail)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, position, avatar_url, user_type, email_verified, invited_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id, email, first_name, last_name, role, position, avatar_url`,
            [trimmedEmail, hashedPassword, first_name, last_name, 'external', position || null, avatar_url || null, 'external', true, invitation.inviter_id]
        );

        try {
            await updateInvitationRegistrationTime(invitation.id);
            await updateInvitationStatus(token, 'completed');
        } catch (error) {

        }

        const user = result.rows[0];
        res.status(201).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email обязателен' });
        }

        const trimmedEmail = trimEmail(email);

        if (!isValidEmail(trimmedEmail)) {
            return res.status(400).json({ message: 'Неверный формат email' });
        }

        const userResult = await query('SELECT * FROM users WHERE email = $1', [trimmedEmail]);

        if (userResult.rows.length === 0) {
            return res.json({ message: 'Если пользователь с таким email существует, инструкции отправлены на почту' });
        }

        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

        await query(
            `INSERT INTO password_resets (email, token, expires_at) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) 
             DO UPDATE SET token = $2, expires_at = $3`,
            [trimmedEmail, resetToken, resetTokenExpiry]
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${trimmedEmail}`;
        const { subject, html } = renderEmailTemplate('password_reset', { resetLink });
        await transporter.sendMail({
            from: `"FixDesk" <${process.env.SMTP_USER}>`,
            to: trimmedEmail,
            subject,
            html
        });
        res.json({ message: 'Если пользователь с таким email существует, инструкции отправлены на почту' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, email, password } = req.body;

        if (!token || !email || !password) {
            return res.status(400).json({ message: 'Все поля обязательны' });
        }

        const trimmedEmail = trimEmail(email);

        if (password.length < 6) {
            return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
        }

        const resetResult = await query(
            'SELECT * FROM password_resets WHERE email = $1 AND token = $2 AND expires_at > NOW()',
            [trimmedEmail, token]
        );

        if (resetResult.rows.length === 0) {
            return res.status(400).json({ message: 'Недействительный или истекший токен' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [hashedPassword, trimmedEmail]
        );

        await query('DELETE FROM password_resets WHERE email = $1', [trimmedEmail]);

        res.json({ message: 'Пароль успешно изменен' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/verify-email', async (req, res) => {
    try {
        const { email, verificationCode, password, first_name, last_name, position, role, avatar_url } = req.body;

        if (!email || !verificationCode || !password || !first_name || !last_name) {
            return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
        }

        const trimmedEmail = trimEmail(email);

        const verificationResult = await query(
            'SELECT * FROM email_verifications WHERE email = $1 AND verification_code = $2 AND expires_at > NOW()',
            [trimmedEmail, verificationCode]
        );

        if (verificationResult.rows.length === 0) {
            return res.status(400).json({ message: 'Недействительный или истекший код подтверждения' });
        }

        if (await userExists(trimmedEmail)) {
            return res.status(400).json({ message: 'Пользователь уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, position, avatar_url, email_verified, user_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING id, email, first_name, last_name, role, position, avatar_url`,
            [trimmedEmail, hashedPassword, first_name, last_name, role, position || null, avatar_url || null, true, 'internal']
        );

        await query('DELETE FROM email_verifications WHERE email = $1', [trimmedEmail]);

        const user = result.rows[0];
        res.status(201).json({ user, message: 'Email подтвержден, регистрация завершена' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/smtp-config', async (req, res) => {
    try {
        res.json({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS ? '***SET***' : '***NOT SET***',
            frontendUrl: process.env.FRONTEND_URL
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get SMTP config' });
    }
});


router.get('/invitations', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const invitations = await getInvitationsByInviter(authReq.user.userId);
        res.json({ invitations });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/invited-users', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const invitedUsers = await getInvitedUsers(authReq.user.userId);
        res.json({ invitedUsers });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/who-invited-me', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const user = await getUserById(authReq.user.userId);
        if (!user || !user.invited_by) {
            return res.json({ inviter: null });
        }

        const inviter = await getUserById(user.invited_by);
        res.json({
            inviter: inviter ? {
                id: inviter.id,
                first_name: inviter.first_name,
                last_name: inviter.last_name,
                email: inviter.email
            } : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/invitation-request', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { requestedEmail, message } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!requestedEmail) {
            return res.status(400).json({ message: 'Email обязателен' });
        }

        const trimmedEmail = trimEmail(requestedEmail);

        if (!isValidEmail(trimmedEmail)) {
            return res.status(400).json({ message: 'Неверный формат email' });
        }

        const user = await getUserById(authReq.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (user.role !== 'external') {
            return res.status(403).json({ message: 'Только внешние пользователи могут создавать запросы приглашений' });
        }

        if (await userExists(trimmedEmail)) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        const request = await createInvitationRequest(authReq.user.userId, trimmedEmail, message);

        res.status(201).json({
            message: 'Запрос приглашения создан',
            request
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/invitation-requests', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { status } = req.query;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const user = await getUserById(authReq.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (user.role !== 'internal') {
            return res.status(403).json({ message: 'Только внутренние пользователи могут просматривать запросы приглашений' });
        }

        const requests = await getInvitationRequests(status as string);
        res.json({ requests });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/my-invitation-requests', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const requests = await getInvitationRequestsByRequester(authReq.user.userId);
        res.json({ requests });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/invitation-request/:requestId/process', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { requestId } = req.params;
        const { action, message, rejectionReason } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const user = await getUserById(authReq.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (user.role !== 'internal') {
            return res.status(403).json({ message: 'Только внутренние пользователи могут обрабатывать запросы приглашений' });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Неверное действие. Допустимые значения: approve, reject' });
        }

        const status = action === 'approve' ? 'approved' : 'rejected';

        const updatedRequest = await updateInvitationRequestStatus(
            parseInt(requestId),
            status,
            authReq.user.userId,
            action === 'reject' ? rejectionReason : undefined
        );

        if (action === 'approve') {
            const crypto = await import('crypto');
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const trimmedEmail = trimEmail(updatedRequest.requested_email);
            await createInvitation(authReq.user.userId, trimmedEmail, token, expiresAt);

            const registrationLink = `${process.env.FRONTEND_URL}/auth/register/external?token=${token}&email=${trimmedEmail}`;

            await transporter.sendMail({
                from: `"FixDesk" <${process.env.SMTP_USER}>`,
                to: trimmedEmail,
                subject: 'Приглашение на регистрацию - FixDesk',
                html: `
                    <h2>Приглашение на регистрацию</h2>
                    <p>Ваш запрос на приглашение был одобрен.</p>
                    <p>Для завершения регистрации нажмите на кнопку ниже:</p>
                    <a href="${registrationLink}" style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Завершить регистрацию</a>
                    <p>Или перейдите по ссылке: <a href="${registrationLink}">${registrationLink}</a></p>
                    <p>Приглашение действительно в течение 7 дней.</p>
                `
            });
        }

        res.json({
            message: `Запрос ${action === 'approve' ? 'одобрен' : 'отклонен'}`,
            request: updatedRequest
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/users/:userId', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { userId } = req.params;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const requester = await getUserById(authReq.user.userId);
        if (!requester) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (requester.role !== 'internal') {
            return res.status(403).json({ message: 'Только внутренние пользователи могут удалять пользователей' });
        }

        if (parseInt(userId) === authReq.user.userId) {
            return res.status(400).json({ message: 'Нельзя удалить самого себя' });
        }

        const userToDelete = await getUserById(parseInt(userId));
        if (!userToDelete) {
            return res.status(404).json({ message: 'Пользователь для удаления не найден' });
        }

        const result = await deleteUserSafely(parseInt(userId));

        res.json({
            message: 'Пользователь успешно удален',
            deletedUser: {
                id: userToDelete.id,
                email: userToDelete.email,
                first_name: userToDelete.first_name,
                last_name: userToDelete.last_name
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при удалении пользователя',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/debug/users', async (req, res) => {
    try {

        const result = await query('SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC');

        res.json({
            total_users: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при получении списка пользователей',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/debug/check-email/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const trimmedEmail = trimEmail(email);

        const result = await query('SELECT * FROM users WHERE email = $1', [trimmedEmail]);

        if (result.rows.length === 0) {

            const similarEmails = await query('SELECT email FROM users WHERE email ILIKE $1', [`%${trimmedEmail.split('@')[0]}%`]);

            res.json({
                found: false,
                checked_email: trimmedEmail,
                similar_emails: similarEmails.rows.map(row => row.email)
            });
        } else {
            const user = result.rows[0];

            res.json({
                found: true,
                checked_email: trimmedEmail,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    has_password_hash: !!user.password_hash
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при проверке email',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/notification-settings', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const settings = await getEmailNotificationSettings(authReq.user.userId);

        res.json({
            success: true,
            settings: settings || {
                project_invitations: true,
                bug_assignments: true,
                bug_comments: true,
                comment_replies: true
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка получения настроек уведомлений',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.put('/notification-settings', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { project_invitations, bug_assignments, bug_comments, comment_replies } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const settings = {
            project_invitations: typeof project_invitations === 'boolean' ? project_invitations : true,
            bug_assignments: typeof bug_assignments === 'boolean' ? bug_assignments : true,
            bug_comments: typeof bug_comments === 'boolean' ? bug_comments : true,
            comment_replies: typeof comment_replies === 'boolean' ? comment_replies : true
        };

        const updatedSettings = await updateEmailNotificationSettings(authReq.user.userId, settings);

        res.json({
            success: true,
            message: 'Настройки уведомлений обновлены',
            settings: updatedSettings
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка обновления настроек уведомлений',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/set-password', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { currentPassword, newPassword } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
        }

        const user = await getUserById(authReq.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (user.password_hash) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Требуется текущий пароль' });
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Неверный текущий пароль' });
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, authReq.user.userId]
        );

        res.json({
            success: true,
            message: user.password_hash ? 'Пароль успешно изменен' : 'Пароль успешно установлен'
        });
    } catch (error) {
        console.error('Set password error:', error);
        res.status(500).json({
            message: 'Ошибка установки пароля',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


router.post('/change-email/request', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { newEmail } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!newEmail || !isValidEmail(newEmail)) {
            return res.status(400).json({ message: 'Некорректный email' });
        }

        const trimmedNewEmail = trimEmail(newEmail);

        const emailExists = await userExists(trimmedNewEmail);
        if (emailExists) {
            return res.status(400).json({ message: 'Этот email уже используется' });
        }

        if (trimmedNewEmail.endsWith('@fixdesk.local')) {
            return res.status(400).json({ message: 'Нельзя использовать автоматический email' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const expiresAt = Date.now() + 10 * 60 * 1000;
        emailVerificationCodes.set(`${authReq.user.userId}`, {
            code,
            newEmail: trimmedNewEmail,
            expiresAt
        });

        try {
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: trimmedNewEmail,
                subject: 'Подтверждение изменения email - FixDesk',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4945ff;">Подтверждение изменения email</h2>
                        <p>Вы запросили изменение email в вашем аккаунте FixDesk.</p>
                        <p>Ваш код подтверждения:</p>
                        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                            ${code}
                        </div>
                        <p>Код действителен в течение 10 минут.</p>
                        <p>Если вы не запрашивали изменение email, проигнорируйте это письмо.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            return res.status(500).json({ message: 'Ошибка отправки email' });
        }

        res.json({ success: true, message: 'Код подтверждения отправлен на новый email' });
    } catch (error) {
        console.error('Request email change error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/change-email/verify', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { code } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!code) {
            return res.status(400).json({ message: 'Код подтверждения обязателен' });
        }

        const verificationData = emailVerificationCodes.get(`${authReq.user.userId}`);

        if (!verificationData) {
            return res.status(400).json({ message: 'Код подтверждения не найден или истек' });
        }

        if (Date.now() > verificationData.expiresAt) {
            emailVerificationCodes.delete(`${authReq.user.userId}`);
            return res.status(400).json({ message: 'Код подтверждения истек' });
        }

        if (code !== verificationData.code) {
            return res.status(400).json({ message: 'Неверный код подтверждения' });
        }

        const result = await pool.query(
            'UPDATE users SET email = $1, email_verified = TRUE, updated_at = NOW() WHERE id = $2 RETURNING id, email, first_name, last_name',
            [verificationData.newEmail, authReq.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        emailVerificationCodes.delete(`${authReq.user.userId}`);

        res.json({
            success: true,
            message: 'Email успешно изменен',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Verify email change error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/delete-account', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (authReq.user.isDeleted) {
            return res.status(400).json({ message: 'Аккаунт уже удален' });
        }

        const deletedAt = new Date();
        const deletionScheduledAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 дней

        const result = await pool.query(
            `UPDATE users 
             SET deleted_at = $1, 
                 deletion_scheduled_at = $2, 
                 updated_at = NOW() 
             WHERE id = $3 
             RETURNING id, email, deleted_at, deletion_scheduled_at`,
            [deletedAt, deletionScheduledAt, authReq.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        try {
            const user = await getUserById(authReq.user.userId);
            if (user && user.email && !user.email.includes('@fixdesk.local')) {
                const htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #d32f2f, #c62828); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
                        </div>
                        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
                            <h2 style="color: #d32f2f; margin-top: 0;">Ваш аккаунт удален</h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #333;">Здравствуйте, <strong>${user.first_name}</strong>!</p>
                            <p style="font-size: 16px; line-height: 1.6; color: #333;">Ваш аккаунт в FixDesk был помечен на удаление.</p>
                            <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; font-size: 16px; color: #d32f2f;"><strong>⚠️ У вас есть 30 дней для восстановления аккаунта</strong></p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.6; color: #333;">
                                <strong>Дата окончательного удаления:</strong> ${deletionScheduledAt.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p style="font-size: 16px; line-height: 1.6; color: #333;">
                                Для восстановления просто войдите в систему в течение 30 дней и нажмите кнопку "Восстановить аккаунт".
                            </p>
                            <p style="font-size: 16px; line-height: 1.6; color: #333;">
                                Если вы не восстановите аккаунт до указанной даты, все ваши данные будут безвозвратно удалены.
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                                   style="display: inline-block; background: #d32f2f; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 4px; font-weight: bold;">
                                    Войти в систему
                                </a>
                            </div>
                            <p style="font-size: 14px; color: #999; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">
                                Это автоматическое письмо, пожалуйста, не отвечайте на него.
                            </p>
                        </div>
                    </div>
                `;

                await transporter.sendMail({
                    from: process.env.SMTP_USER,
                    to: user.email,
                    subject: 'Ваш аккаунт FixDesk удален',
                    html: htmlContent,
                });
            }
        } catch (emailError) {
            console.error('Error sending deletion email:', emailError);
        }

        res.json({
            success: true,
            message: 'Аккаунт помечен на удаление. У вас есть 30 дней для восстановления.',
            deletion_scheduled_at: deletionScheduledAt
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/restore-account', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!authReq.user.isDeleted) {
            return res.status(400).json({ message: 'Аккаунт не удален' });
        }

        if (authReq.user.deletionScheduledAt) {
            const scheduledDate = new Date(authReq.user.deletionScheduledAt);
            if (new Date() > scheduledDate) {
                return res.status(400).json({
                    message: 'Срок восстановления истек. Аккаунт будет удален в ближайшее время.'
                });
            }
        }

        const result = await pool.query(
            `UPDATE users 
             SET deleted_at = NULL, 
                 deletion_scheduled_at = NULL, 
                 updated_at = NOW() 
             WHERE id = $1 
             RETURNING id, email, first_name, last_name`,
            [authReq.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        try {
            const user = result.rows[0];
            if (user.email && !user.email.includes('@fixdesk.local')) {
                const htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #4caf50, #388e3c); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
                        </div>
                        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
                            <h2 style="color: #4caf50; margin-top: 0;">✅ Ваш аккаунт восстановлен</h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #333;">Здравствуйте, <strong>${user.first_name}</strong>!</p>
                            <p style="font-size: 16px; line-height: 1.6; color: #333;">Ваш аккаунт в FixDesk был успешно восстановлен.</p>
                            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; font-size: 16px; color: #2e7d32;">Вы можете продолжить работу с системой в обычном режиме.</p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.6; color: #333;">
                                Все ваши проекты, задачи и данные сохранены и доступны.
                            </p>
                            <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; font-size: 14px; color: #856404;">
                                    <strong>⚠️ Важно:</strong> Если это были не вы, немедленно смените пароль и свяжитесь с поддержкой.
                                </p>
                            </div>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                                   style="display: inline-block; background: #4caf50; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 4px; font-weight: bold;">
                                    Перейти в FixDesk
                                </a>
                            </div>
                            <p style="font-size: 14px; color: #999; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">
                                Это автоматическое письмо, пожалуйста, не отвечайте на него.
                            </p>
                        </div>
                    </div>
                `;

                await transporter.sendMail({
                    from: process.env.SMTP_USER,
                    to: user.email,
                    subject: 'Ваш аккаунт FixDesk восстановлен',
                    html: htmlContent,
                });
            }
        } catch (emailError) {
            console.error('Error sending restoration email:', emailError);
        }

        res.json({
            success: true,
            message: 'Аккаунт успешно восстановлен',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Restore account error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;
