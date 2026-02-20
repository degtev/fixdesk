import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { findSocialAccount, upsertSocialAccount, getSocialAccountsByUserId, deleteSocialAccount } from '../models/socialAccount';
import { getUserByEmail, createUser, getUserById } from '../models/user';
import { authMiddleware, AuthRequest } from '../middleware/auth';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

const TELEGRAM_BOT_ID = TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.split(':')[0] : '';

function createToken(userId: number, email: string, role: string): string {
    return jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '1d' });
}

function verifyTelegramAuth(data: any): boolean {
    const { hash, ...authData } = data;
    
    if (!hash) return false;

    const checkString = Object.keys(authData)
        .sort()
        .map(key => `${key}=${authData[key]}`)
        .join('\n');

    const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();

    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    return hmac === hash;
}

router.get('/telegram/bot-id', (req: Request, res: Response) => {
    res.json({ botId: TELEGRAM_BOT_ID });
});


router.post('/telegram/callback', async (req: Request, res: Response) => {
    try {
        const telegramData = req.body;

        if (!verifyTelegramAuth(telegramData)) {
            return res.status(400).json({ message: 'Неверные данные авторизации Telegram' });
        }

        const id = telegramData.id.toString();
        const firstName = telegramData.first_name || 'Telegram';
        const lastName = telegramData.last_name || 'User';
        const username = telegramData.username;
        const photoUrl = telegramData.photo_url;

        const socialAccount = await findSocialAccount('telegram', id);

        if (socialAccount) {
            const user = await getUserById(socialAccount.user_id);
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }

            await upsertSocialAccount({
                user_id: user.id!,
                provider: 'telegram',
                provider_user_id: id,
                provider_username: username,
                profile_data: { firstName, lastName, username, photoUrl }
            });

            const token = createToken(user.id!, user.email, user.role);
            return res.json({ success: true, token });
        }

        const autoEmail = `telegram_${id}@fixdesk.local`;
        let existingUser = await getUserByEmail(autoEmail);

        if (existingUser) {
            await upsertSocialAccount({
                user_id: existingUser.id!,
                provider: 'telegram',
                provider_user_id: id,
                provider_username: username,
                profile_data: { firstName, lastName, username, photoUrl }
            });

            const token = createToken(existingUser.id!, existingUser.email, existingUser.role);
            return res.json({ success: true, token });
        } else {
            const newUser = await createUser({
                email: autoEmail,
                first_name: firstName,
                last_name: lastName,
                role: 'external',
                avatar_url: photoUrl,
                email_verified: false,
                user_type: 'external'
            });

            await upsertSocialAccount({
                user_id: newUser.id!,
                provider: 'telegram',
                provider_user_id: id,
                provider_username: username,
                profile_data: { firstName, lastName, username, photoUrl }
            });

            const token = createToken(newUser.id!, newUser.email, newUser.role);
            return res.json({ success: true, token });
        }

    } catch (error) {
        console.error('Telegram auth callback error:', error);
        return res.status(500).json({ message: 'Ошибка авторизации через Telegram' });
    }
});


router.post('/telegram/link', async (req: Request, res: Response) => {
    try {
        const { telegramData, token } = req.body;

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

        if (!verifyTelegramAuth(telegramData)) {
            return res.status(400).json({ message: 'Неверные данные авторизации Telegram' });
        }

        const id = telegramData.id.toString();
        const firstName = telegramData.first_name || 'Telegram';
        const lastName = telegramData.last_name || 'User';
        const username = telegramData.username;
        const photoUrl = telegramData.photo_url;

        const existingSocialAccount = await findSocialAccount('telegram', id);
        if (existingSocialAccount && existingSocialAccount.user_id !== userId) {
            return res.status(400).json({ message: 'Этот аккаунт Telegram уже привязан к другому пользователю' });
        }

        await upsertSocialAccount({
            user_id: userId,
            provider: 'telegram',
            provider_user_id: id,
            provider_username: username,
            profile_data: { firstName, lastName, username, photoUrl }
        });

        return res.json({ success: true, message: 'Telegram аккаунт успешно привязан' });

    } catch (error) {
        console.error('Telegram link error:', error);
        return res.status(500).json({ message: 'Ошибка привязки Telegram аккаунта' });
    }
});

export default router;

