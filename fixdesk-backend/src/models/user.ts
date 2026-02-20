import pool from '../db';

export interface User {
    id?: number;
    email: string;
    password_hash?: string;
    first_name: string;
    last_name: string;
    role: 'internal' | 'external';
    position?: string;
    avatar_url?: string;
    email_verified?: boolean;
    user_type?: string;
    invited_by?: number;
}

export interface EmailNotificationSettings {
    id?: number;
    user_id: number;
    project_invitations: boolean;
    bug_assignments: boolean;
    bug_comments: boolean;
    comment_replies: boolean;
    bug_verification: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export async function createUsersTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      position VARCHAR(255),
      avatar_url TEXT,
      email_verified BOOLEAN DEFAULT FALSE,
      user_type VARCHAR(50) DEFAULT 'internal',
      invited_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    )
  `);

    try {
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE
        `);
    } catch (error) {
        console.log('Поле email_verified уже существует или не может быть добавлено');
    }

    try {
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'internal'
        `);
    } catch (error) {
        console.log('Поле user_type уже существует или не может быть добавлено');
    }

    try {
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id)
        `);
    } catch (error) {
        console.log('Поле invited_by уже существует или не может быть добавлено');
    }

    await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      verification_code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS invitations (
      id SERIAL PRIMARY KEY,
      inviter_id INTEGER NOT NULL,
      invitee_email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      registered_at TIMESTAMP
    )
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS invitation_requests (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER NOT NULL,
      requested_email VARCHAR(255) NOT NULL,
      message TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      processed_at TIMESTAMP,
      processed_by INTEGER,
      rejection_reason TEXT
    )
  `);

    await checkAndFixInvitationsTable();

    try {
        await pool.query(`
            ALTER TABLE invitation_requests 
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT
        `);
    } catch (error) {
        console.log('Поле rejection_reason уже существует или не может быть добавлено');
    }

    try {
        await pool.query(`
            ALTER TABLE invitations 
            ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP
        `);
    } catch (error) {
        console.log('Поле registered_at уже существует или не может быть добавлено');
    }

    await forceAddRejectionReasonColumn();
    await forceAddRegisteredAtColumn();

    await fixForeignKeyConstraints();

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('Password resets table checked/created');
    } catch (error) {
        console.error('Error creating password_resets table:', error);
    }

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS email_notification_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                project_invitations BOOLEAN DEFAULT TRUE,
                bug_assignments BOOLEAN DEFAULT TRUE,
                bug_comments BOOLEAN DEFAULT TRUE,
                comment_replies BOOLEAN DEFAULT TRUE,
                bug_verification BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id)
            )
        `);
        console.log('Email notification settings table created');
    } catch (error) {
        console.error('Error creating email_notification_settings table:', error);
    }
}

export async function createUser(user: User): Promise<User> {
    const { email, password_hash, first_name, last_name, role, position, avatar_url, email_verified, user_type } = user;
    const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, position, avatar_url, email_verified, user_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [email, password_hash || null, first_name, last_name, role, position || null, avatar_url || null, email_verified || false, user_type || 'external']
    );
    return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const trimmedEmail = email.trim().toLowerCase();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [trimmedEmail]);
    return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
}

