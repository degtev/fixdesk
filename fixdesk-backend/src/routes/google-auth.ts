import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import { findSocialAccount, upsertSocialAccount, getSocialAccountsByUserId, deleteSocialAccount } from '../models/socialAccount';
import { getUserByEmail, createUser, getUserById } from '../models/user';
import { authMiddleware, AuthRequest } from '../middleware/auth';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function generateState(): string {
    return crypto.randomBytes(32).toString('hex');
}

function createToken(userId: number, email: string, role: string): string {
    return jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '1d' });
}

router.get('/google', async (req: Request, res: Response) => {
    try {
        const state = generateState();
        const redirectUri = `${process.env.BACKEND_URL}/oauth/google/callback`;
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${process.env.GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=openid%20profile%20email` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=${state}`;

        await axios.post(`${process.env.BACKEND_URL}/oauth/save-state`, {
            state,
            mode: 'login'
        }).catch(() => { });

        res.redirect(googleAuthUrl);
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({ message: 'Ошибка инициализации Google OAuth' });
    }
});


router.get('/google/link', async (req: Request, res: Response) => {
    try {
        const token = req.query.token as string;

        if (!token) {
            return res.status(401).json({ message: 'Нет токена авторизации' });
        }

        let userId: number;
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            userId = decoded.id;
        } catch (error) {
            return res.status(401).json({ message: 'Неверный токен' });
        }

        const state = generateState();
        const stateData = JSON.stringify({
            mode: 'link',
            userId: userId
        });
        const encodedState = Buffer.from(stateData).toString('base64');

        const redirectUri = `${process.env.BACKEND_URL}/oauth/google/callback`;
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${process.env.GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=openid%20profile%20email` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=${encodedState}`;

        res.redirect(googleAuthUrl);
    } catch (error) {
        console.error('Google link error:', error);
        res.status(500).json({ message: 'Ошибка инициализации привязки Google' });
    }
});

router.get('/google/callback', async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
        }

        let stateData: any = { mode: 'login' };
        if (state && typeof state === 'string') {
            try {
                const decoded = Buffer.from(state, 'base64').toString('utf-8');
                stateData = JSON.parse(decoded);
            } catch (e) {

            }
        }

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${process.env.BACKEND_URL}/oauth/google/callback`,
            grant_type: 'authorization_code'
        });

        const { access_token, refresh_token } = tokenResponse.data;

        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { id, email, name, picture } = userInfoResponse.data;

        if (stateData.mode === 'link' && stateData.userId) {
            const existingSocialAccount = await findSocialAccount('google', id);
            if (existingSocialAccount && existingSocialAccount.user_id !== stateData.userId) {
                return res.redirect(`${FRONTEND_URL}/profile?error=already_linked`);
            }

            await upsertSocialAccount({
                user_id: stateData.userId,
                provider: 'google',
                provider_user_id: id,
                provider_email: email,
                access_token,
                refresh_token,
                profile_data: { name, picture }
            });

            return res.redirect(`${FRONTEND_URL}/profile?success=linked`);
        }

        const socialAccount = await findSocialAccount('google', id);

        if (socialAccount) {
            const user = await getUserById(socialAccount.user_id);
            if (!user) {
                return res.redirect(`${FRONTEND_URL}/login?error=user_not_found`);
            }
            await upsertSocialAccount({
                user_id: user.id!,
                provider: 'google',
                provider_user_id: id,
                provider_email: email,
                access_token,
                refresh_token,
                profile_data: { name, picture }
            });

            const token = createToken(user.id!, user.email, user.role);
            return res.redirect(`${FRONTEND_URL}/auth/oauth-success?token=${token}`);
        }

        if (email) {
            const existingUser = await getUserByEmail(email);
            if (existingUser) {
                await upsertSocialAccount({
                    user_id: existingUser.id!,
                    provider: 'google',
                    provider_user_id: id,
                    provider_email: email,
                    access_token,
                    refresh_token,
                    profile_data: { name, picture }
                });

                const token = createToken(existingUser.id!, existingUser.email, existingUser.role);
                return res.redirect(`${FRONTEND_URL}/auth/oauth-success?token=${token}`);
            }
        }

        const [firstName, ...lastNameParts] = (name || 'User').split(' ');
        const lastName = lastNameParts.join(' ') || 'User';

        const newUser = await createUser({
            email,
            first_name: firstName,
            last_name: lastName,
            role: 'external',
            avatar_url: picture,
            email_verified: true,
            user_type: 'external'
        });

        await upsertSocialAccount({
            user_id: newUser.id!,
            provider: 'google',
            provider_user_id: id,
            provider_email: email,
            access_token,
            refresh_token,
            profile_data: { name, picture }
        });

        const token = createToken(newUser.id!, newUser.email, newUser.role);
        return res.redirect(`${FRONTEND_URL}/auth/oauth-success?token=${token}`);

    } catch (error) {
        console.error('Google OAuth callback error:', error);
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
});

router.get('/social-accounts', authMiddleware, async (req: Request, res: Response) => {
    try {
        const authReq = req as any as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const accounts = await getSocialAccountsByUserId(authReq.user.userId);
        res.json({ accounts });
    } catch (error) {
        console.error('Get social accounts error:', error);
        res.status(500).json({ message: 'Ошибка получения социальных аккаунтов' });
    }
});

router.delete('/social-accounts/:provider', authMiddleware, async (req: Request, res: Response) => {
    try {
        const authReq = req as any as AuthRequest;
        const { provider } = req.params;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const user = await getUserById(authReq.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const socialAccounts = await getSocialAccountsByUserId(authReq.user.userId);

        if (!user.password_hash && socialAccounts.length <= 1) {
            return res.status(400).json({
                message: 'Невозможно отвязать последний метод авторизации. Установите пароль перед отвязкой.'
            });
        }

        const deleted = await deleteSocialAccount(authReq.user.userId, provider);

        if (deleted) {
            res.json({ message: 'Социальный аккаунт успешно отвязан' });
        } else {
            res.status(404).json({ message: 'Социальный аккаунт не найден' });
        }
    } catch (error) {
        console.error('Delete social account error:', error);
        res.status(500).json({ message: 'Ошибка отвязки социального аккаунта' });
    }
});

export default router;

