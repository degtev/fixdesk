import express, { Request, Response } from 'express';
import pool from '../db';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';
import { sendEmail, workspaceInvitationTemplate } from '../emailTemplates';
import { Workspace, WorkspaceInvitation, WorkspaceMember, WorkspaceWithStats, WorkspaceMemberWithUser } from '../models/workspace';

const router = express.Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const query = `
            SELECT 
                w.*,
                CASE 
                    WHEN w.owner_id = $1 THEN (SELECT COUNT(*) FROM projects WHERE workspace_id = w.id)
                    ELSE (
                        SELECT COUNT(DISTINCT p.id) FROM projects p 
                        LEFT JOIN project_members pm ON p.id = pm.project_id 
                        WHERE p.workspace_id = w.id 
                        AND (p.created_by = $1 OR pm.user_id = $1)
                    )
                END as project_count,
                (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) + 1 as member_count,
                CASE WHEN w.owner_id = $1 THEN true ELSE false END as is_owner
            FROM workspaces w
            WHERE w.owner_id = $1
            OR w.id IN (SELECT workspace_id FROM workspace_members WHERE user_id = $1)
            ORDER BY w.created_at DESC
        `;

        const result = await pool.query<WorkspaceWithStats>(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
});

router.get('/:uuid', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const workspaceUuid = req.params.uuid;

        const accessCheck = await pool.query(
            `SELECT * FROM workspaces 
             WHERE uuid = $1 AND (owner_id = $2 OR id IN 
                (SELECT workspace_id FROM workspace_members WHERE user_id = $2))`,
            [workspaceUuid, userId]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const query = `
            SELECT 
                w.*,
                CASE 
                    WHEN w.owner_id = $1 THEN (SELECT COUNT(*) FROM projects WHERE workspace_id = w.id)
                    ELSE (
                        SELECT COUNT(DISTINCT p.id) FROM projects p 
                        LEFT JOIN project_members pm ON p.id = pm.project_id 
                        WHERE p.workspace_id = w.id 
                        AND (p.created_by = $1 OR pm.user_id = $1)
                    )
                END as project_count,
                (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) + 1 as member_count,
                CASE WHEN w.owner_id = $1 THEN true ELSE false END as is_owner
            FROM workspaces w
            WHERE w.uuid = $2
        `;

        const result = await pool.query<WorkspaceWithStats>(query, [userId, workspaceUuid]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching workspace:', error);
        res.status(500).json({ error: 'Failed to fetch workspace' });
    }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { name, description } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Workspace name is required' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const workspaceResult = await client.query<Workspace>(
                `INSERT INTO workspaces (name, description, owner_id) 
                 VALUES ($1, $2, $3) 
                 RETURNING *`,
                [name.trim(), description || null, userId]
            );

            const workspace = workspaceResult.rows[0];

            const projectsWithoutWorkspace = await client.query(
                `SELECT COUNT(*) as count FROM projects WHERE created_by = $1 AND workspace_id IS NULL`,
                [userId]
            );

            const userWorkspacesCount = await client.query(
                `SELECT COUNT(*) as count FROM workspaces WHERE owner_id = $1`,
                [userId]
            );

            if (userWorkspacesCount.rows[0].count === 1 && parseInt(projectsWithoutWorkspace.rows[0].count) > 0) {
                await client.query(
                    `UPDATE projects SET workspace_id = $1 WHERE created_by = $2 AND workspace_id IS NULL`,
                    [workspace.id, userId]
                );
            }

            await client.query('COMMIT');

            const resultQuery = `
                SELECT 
                    w.*,
                    (SELECT COUNT(*) FROM projects WHERE workspace_id = w.id) as project_count,
                    1 as member_count,
                    true as is_owner
                FROM workspaces w
                WHERE w.id = $1
            `;

            const finalResult = await client.query<WorkspaceWithStats>(resultQuery, [workspace.id]);
            res.status(201).json(finalResult.rows[0]);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({ error: 'Failed to create workspace' });
    }
});

router.put('/:uuid', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const workspaceUuid = req.params.uuid;
        const { name, description } = req.body;

        const ownerCheck = await pool.query(
            'SELECT * FROM workspaces WHERE uuid = $1 AND owner_id = $2',
            [workspaceUuid, userId]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Only workspace owner can update it' });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Workspace name is required' });
        }

        const result = await pool.query<Workspace>(
            `UPDATE workspaces 
             SET name = $1, description = $2 
             WHERE uuid = $3 
             RETURNING *`,
            [name.trim(), description || null, workspaceUuid]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating workspace:', error);
        res.status(500).json({ error: 'Failed to update workspace' });
    }
});