export async function createInvitation(inviterId: number, inviteeEmail: string, token: string, expiresAt: Date) {
    const result = await pool.query(
        `INSERT INTO invitations (inviter_id, invitee_email, token, expires_at) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [inviterId, inviteeEmail, token, expiresAt]
    );
    return result.rows[0];
}

export async function updateInvitationRegistrationTime(invitationId: number) {
    try {
        const result = await pool.query(
            `UPDATE invitations 
             SET registered_at = NOW() 
             WHERE id = $1 
             RETURNING *`,
            [invitationId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error updating invitation registration time:', error);
        throw new Error(`Failed to update invitation registration time: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getInvitationByToken(token: string) {
    try {
        const result = await pool.query(
            'SELECT * FROM invitations WHERE token = $1 AND status = $2 AND expires_at > NOW()',
            [token, 'pending']
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error getting invitation by token:', error);
        throw new Error(`Failed to get invitation by token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function updateInvitationStatus(token: string, status: string) {
    const validStatuses = ['pending', 'completed', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const invitation = await pool.query(
        'SELECT * FROM invitations WHERE token = $1',
        [token]
    );

    if (invitation.rows.length === 0) {
        throw new Error(`Invitation with token ${token} not found`);
    }

    try {
        const result = await pool.query(
            `UPDATE invitations 
             SET status = $1::VARCHAR(20), 
                 completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE NULL END 
             WHERE token = $2 
             RETURNING *`,
            [status, token]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Database error in updateInvitationStatus:', error);
        throw new Error(`Failed to update invitation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getInvitationsByInviter(inviterId: number) {
    const result = await pool.query(
        `SELECT i.*, u.first_name as inviter_first_name, u.last_name as inviter_last_name 
         FROM invitations i 
         LEFT JOIN users u ON i.inviter_id = u.id 
         WHERE i.inviter_id = $1 
         ORDER BY i.created_at DESC`,
        [inviterId]
    );
    return result.rows;
}

export async function getInvitedUsers(inviterId: number) {
    const result = await pool.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.position, u.created_at,
                i.created_at as invited_at, i.completed_at
         FROM users u 
         LEFT JOIN invitations i ON u.email = i.invitee_email 
         WHERE u.invited_by = $1 
         ORDER BY u.created_at DESC`,
        [inviterId]
    );
    return result.rows;
}

export async function createInvitationRequest(requesterId: number, requestedEmail: string, message?: string) {
    const result = await pool.query(
        `INSERT INTO invitation_requests (requester_id, requested_email, message) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [requesterId, requestedEmail, message || null]
    );
    return result.rows[0];
}

export async function getInvitationRequests(status?: string) {
    let query = `
        SELECT ir.*, 
               r.first_name as requester_first_name, 
               r.last_name as requester_last_name,
               r.email as requester_email,
               p.first_name as processor_first_name,
               p.last_name as processor_last_name
        FROM invitation_requests ir
        LEFT JOIN users r ON ir.requester_id = r.id
        LEFT JOIN users p ON ir.processed_by = p.id
    `;

    const params: any[] = [];
    if (status) {
        query += ' WHERE ir.status = $1';
        params.push(status);
    }

    query += ' ORDER BY ir.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
}

export async function updateInvitationRequestStatus(requestId: number, status: string, processedBy?: number, rejectionReason?: string) {
    try {
        const requestExists = await pool.query(
            'SELECT id FROM invitation_requests WHERE id = $1',
            [requestId]
        );

        if (requestExists.rows.length === 0) {
            throw new Error(`Invitation request with id ${requestId} not found`);
        }

        const result = await pool.query(
            `UPDATE invitation_requests 
             SET status = $1, processed_at = NOW(), processed_by = $2, rejection_reason = $3
             WHERE id = $4 
             RETURNING *`,
            [status, processedBy || null, rejectionReason || null, requestId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Database error in updateInvitationRequestStatus:', error);
        throw new Error(`Failed to update invitation request status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getInvitationRequestsByRequester(requesterId: number) {
    const result = await pool.query(
        `SELECT ir.*, 
               p.first_name as processor_first_name,
               p.last_name as processor_last_name
        FROM invitation_requests ir
        LEFT JOIN users p ON ir.processed_by = p.id
        WHERE ir.requester_id = $1 
        ORDER BY ir.created_at DESC`,
        [requesterId]
    );
    return result.rows;
}

export async function checkAndFixInvitationsTable() {
    try {
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'invitation_requests'
            );
        `);

        if (!tableExists.rows[0].exists) {
            console.log('Table invitations does not exist, creating...');
            await pool.query(`
                CREATE TABLE invitations (
                    id SERIAL PRIMARY KEY,
                    inviter_id INTEGER NOT NULL REFERENCES users(id),
                    invitee_email VARCHAR(255) NOT NULL,
                    token VARCHAR(255) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    completed_at TIMESTAMP,
                    registered_at TIMESTAMP
                )
            `);
        }

        const requestsTableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'invitation_requests'
            );
        `);

        if (!requestsTableExists.rows[0].exists) {
            console.log('Table invitation_requests does not exist, creating...');
            await pool.query(`
                CREATE TABLE invitation_requests (
                    id SERIAL PRIMARY KEY,
                    requester_id INTEGER NOT NULL REFERENCES users(id),
                    requested_email VARCHAR(255) NOT NULL,
                    message TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT NOW(),
                    processed_at TIMESTAMP,
                    processed_by INTEGER REFERENCES users(id),
                    rejection_reason TEXT
                )
            `);
        } else {
            const columns = await pool.query(`
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns 
                WHERE table_name = 'invitation_requests'
            `);

            const rejectionReasonColumn = columns.rows.find(col => col.column_name === 'rejection_reason');
            if (!rejectionReasonColumn) {
                console.log('Adding rejection_reason column to invitation_requests table...');
                await pool.query(`
                    ALTER TABLE invitation_requests 
                    ADD COLUMN rejection_reason TEXT
                `);
            }
        }

        const invitationsColumns = await pool.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'invitations'
        `);

        const statusColumn = invitationsColumns.rows.find(col => col.column_name === 'status');
        if (!statusColumn || statusColumn.data_type !== 'character varying' || statusColumn.character_maximum_length !== 20) {
            console.log('Fixing status column in invitations table...');
            await pool.query(`
                ALTER TABLE invitations 
                ALTER COLUMN status TYPE VARCHAR(20)
            `);
        }

        const registeredAtColumn = invitationsColumns.rows.find(col => col.column_name === 'registered_at');
        if (!registeredAtColumn) {
            console.log('Adding registered_at column to invitations table...');
            await pool.query(`
                ALTER TABLE invitations 
                ADD COLUMN registered_at TIMESTAMP
            `);
        }
    } catch (error) {
        console.error('Error checking/fixing invitations table:', error);
    }
}

export async function forceAddRejectionReasonColumn() {
    try {
        console.log('Force adding rejection_reason column...');
        await pool.query(`
            ALTER TABLE invitation_requests 
            ADD COLUMN rejection_reason TEXT
        `);
        console.log('rejection_reason column added successfully');
    } catch (error: any) {
        if (error.code === '42701') {
            console.log('Column rejection_reason already exists');
        } else {
            console.error('Error adding rejection_reason column:', error);
            throw error;
        }
    }
}

export async function forceAddRegisteredAtColumn() {
    try {
        console.log('Force adding registered_at column...');
        await pool.query(`
            ALTER TABLE invitations 
            ADD COLUMN registered_at TIMESTAMP
        `);
        console.log('registered_at column added successfully');
    } catch (error: any) {
        if (error.code === '42701') {
            console.log('Column registered_at already exists');
        } else {
            console.error('Error adding registered_at column:', error);
            throw error;
        }
    }
}

export async function fixForeignKeyConstraints() {
    try {
        console.log('Fixing foreign key constraints...');

        try {
            await pool.query(`
                ALTER TABLE invitations 
                DROP CONSTRAINT IF EXISTS invitations_inviter_id_fkey
            `);
            console.log('Dropped invitations_inviter_id_fkey constraint');
        } catch (error) {
            console.log('No invitations_inviter_id_fkey constraint to drop');
        }

        try {
            await pool.query(`
                ALTER TABLE invitation_requests 
                DROP CONSTRAINT IF EXISTS invitation_requests_requester_id_fkey
            `);
            console.log('Dropped invitation_requests_requester_id_fkey constraint');
        } catch (error) {
            console.log('No invitation_requests_requester_id_fkey constraint to drop');
        }

        try {
            await pool.query(`
                ALTER TABLE invitation_requests 
                DROP CONSTRAINT IF EXISTS invitation_requests_processed_by_fkey
            `);
            console.log('Dropped invitation_requests_processed_by_fkey constraint');
        } catch (error) {
            console.log('No invitation_requests_processed_by_fkey constraint to drop');
        }

        try {
            await pool.query(`
                ALTER TABLE users 
                DROP CONSTRAINT IF EXISTS users_invited_by_fkey
            `);
            console.log('Dropped users_invited_by_fkey constraint');
        } catch (error) {
            console.log('No users_invited_by_fkey constraint to drop');
        }

        await pool.query(`
            ALTER TABLE invitations 
            ADD CONSTRAINT invitations_inviter_id_fkey 
            FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('Added invitations_inviter_id_fkey constraint with CASCADE');

        await pool.query(`
            ALTER TABLE invitation_requests 
            ADD CONSTRAINT invitation_requests_requester_id_fkey 
            FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('Added invitation_requests_requester_id_fkey constraint with CASCADE');

        await pool.query(`
            ALTER TABLE invitation_requests 
            ADD CONSTRAINT invitation_requests_processed_by_fkey 
            FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log('Added invitation_requests_processed_by_fkey constraint with SET NULL');

        await pool.query(`
            ALTER TABLE users 
            ADD CONSTRAINT users_invited_by_fkey 
            FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log('Added users_invited_by_fkey constraint with SET NULL');

        console.log('All foreign key constraints fixed successfully');
    } catch (error) {
        console.error('Error fixing foreign key constraints:', error);
        throw error;
    }
}

export async function deleteUserSafely(userId: number) {
    try {

        await pool.query('BEGIN');

        const user = await getUserById(userId);
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }

        const invitationsDeleted = await pool.query(
            'DELETE FROM invitations WHERE inviter_id = $1',
            [userId]
        );

        const requestsDeleted = await pool.query(
            'DELETE FROM invitation_requests WHERE requester_id = $1',
            [userId]
        );

        const requestsUpdated = await pool.query(
            'UPDATE invitation_requests SET processed_by = NULL WHERE processed_by = $1',
            [userId]
        );

        const usersUpdated = await pool.query(
            'UPDATE users SET invited_by = NULL WHERE invited_by = $1',
            [userId]
        );

        const passwordResetsDeleted = await pool.query(
            'DELETE FROM password_resets WHERE email = $1',
            [user.email]
        );

        const emailVerificationsDeleted = await pool.query(
            'DELETE FROM email_verifications WHERE email = $1',
            [user.email]
        );

        const userDeleted = await pool.query(
            'DELETE FROM users WHERE id = $1',
            [userId]
        );

        await pool.query('COMMIT');

        return { success: true, message: 'User deleted successfully' };

    } catch (error) {
        await pool.query('ROLLBACK');
        throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getInvitationsByInviterId(inviterId: number) {
    try {
        const result = await pool.query(
            `SELECT i.*, 
                    u.email as registered_email,
                    u.first_name as registered_first_name,
                    u.last_name as registered_last_name,
                    u.created_at as user_created_at
             FROM invitations i
             LEFT JOIN users u ON i.invitee_email = u.email
             WHERE i.inviter_id = $1
             ORDER BY i.created_at DESC`,
            [inviterId]
        );
        return result.rows;
    } catch (error) {
        throw new Error(`Failed to get invitations by inviter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getEmailNotificationSettings(userId: number): Promise<EmailNotificationSettings | null> {
    try {
        const result = await pool.query(
            'SELECT * FROM email_notification_settings WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return await createDefaultEmailNotificationSettings(userId);
        }

        return result.rows[0];
    } catch (error) {
        throw new Error(`Failed to get email notification settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function createDefaultEmailNotificationSettings(userId: number): Promise<EmailNotificationSettings> {
    try {
        const result = await pool.query(
            `INSERT INTO email_notification_settings 
             (user_id, project_invitations, bug_assignments, bug_comments, comment_replies, bug_verification) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [userId, true, true, true, true, true]
        );
        return result.rows[0];
    } catch (error) {
        throw new Error(`Failed to create default email notification settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function updateEmailNotificationSettings(
    userId: number,
    settings: Partial<EmailNotificationSettings>
): Promise<EmailNotificationSettings | null> {
    try {
        const { project_invitations, bug_assignments, bug_comments, comment_replies, bug_verification } = settings;

        const result = await pool.query(
            `INSERT INTO email_notification_settings 
             (user_id, project_invitations, bug_assignments, bug_comments, comment_replies, bug_verification, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                 project_invitations = EXCLUDED.project_invitations,
                 bug_assignments = EXCLUDED.bug_assignments,
                 bug_comments = EXCLUDED.bug_comments,
                 comment_replies = EXCLUDED.comment_replies,
                 bug_verification = EXCLUDED.bug_verification,
                 updated_at = NOW()
             RETURNING *`,
            [
                userId,
                project_invitations ?? true,
                bug_assignments ?? true,
                bug_comments ?? true,
                comment_replies ?? true,
                bug_verification ?? true
            ]
        );

        return result.rows[0] || null;
    } catch (error) {
        throw new Error(`Failed to update email notification settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function isEmailNotificationEnabled(
    userId: number,
    notificationType: 'project_invitations' | 'bug_assignments' | 'bug_comments' | 'comment_replies' | 'bug_verification'
): Promise<boolean> {
    const settings = await getEmailNotificationSettings(userId);
    if (!settings) return false;
    return !!settings[notificationType];
}
