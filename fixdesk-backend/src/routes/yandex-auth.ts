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

router.get('/yandex', async (req: Request, res: Response) => {
    try {
        const state = generateState();
        const redirectUri = `${process.env.BACKEND_URL}/oauth/yandex/callback`;
        const yandexAuthUrl = `https://oauth.yandex.ru/authorize?` +
            `response_type=code` +
            `&client_id=${process.env.YANDEX_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${state}`;

        res.redirect(yandexAuthUrl);
    } catch (error) {
        console.error('Yandex OAuth error:', error);
        res.status(500).json({ message: 'Ошибка инициализации Yandex OAuth' });
    }
});


router.get('/yandex/link', async (req: Request, res: Response) => {
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

        const redirectUri = `${process.env.BACKEND_URL}/oauth/yandex/callback`;
        const yandexAuthUrl = `https://oauth.yandex.ru/authorize?` +
            `response_type=code` +
            `&client_id=${process.env.YANDEX_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${encodedState}`;

        res.redirect(yandexAuthUrl);
    } catch (error) {
        console.error('Yandex link error:', error);
        res.status(500).json({ message: 'Ошибка инициализации привязки Yandex' });
    }
});

router.get('/yandex/callback', async (req: Request, res: Response) => {
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


        const tokenResponse = await axios.post(
            'https://oauth.yandex.ru/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code as string,
                client_id: process.env.YANDEX_CLIENT_ID!,
                client_secret: process.env.YANDEX_CLIENT_SECRET!
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token } = tokenResponse.data;

        const userInfoResponse = await axios.get('https://login.yandex.ru/info', {
            headers: { Authorization: `OAuth ${access_token}` }
        });

        const yandexUser = userInfoResponse.data;
        const id = yandexUser.id;
        const email = yandexUser.default_email || yandexUser.emails?.[0];
        const firstName = yandexUser.first_name || 'Yandex';
        const lastName = yandexUser.last_name || 'User';
        const picture = yandexUser.default_avatar_id
            ? `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`
            : undefined;

        if (stateData.mode === 'link' && stateData.userId) {
            const existingSocialAccount = await findSocialAccount('yandex', id);
            if (existingSocialAccount && existingSocialAccount.user_id !== stateData.userId) {
                return res.redirect(`${FRONTEND_URL}/profile?error=already_linked`);
            }

            await upsertSocialAccount({
                user_id: stateData.userId,
                provider: 'yandex',
                provider_user_id: id,
                provider_email: email,
                access_token,
                profile_data: { firstName, lastName, picture }
            });

            return res.redirect(`${FRONTEND_URL}/profile?success=linked`);
        }

        const socialAccount = await findSocialAccount('yandex', id);

        if (socialAccount) {
            const user = await getUserById(socialAccount.user_id);
            if (!user) {
                return res.redirect(`${FRONTEND_URL}/login?error=user_not_found`);
            }

            await upsertSocialAccount({
                user_id: user.id!,
                provider: 'yandex',
                provider_user_id: id,
                provider_email: email,
                access_token,
                profile_data: { firstName, lastName, picture }
            });

            const token = createToken(user.id!, user.email, user.role);
            return res.redirect(`${FRONTEND_URL}/auth/oauth-success?token=${token}`);
        }

        if (email) {
            const existingUser = await getUserByEmail(email);
            if (existingUser) {
                await upsertSocialAccount({
                    user_id: existingUser.id!,
                    provider: 'yandex',
                    provider_user_id: id,
                    provider_email: email,
                    access_token,
                    profile_data: { firstName, lastName, picture }
                });

                const token = createToken(existingUser.id!, existingUser.email, existingUser.role);
                return res.redirect(`${FRONTEND_URL}/auth/oauth-success?token=${token}`);
            }
        }

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
            provider: 'yandex',
            provider_user_id: id,
            provider_email: email,
            access_token,
            profile_data: { firstName, lastName, picture }
        });

        const token = createToken(newUser.id!, newUser.email, newUser.role);
        return res.redirect(`${FRONTEND_URL}/auth/oauth-success?token=${token}`);

    } catch (error) {
        console.error('Yandex OAuth callback error:', error);
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
});

export default router;