router.delete('/:uuid', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const workspaceUuid = req.params.uuid;

        const ownerCheck = await pool.query(
            'SELECT * FROM workspaces WHERE uuid = $1 AND owner_id = $2',
            [workspaceUuid, userId]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Only workspace owner can delete it' });
        }

        await pool.query('DELETE FROM workspaces WHERE uuid = $1', [workspaceUuid]);
        res.json({ message: 'Workspace deleted successfully' });
    } catch (error) {
        console.error('Error deleting workspace:', error);
        res.status(500).json({ error: 'Failed to delete workspace' });
    }
});

router.get('/:uuid/members', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const workspaceUuid = req.params.uuid;

        const accessCheck = await pool.query(
            `SELECT * FROM workspaces 
             WHERE uuid = $1 AND (owner_id = $2 OR id IN 
                (SELECT workspace_id FROM workspace_members WHERE user_id = $2))`,
            [workspaceUuid, userId]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const workspace = accessCheck.rows[0];

        const ownerQuery = await pool.query(
            `SELECT 
                w.owner_id as user_id,
                u.email,
                u.first_name,
                u.last_name,
                COALESCE(u.position, 'Владелец') as position,
                w.created_at as joined_at,
                true as is_owner
             FROM workspaces w
             JOIN users u ON w.owner_id = u.id
             WHERE w.id = $1`,
            [workspace.id]
        );
        const membersQuery = await pool.query<WorkspaceMemberWithUser & { is_owner: boolean }>(
            `SELECT 
                wm.*,
                u.email,
                u.first_name,
                u.last_name,
                u.position,
                false as is_owner
             FROM workspace_members wm
             JOIN users u ON wm.user_id = u.id
             WHERE wm.workspace_id = $1
             ORDER BY wm.joined_at ASC`,
            [workspace.id]
        );

        const allMembers = [...ownerQuery.rows, ...membersQuery.rows];
        res.json(allMembers);
    } catch (error) {
        console.error('Error fetching workspace members:', error);
        res.status(500).json({ error: 'Failed to fetch workspace members' });
    }
});

