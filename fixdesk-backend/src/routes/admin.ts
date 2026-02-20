import express, { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { adminAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const user = result.rows[0];

        const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id.trim())) || [];
        if (!adminUserIds.includes(user.id)) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        if (!user.password_hash) {
            return res.status(401).json({ message: 'Пароль не установлен для этого пользователя' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
            },
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/me', adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT id, email, first_name, last_name, position FROM users WHERE id = $1',
            [req.user?.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения данных пользователя:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/users', adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const offset = (page - 1) * limit;

    try {
        let query = `
            SELECT id, email, first_name, last_name, position, created_at
            FROM users
            WHERE deleted_at IS NULL
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        let countQuery = 'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL';
        const countParams: any[] = [];
        if (search) {
            countQuery += ' AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)';
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            users: result.rows,
            total,
            page,
            limit,
        });
    } catch (error) {
        console.error('Ошибка получения списка пользователей:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/users', adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    const { email, password, first_name, last_name, position } = req.body;

    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
    }

    try {
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, position, role, user_type, email_verified, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, 'external', 'external', true, NOW(), NOW())
             RETURNING id, email, first_name, last_name, position, created_at`,
            [email, hashedPassword, first_name, last_name, position || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания пользователя:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.put('/users/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    const userId = parseInt(req.params.id);
    const { email, password, first_name, last_name, position } = req.body;

    try {
        const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
            }
        }

        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        if (email) {
            updateFields.push(`email = $${paramIndex++}`);
            updateValues.push(email);
        }
        if (first_name) {
            updateFields.push(`first_name = $${paramIndex++}`);
            updateValues.push(first_name);
        }
        if (last_name) {
            updateFields.push(`last_name = $${paramIndex++}`);
            updateValues.push(last_name);
        }
        if (position !== undefined) {
            updateFields.push(`position = $${paramIndex++}`);
            updateValues.push(position);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push(`password_hash = $${paramIndex++}`);
            updateValues.push(hashedPassword);
        }

        updateFields.push(`updated_at = NOW()`);
        updateValues.push(userId);

        const query = `
            UPDATE users
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, email, first_name, last_name, position, created_at
        `;

        const result = await pool.query(query, updateValues);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления пользователя:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/users/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
    const userId = parseInt(req.params.id);

    try {
        if (userId === req.user?.userId) {
            return res.status(400).json({ message: 'Нельзя удалить самого себя' });
        }

        const result = await pool.query(
            'UPDATE users SET deleted_at = NOW() WHERE id = $1 RETURNING id',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({ message: 'Пользователь удален' });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;

