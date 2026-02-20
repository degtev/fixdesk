import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        userType: string;
        isDeleted?: boolean;
        deletionScheduledAt?: string;
    };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Нет токена авторизации' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Токен отсутствует' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            id: number;
            email: string;
            role: string;
            iat: number;
            exp: number;
        };

        const userResult = await pool.query(
            'SELECT deleted_at, deletion_scheduled_at FROM users WHERE id = $1',
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }

        const user = userResult.rows[0];

        req.user = {
            userId: decoded.id,
            userType: decoded.role,
            isDeleted: !!user.deleted_at,
            deletionScheduledAt: user.deletion_scheduled_at
        };

        next();
    } catch {
        res.status(401).json({ message: 'Неверный токен' });
    }
}

export async function adminAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Нет токена авторизации' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Токен отсутствует' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            id: number;
            email: string;
            role: string;
        };

        const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id.trim())) || [];

        if (!adminUserIds.includes(decoded.id)) {
            return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
        }

        req.user = {
            userId: decoded.id,
            userType: decoded.role,
        };

        next();
    } catch {
        res.status(401).json({ message: 'Неверный токен' });
    }
}