router.post('/:uuid/invite', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const workspaceUuid = req.params.uuid;
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const accessCheck = await pool.query(
            `SELECT * FROM workspaces 
             WHERE uuid = $1 AND (owner_id = $2 OR id IN 
                (SELECT workspace_id FROM workspace_members WHERE user_id = $2))`,
            [workspaceUuid, userId]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const workspace = accessCheck.rows[0];

        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User with this email not found' });
        }

        const invitedUser = userCheck.rows[0];

        if (workspace.owner_id === invitedUser.id) {
            return res.status(400).json({ error: 'User is already the owner of this workspace' });
        }

        const memberCheck = await pool.query(
            'SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [workspace.id, invitedUser.id]
        );

        if (memberCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User is already a member of this workspace' });
        }

        const existingInvitation = await pool.query(
            `SELECT * FROM workspace_invitations 
             WHERE workspace_id = $1 AND email = $2 AND status = 'pending' AND expires_at > NOW()`,
            [workspace.id, email.toLowerCase().trim()]
        );

        if (existingInvitation.rows.length > 0) {
            return res.status(400).json({ error: 'Invitation already sent to this email' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitationResult = await pool.query<WorkspaceInvitation>(
            `INSERT INTO workspace_invitations (workspace_id, email, token, invited_by, expires_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [workspace.id, email.toLowerCase().trim(), token, userId, expiresAt]
        );

        const invitation = invitationResult.rows[0];

        const inviterInfo = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [userId]);
        const inviterName = inviterInfo.rows[0]
            ? `${inviterInfo.rows[0].first_name || ''} ${inviterInfo.rows[0].last_name || ''}`.trim() || 'Пользователь'
            : 'Пользователь';

        const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/workspace-invite/${token}`;
        const emailContent = workspaceInvitationTemplate(workspace.name, inviterName, invitationLink);

        try {
            await sendEmail(email, 'Приглашение в воркспейс', emailContent);
            console.log('Workspace invitation email sent successfully to:', email);
        } catch (emailError) {
            console.error('Error sending workspace invitation email:', emailError);
        }

        res.status(201).json({ message: 'Invitation sent successfully', invitation });
    } catch (error) {
        console.error('Error inviting user to workspace:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

router.post('/accept-invite/:token', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const token = req.params.token;
        const { position, first_name, last_name } = req.body;

        const invitationResult = await pool.query<WorkspaceInvitation>(
            `SELECT * FROM workspace_invitations 
             WHERE token = $1 AND status = 'pending'`,
            [token]
        );

        if (invitationResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invitation not found or already used' });
        }

        const invitation = invitationResult.rows[0];

        if (new Date(invitation.expires_at) < new Date()) {
            await pool.query(
                `UPDATE workspace_invitations SET status = 'expired' WHERE id = $1`,
                [invitation.id]
            );
            return res.status(400).json({ error: 'Invitation has expired' });
        }

        const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (userResult.rows[0].email.toLowerCase() !== invitation.email.toLowerCase()) {
            return res.status(403).json({ error: 'This invitation is for a different email' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query<WorkspaceMember>(
                `INSERT INTO workspace_members (workspace_id, user_id, position, first_name, last_name)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (workspace_id, user_id) DO NOTHING`,
                [invitation.workspace_id, userId, position || null, first_name || null, last_name || null]
            );

            await client.query(
                `UPDATE workspace_invitations SET status = 'accepted' WHERE id = $1`,
                [invitation.id]
            );

            await client.query('COMMIT');

            const workspaceResult = await pool.query(
                'SELECT uuid FROM workspaces WHERE id = $1',
                [invitation.workspace_id]
            );
            const workspaceUuid = workspaceResult.rows[0]?.uuid;

            res.json({
                message: 'Successfully joined workspace',
                workspace_id: invitation.workspace_id,
                workspace_uuid: workspaceUuid
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error accepting workspace invitation:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
});

router.get('/invitation-info/:token', async (req: Request, res: Response) => {
    try {
        const token = req.params.token;

        const result = await pool.query(
            `SELECT 
                wi.id,
                wi.workspace_id,
                wi.email,
                wi.status,
                wi.expires_at,
                w.name as workspace_name,
                w.description as workspace_description,
                u.first_name as inviter_first_name,
                u.last_name as inviter_last_name
             FROM workspace_invitations wi
             JOIN workspaces w ON wi.workspace_id = w.id
             JOIN users u ON wi.invited_by = u.id
             WHERE wi.token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        const invitation = result.rows[0];

        if (new Date(invitation.expires_at) < new Date() && invitation.status === 'pending') {
            await pool.query(
                `UPDATE workspace_invitations SET status = 'expired' WHERE token = $1`,
                [token]
            );
            invitation.status = 'expired';
        }

        res.json(invitation);
    } catch (error) {
        console.error('Error fetching invitation info:', error);
        res.status(500).json({ error: 'Failed to fetch invitation info' });
    }
});

router.delete('/:uuid/members/:userId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.userId;
        const workspaceUuid = req.params.uuid;
        const memberUserId = req.params.userId;

        const ownerCheck = await pool.query(
            'SELECT * FROM workspaces WHERE uuid = $1 AND owner_id = $2',
            [workspaceUuid, currentUserId]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Only workspace owner can remove members' });
        }

        const workspace = ownerCheck.rows[0];

        const result = await pool.query(
            'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 RETURNING *',
            [workspace.id, memberUserId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing workspace member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

router.post('/:uuid/leave', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const workspaceUuid = req.params.uuid;

        const ownerCheck = await pool.query(
            'SELECT * FROM workspaces WHERE uuid = $1 AND owner_id = $2',
            [workspaceUuid, userId]
        );

        if (ownerCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Owner cannot leave workspace. Delete it instead.' });
        }

        const workspaceCheck = await pool.query(
            'SELECT * FROM workspaces WHERE uuid = $1',
            [workspaceUuid]
        );

        if (workspaceCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const workspace = workspaceCheck.rows[0];

        const result = await pool.query(
            'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 RETURNING *',
            [workspace.id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'You are not a member of this workspace' });
        }

        res.json({ message: 'Successfully left workspace' });
    } catch (error) {
        console.error('Error leaving workspace:', error);
        res.status(500).json({ error: 'Failed to leave workspace' });
    }
});

router.get('/:uuid/projects', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const workspaceUuid = req.params.uuid;

        const accessCheck = await pool.query(
            `SELECT * FROM workspaces 
             WHERE uuid = $1 AND (owner_id = $2 OR id IN 
                (SELECT workspace_id FROM workspace_members WHERE user_id = $2))`,
            [workspaceUuid, userId]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const workspace = accessCheck.rows[0];
        const isOwner = workspace.owner_id === userId;

        let projectsQuery;
        if (isOwner) {
            projectsQuery = await pool.query(
                `SELECT p.* FROM projects p 
                 WHERE p.workspace_id = $1 
                 ORDER BY p.created_at DESC`,
                [workspace.id]
            );
        } else {
            projectsQuery = await pool.query(
                `SELECT DISTINCT p.* FROM projects p 
                 LEFT JOIN project_members pm ON p.id = pm.project_id 
                 WHERE p.workspace_id = $1 
                 AND (p.created_by = $2 OR pm.user_id = $2)
                 ORDER BY p.created_at DESC`,
                [workspace.id, userId]
            );
        }

        res.json(projectsQuery.rows);
    } catch (error) {
        console.error('Error fetching workspace projects:', error);
        res.status(500).json({ error: 'Failed to fetch workspace projects' });
    }
});

export default router;

