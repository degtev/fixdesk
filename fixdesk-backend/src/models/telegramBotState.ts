import pool from '../db';

export interface TelegramBotState {
    telegram_user_id: string;
    state: string | null;
    data: any;
    created_at?: Date;
    updated_at?: Date;
}

export async function createTelegramBotStateTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS telegram_bot_states (
            telegram_user_id VARCHAR(255) PRIMARY KEY,
            state VARCHAR(100),
            data JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);
    console.log('Telegram bot states table checked/created');
}

export async function getBotState(telegramUserId: string): Promise<TelegramBotState | null> {
    const result = await pool.query(
        'SELECT * FROM telegram_bot_states WHERE telegram_user_id = $1',
        [telegramUserId]
    );
    return result.rows[0] || null;
}

export async function setBotState(
    telegramUserId: string,
    state: string | null,
    data: any = {}
): Promise<TelegramBotState> {
    const result = await pool.query(
        `INSERT INTO telegram_bot_states (telegram_user_id, state, data, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (telegram_user_id)
         DO UPDATE SET state = $2, data = $3, updated_at = NOW()
         RETURNING *`,
        [telegramUserId, state, JSON.stringify(data)]
    );
    return result.rows[0];
}

export async function clearBotState(telegramUserId: string): Promise<void> {
    await pool.query(
        'DELETE FROM telegram_bot_states WHERE telegram_user_id = $1',
        [telegramUserId]
    );
}

export async function updateBotStateData(
    telegramUserId: string,
    dataUpdate: any
): Promise<TelegramBotState> {
    const currentState = await getBotState(telegramUserId);
    const currentData = currentState?.data || {};
    const newData = { ...currentData, ...dataUpdate };
    
    const result = await pool.query(
        `UPDATE telegram_bot_states
         SET data = $1, updated_at = NOW()
         WHERE telegram_user_id = $2
         RETURNING *`,
        [JSON.stringify(newData), telegramUserId]
    );
    return result.rows[0];
}

