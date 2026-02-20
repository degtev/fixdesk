import express from 'express';
import { authMiddleware } from '../middleware/auth';
import pool from '../db';
import { notifyProjectUpdate } from '../index';
import { getProjectByUuid } from '../models/project';

const router = express.Router();

const markInactiveUsersOffline = async (projectId: string) => {
    try {
        const INACTIVITY_TIMEOUT_MINUTES = 2;
        const inactiveTimeAgo = new Date(Date.now() - INACTIVITY_TIMEOUT_MINUTES * 60 * 1000).toISOString();
        
        const inactiveUsers = await pool.query(
            `SELECT user_id FROM user_activities 
             WHERE project_id = $1 
             AND is_online = true 
             AND last_seen < $2`,
            [projectId, inactiveTimeAgo]
        );

        if (inactiveUsers.rows.length > 0) {
            await pool.query(
                `UPDATE user_activities 
                 SET is_online = false 
                 WHERE project_id = $1 
                 AND user_id = ANY($2)`,
                [projectId, inactiveUsers.rows.map(u => u.user_id)]
            );

            inactiveUsers.rows.forEach(async (user) => {
                const userInfo = await pool.query(
                    'SELECT first_name, last_name FROM users WHERE id = $1',
                    [user.user_id]
                );

                if (userInfo.rows.length > 0) {
                    const userData = userInfo.rows[0];
                    const statusData = {
                        type: 'user_online_status',
                        user_id: user.user_id,
                        is_online: false,
                        last_seen: inactiveTimeAgo
                    };
                    notifyProjectUpdate(projectId, statusData);
                }
            });
        }
    } catch (error) {
        console.error('Error marking users offline:', error);
    }
};

router.post('/projects/:projectUuid/activity', authMiddleware, async (req, res) => {
    try {
        const { projectUuid } = req.params;
        const { action, timestamp } = req.body;
        const userId = (req as any).user.userId;

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const memberCheck = await pool.query(
            'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2',
            [project.id!, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_activities'
            );
        `);

        if (!tableExists.rows[0].exists) {
            return res.json({ message: 'Активность зафиксирована' });
        }

        const userInfo = await pool.query(
            'SELECT first_name, last_name FROM users WHERE id = $1',
            [userId]
        );

        if (userInfo.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const user = userInfo.rows[0];

        await pool.query(
            `INSERT INTO user_activities (user_id, project_id, action, timestamp, is_online, last_seen)
             VALUES ($1, $2, $3, $4, ${req.body.is_offline ? 'false' : 'true'}, $4)
             ON CONFLICT (user_id, project_id)
             DO UPDATE SET 
                action = $3,
                timestamp = $4,
                is_online = ${req.body.is_offline ? 'false' : 'true'},
                last_seen = $4`,
            [userId, project.id!, action, timestamp]
        );

        const activityData = {
            type: 'user_activity',
            activity: {
                user_id: userId,
                first_name: user.first_name,
                last_name: user.last_name,
                action,
                timestamp,
                is_online: !req.body.is_offline,
                last_seen: timestamp
            }
        };

        notifyProjectUpdate(project.id!.toString(), activityData);

        res.json({ message: 'Активность зафиксирована' });
    } catch (error) {
        res.json({ message: 'Активность зафиксирована' });
    }
});

router.get('/projects/:projectUuid/activity', authMiddleware, async (req, res) => {
    try {
        const { projectUuid } = req.params;
        const userId = (req as any).user.userId;

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const memberCheck = await pool.query(
            'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2',
            [project.id!, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_activities'
            );
        `);

        if (!tableExists.rows[0].exists) {
            return res.json([]);
        }

        const activities = await pool.query(
            `SELECT 
                ua.user_id,
                u.first_name,
                u.last_name,
                ua.action,
                ua.timestamp,
                ua.is_online,
                ua.last_seen
             FROM user_activities ua
             JOIN users u ON ua.user_id = u.id
             WHERE ua.project_id = $1
             ORDER BY ua.timestamp DESC
             LIMIT 50`,
            [project.id!]
        );

        await markInactiveUsersOffline(project.id!.toString());

        res.json(activities.rows);
    } catch (error) {
        res.json([]);
    }
});

export default router; 