import pool from '../db';

export interface SocialAccount {
    id?: number;
    user_id: number;
    provider: string;
    provider_user_id: string;
    provider_email?: string;
    provider_username?: string;
    access_token?: string;
    refresh_token?: string;
    profile_data?: any;
    created_at?: Date;
    updated_at?: Date;
}

export async function createSocialAccountsTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS social_accounts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider VARCHAR(50) NOT NULL,
                provider_user_id VARCHAR(255) NOT NULL,
                provider_email VARCHAR(255),
                provider_username VARCHAR(255),
                access_token TEXT,
                refresh_token TEXT,
                profile_data JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(provider, provider_user_id),
                UNIQUE(user_id, provider)
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id)
        `);

        console.log('Social accounts tables created/verified');
    } catch (error) {
        console.error('Error creating social accounts tables:', error);
    }
}

export async function findSocialAccount(provider: string, providerUserId: string): Promise<SocialAccount | null> {
    const result = await pool.query(
        'SELECT * FROM social_accounts WHERE provider = $1 AND provider_user_id = $2',
        [provider, providerUserId]
    );
    return result.rows[0] || null;
}

export async function getSocialAccountsByUserId(userId: number): Promise<SocialAccount[]> {
    const result = await pool.query(
        'SELECT id, user_id, provider, provider_email, provider_username, created_at FROM social_accounts WHERE user_id = $1',
        [userId]
    );
    return result.rows;
}

export async function upsertSocialAccount(account: SocialAccount): Promise<SocialAccount> {
    const result = await pool.query(
        `INSERT INTO social_accounts 
         (user_id, provider, provider_user_id, provider_email, provider_username, access_token, refresh_token, profile_data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (user_id, provider) 
         DO UPDATE SET 
            provider_user_id = EXCLUDED.provider_user_id,
            provider_email = EXCLUDED.provider_email,
            provider_username = EXCLUDED.provider_username,
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            profile_data = EXCLUDED.profile_data,
            updated_at = NOW()
         RETURNING *`,
        [
            account.user_id,
            account.provider,
            account.provider_user_id,
            account.provider_email || null,
            account.provider_username || null,
            account.access_token || null,
            account.refresh_token || null,
            account.profile_data ? JSON.stringify(account.profile_data) : null
        ]
    );
    return result.rows[0];
}

export async function deleteSocialAccount(userId: number, provider: string): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM social_accounts WHERE user_id = $1 AND provider = $2',
        [userId, provider]
    );
    return result.rowCount ? result.rowCount > 0 : false;
}

