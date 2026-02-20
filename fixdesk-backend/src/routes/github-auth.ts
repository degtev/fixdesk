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


router.get('/github', async (req: Request, res: Response) => {
    try {
        const state = generateState();
        const redirectUri = `${process.env.BACKEND_URL}/oauth/github/callback`;
        const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${process.env.GITHUB_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=user:email` +
            `&state=${state}`;

        res.redirect(githubAuthUrl);
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        res.status(500).json({ message: 'Ошибка инициализации GitHub OAuth' });
    }
});


router.get('/github/link', async (req: Request, res: Response) => {
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

        const redirectUri = `${process.env.BACKEND_URL}/oauth/github/callback`;
        const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${process.env.GITHUB_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=user:email` +
            `&state=${encodedState}`;

        res.redirect(githubAuthUrl);
    } catch (error) {
        console.error('GitHub link error:', error);
        res.status(500).json({ message: 'Ошибка инициализации привязки GitHub' });
    }
});

router.get('/github/callback', async (req: Request, res: Response) => {
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
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code as string
            },
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        const { access_token } = tokenResponse.data;


        const userInfoResponse = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json'
            }
        });

        const githubUser = userInfoResponse.data;
        const id = githubUser.id.toString();
        let email = githubUser.email;

        if (!email) {
            try {
                const emailsResponse = await axios.get('https://api.github.com/user/emails', {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        Accept: 'application/json'
                    }
                });
                const primaryEmail = emailsResponse.data.find((e: any) => e.primary);
                email = primaryEmail ? primaryEmail.email : emailsResponse.data[0]?.email;
            } catch (emailError) {
                console.error('Error fetching GitHub emails:', emailError);
            }
        }

        const name = githubUser.name || githubUser.login;
        const [firstName, ...lastNameParts] = (name || 'GitHub User').split(' ');
        const lastName = lastNameParts.join(' ') || 'User';
        const picture = githubUser.avatar_url;


        if (stateData.mode === 'link' && stateData.userId) {
            const existingSocialAccount = await findSocialAccount('github', id);
            if (existingSocialAccount && existingSocialAccount.user_id !== stateData.userId) {
                return res.redirect(`${FRONTEND_URL}/profile?error=already_linked`);
            }

            await upsertSocialAccount({
                user_id: stateData.userId,
                provider: 'github',
                provider_user_id: id,
                provider_email: email,
                access_token,
                profile_data: { name, login: githubUser.login, picture }
            });

            return res.redirect(`${FRONTEND_URL}/profile?success=linked`);
        }

        const socialAccount = await findSocialAccount('github', id);

        if (socialAccount) {

            const user = await getUserById(socialAccount.user_id);
            if (!user) {
                return res.redirect(`${FRONTEND_URL}/login?error=user_not_found`);
            }

            await upsertSocialAccount({
                user_id: user.id!,
                provider: 'github',
                provider_user_id: id,
                provider_email: email,
                access_token,
                profile_data: { name, login: githubUser.login, picture }
            });

            const token = createToken(user.id!, user.email, user.role);
            return res.redirect(`${FRONTEND_URL}/auth/oauth-success?token=${token}`);
        }

        if (email) {
            const existingUser = await getUserByEmail(email);
            if (existingUser) {
                await upsertSocialAccount({
                    user_id: existingUser.id!,
                    provider: 'github',
                    provider_user_id: id,
                    provider_email: email,
                    access_token,
                    profile_data: { name, login: githubUser.login, picture }
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
            provider: 'github',
            provider_user_id: id,
            provider_email: email,
            access_token,
            profile_data: { name, login: githubUser.login, picture }
        });

        const token = createToken(newUser.id!, newUser.email, newUser.role);
        return res.redirect(`${FRONTEND_URL}/auth/oauth-success?token=${token}`);

    } catch (error) {
        console.error('GitHub OAuth callback error:', error);
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
});

export default router;

