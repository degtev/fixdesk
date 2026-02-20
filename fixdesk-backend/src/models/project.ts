import pool from '../db';

export interface CustomStatus {
    code: string;
    name: string;
    color: string;
    readonly?: boolean;
}

export interface CustomPriority {
    code: string;
    name: string;
    color: string;
}

export interface Project {
    id?: number;
    uuid?: string;
    name: string;
    description: string;
    icon_url: string;
    created_by: number;
    workspace_id?: number;
    workspace_uuid?: string;
    created_at?: Date;
    item_name_singular?: string;
    item_name_nominative?: string;
    item_name_genitive?: string;
    item_name_accusative?: string;
    custom_statuses?: CustomStatus[];
    custom_priorities?: CustomPriority[];
}

export interface ProjectMember {
    id?: number;
    project_id: number;
    user_id: number;
    invited_by: number;
    joined_at?: Date;
}

export interface BugList {
    id?: number;
    uuid?: string;
    project_id: number;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_by: number;
    assigned_to?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface BugComment {
    id?: number;
    bug_id: number;
    user_id: number;
    comment: string;
    attachment_url?: string;
    parent_id?: number | null;
    created_at?: Date;
}


export async function createProjectTables() {
    try {

        await pool.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon_url TEXT NOT NULL,
            created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);


        try {
            await pool.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS icon_url TEXT NOT NULL DEFAULT '/api/project-icons/default-1.png'
        `);
        } catch (error) {
            console.log('Колонка icon_url уже существует или не может быть добавлена:', error);
        }

        try {
            await pool.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS custom_statuses JSONB DEFAULT '[
              {"code": "open", "name": "Открыт", "color": "#ff6b35"},
              {"code": "in_progress", "name": "В работе", "color": "#4ecdc4"},
              {"code": "resolved", "name": "Решен", "color": "#45b7d1"},
              {"code": "closed", "name": "Закрыт", "color": "#96ceb4", "readonly": true}
            ]'::jsonb
        `);
            await pool.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS custom_priorities JSONB DEFAULT '[
              {"code": "low", "name": "Низкий", "color": "#4caf50"},
              {"code": "medium", "name": "Средний", "color": "#ff9800"},
              {"code": "high", "name": "Высокий", "color": "#f44336"},
              {"code": "critical", "name": "Критический", "color": "#9c27b0"}
            ]'::jsonb
        `);
        } catch (error) {
            console.log('Колонки custom_statuses/custom_priorities уже существуют или не могут быть добавлены:', error);
        }

        await pool.query(`
        CREATE TABLE IF NOT EXISTS project_members (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            joined_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(project_id, user_id)
        )
    `);

        try {
            await pool.query(`
            ALTER TABLE project_members 
            ADD COLUMN IF NOT EXISTS invited_by INTEGER NOT NULL DEFAULT 1
        `);
        } catch (error) {
            console.log('Колонка invited_by уже существует или не может быть добавлена:', error);
        }

        await pool.query(`
        CREATE TABLE IF NOT EXISTS bug_lists (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'open',
            priority VARCHAR(20) NOT NULL DEFAULT 'medium',
            created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);

        try {
            await pool.query(`
            ALTER TABLE bug_lists 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'open'
        `);
            await pool.query(`
            ALTER TABLE bug_lists 
            ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'medium'
        `);
            await pool.query(`
            ALTER TABLE bug_lists 
            ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL
        `);
            await pool.query(`
            ALTER TABLE bug_lists 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
        `);
        } catch (error) {
            console.log('Колонки в bug_lists уже существуют или не могут быть добавлены:', error);
        }

        await pool.query(`
        CREATE TABLE IF NOT EXISTS bug_comments (
            id SERIAL PRIMARY KEY,
            bug_id INTEGER NOT NULL REFERENCES bug_lists(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            comment TEXT NOT NULL,
            attachment_url TEXT,
            parent_id INTEGER REFERENCES bug_comments(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);

        try {
            await pool.query(`
            ALTER TABLE bug_comments 
            ADD COLUMN IF NOT EXISTS attachment_url TEXT
        `);
            await pool.query(`
            ALTER TABLE bug_comments 
            ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES bug_comments(id) ON DELETE CASCADE
        `);
        } catch (error) {
            console.log('Колонка attachment_url уже существует или не может быть добавлена:', error);
        }

        await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
        CREATE INDEX IF NOT EXISTS idx_bug_lists_project_id ON bug_lists(project_id);
        CREATE INDEX IF NOT EXISTS idx_bug_lists_assigned_to ON bug_lists(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_bug_comments_bug_id ON bug_comments(bug_id);
    `);

        try {
            await pool.query(`
            UPDATE projects 
            SET icon_url = '/api/project-icons/default-1.png' 
            WHERE icon_url IS NULL OR icon_url = ''
        `);
            console.log('Миграция данных завершена');
        } catch (error) {
            console.log('Миграция данных не требуется или завершилась с ошибкой:', error);
        }

    } catch (error) {
        console.error('Ошибка создания таблиц:', error);
        throw error;
    }
}

export async function checkTableStructure() {
    try {
        const projectsStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
            ORDER BY ordinal_position
        `);
        console.log('Структура таблицы projects:', projectsStructure.rows);

        const membersStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'project_members' 
            ORDER BY ordinal_position
        `);
        console.log('Структура таблицы project_members:', membersStructure.rows);

    } catch (error) {
        console.error('Ошибка проверки структуры таблиц:', error);
    }
}

export async function createProject(project: Project): Promise<Project> {
    const {
        name,
        description,
        icon_url,
        created_by,
        workspace_id,
        item_name_singular = 'задача',
        item_name_nominative = 'задачи',
        item_name_genitive = 'задач',
        item_name_accusative = "задачу",
        custom_statuses,
        custom_priorities
    } = project;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO projects (name, description, icon_url, created_by, workspace_id, item_name_singular, item_name_nominative, item_name_genitive, item_name_accusative, custom_statuses, custom_priorities)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [name, description, icon_url, created_by, workspace_id || null, item_name_singular, item_name_nominative, item_name_genitive, item_name_accusative,
                custom_statuses ? JSON.stringify(custom_statuses) : null,
                custom_priorities ? JSON.stringify(custom_priorities) : null]
        );

        let newProject = result.rows[0];

        await client.query(
            `INSERT INTO project_members (project_id, user_id, invited_by)
             VALUES ($1, $2, $2)`,
            [newProject.id, created_by]
        );

        if (workspace_id) {
            const workspaceResult = await client.query(
                'SELECT uuid FROM workspaces WHERE id = $1',
                [workspace_id]
            );
            if (workspaceResult.rows.length > 0) {
                newProject.workspace_uuid = workspaceResult.rows[0].uuid;
            }
        }

        await client.query('COMMIT');
        return newProject;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function getProjectById(id: number): Promise<Project | null> {
    const result = await pool.query(
        `SELECT p.*, w.uuid as workspace_uuid 
         FROM projects p
         LEFT JOIN workspaces w ON p.workspace_id = w.id
         WHERE p.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

export async function getProjectByUuid(uuid: string): Promise<Project | null> {
    const result = await pool.query(
        `SELECT p.*, w.uuid as workspace_uuid 
         FROM projects p
         LEFT JOIN workspaces w ON p.workspace_id = w.id
         WHERE p.uuid = $1`,
        [uuid]
    );
    return result.rows[0] || null;
}

export async function updateProject(
    id: number,
    updates: Partial<Project>
): Promise<Project | null> {
    const {
        name,
        description,
        icon_url,
        item_name_singular,
        item_name_nominative,
        item_name_genitive,
        item_name_accusative,
        custom_statuses,
        custom_priorities
    } = updates;

    const result = await pool.query(
        `UPDATE projects
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             icon_url = COALESCE($3, icon_url),
             item_name_singular = COALESCE($4, item_name_singular),
             item_name_nominative = COALESCE($5, item_name_nominative),
             item_name_genitive = COALESCE($6, item_name_genitive),
             item_name_accusative = COALESCE($7, item_name_accusative),
             custom_statuses = COALESCE($8, custom_statuses),
             custom_priorities = COALESCE($9, custom_priorities)
         WHERE id = $10 RETURNING *`,
        [
            name,
            description,
            icon_url,
            item_name_singular,
            item_name_nominative,
            item_name_genitive,
            item_name_accusative,
            custom_statuses ? JSON.stringify(custom_statuses) : null,
            custom_priorities ? JSON.stringify(custom_priorities) : null,
            id
        ]
    );

    const updatedProject = result.rows[0];
    if (!updatedProject) return null;

    if (updatedProject.workspace_id) {
        const workspaceResult = await pool.query(
            'SELECT uuid FROM workspaces WHERE id = $1',
            [updatedProject.workspace_id]
        );
        if (workspaceResult.rows.length > 0) {
            updatedProject.workspace_uuid = workspaceResult.rows[0].uuid;
        }
    }

    return updatedProject;
}


export async function deleteProject(id: number): Promise<boolean> {
    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
        return (result.rowCount || 0) > 0;
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}

export async function getProjectsByUser(userId: number): Promise<Project[]> {
    const result = await pool.query(`
        SELECT DISTINCT p.* 
        FROM projects p
        WHERE p.created_by = $1 
           OR EXISTS (
               SELECT 1 FROM project_members pm 
               WHERE pm.project_id = p.id AND pm.user_id = $1
           )
        ORDER BY p.created_at DESC
    `, [userId]);
    return result.rows;
}

export async function addProjectMember(projectId: number, userId: number, invitedBy: number): Promise<ProjectMember> {
    const result = await pool.query(
        `INSERT INTO project_members (project_id, user_id, invited_by)
         VALUES ($1, $2, $3) RETURNING *`,
        [projectId, userId, invitedBy]
    );
    return result.rows[0];
}

export async function isProjectMember(projectId: number, userId: number): Promise<boolean> {
    const result = await pool.query(`
        SELECT 1 FROM project_members 
        WHERE project_id = $1 AND user_id = $2
        UNION
        SELECT 1 FROM projects WHERE id = $1 AND created_by = $2
    `, [projectId, userId]);
    return result.rows.length > 0;
}

export async function getProjectMembers(projectId: number): Promise<any[]> {
    const result = await pool.query(`
        SELECT u.id, u.first_name, u.last_name, u.email, u.position, u.avatar_url,
               COALESCE(pm.joined_at, p.created_at) as joined_at,
               pm.invited_by,
               CASE WHEN p.created_by = u.id THEN true ELSE false END as is_creator
        FROM (
            SELECT DISTINCT user_id FROM (
                SELECT user_id FROM project_members WHERE project_id = $1
                UNION
                SELECT created_by as user_id FROM projects WHERE id = $1
            ) unique_users
        ) unique_user_ids
        INNER JOIN users u ON u.id = unique_user_ids.user_id
        LEFT JOIN project_members pm ON pm.project_id = $1 AND pm.user_id = u.id
        INNER JOIN projects p ON p.id = $1
        ORDER BY joined_at ASC
    `, [projectId]);
    return result.rows;
}

export async function createBugList(bugList: BugList): Promise<BugList> {
    const { project_id, title, description, status, priority, created_by, assigned_to } = bugList;
    const result = await pool.query(
        `INSERT INTO bug_lists (project_id, title, description, status, priority, created_by, assigned_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [project_id, title, description, status, priority, created_by, assigned_to || null]
    );
    return result.rows[0];
}

export async function getBugListById(id: number): Promise<BugList | null> {
    const result = await pool.query('SELECT * FROM bug_lists WHERE id = $1', [id]);
    return result.rows[0] || null;
}

export async function getBugListByUuid(uuid: string): Promise<BugList | null> {
    const result = await pool.query('SELECT * FROM bug_lists WHERE uuid = $1', [uuid]);
    return result.rows[0] || null;
}

export async function getBugListWithUsers(id: number): Promise<any> {
    const result = await pool.query(`
        SELECT bl.*, 
               creator.first_name as creator_first_name, 
               creator.last_name as creator_last_name,
               assignee.first_name as assignee_first_name, 
               assignee.last_name as assignee_last_name
        FROM bug_lists bl
        LEFT JOIN users creator ON bl.created_by = creator.id
        LEFT JOIN users assignee ON bl.assigned_to = assignee.id
        WHERE bl.id = $1
    `, [id]);
    return result.rows[0] || null;
}

export async function getBugListWithUsersByUuid(uuid: string): Promise<any> {
    const result = await pool.query(`
        SELECT bl.*, 
               creator.first_name as creator_first_name, 
               creator.last_name as creator_last_name,
               assignee.first_name as assignee_first_name, 
               assignee.last_name as assignee_last_name
        FROM bug_lists bl
        LEFT JOIN users creator ON bl.created_by = creator.id
        LEFT JOIN users assignee ON bl.assigned_to = assignee.id
        WHERE bl.uuid = $1
    `, [uuid]);
    return result.rows[0] || null;
}

export async function getBugListsByProject(projectId: number): Promise<BugList[]> {
    const result = await pool.query(`
        SELECT bl.*, 
               creator.first_name as creator_first_name, 
               creator.last_name as creator_last_name,
               assignee.first_name as assignee_first_name, 
               assignee.last_name as assignee_last_name
        FROM bug_lists bl
        LEFT JOIN users creator ON bl.created_by = creator.id
        LEFT JOIN users assignee ON bl.assigned_to = assignee.id
        WHERE bl.project_id = $1
        ORDER BY bl.created_at DESC
    `, [projectId]);
    return result.rows;
}

export async function updateBugList(id: number, updates: Partial<BugList>): Promise<BugList | null> {
    const { title, description, status, priority, assigned_to } = updates;
    const result = await pool.query(
        `UPDATE bug_lists 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             status = COALESCE($3, status),
             priority = COALESCE($4, priority),
             assigned_to = $5,
             updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [title, description, status, priority, assigned_to || null, id]
    );
    return result.rows[0] || null;
}

export async function updateBugListByUuid(uuid: string, updates: Partial<BugList>): Promise<BugList | null> {
    const { title, description, status, priority, assigned_to } = updates;
    const result = await pool.query(
        `UPDATE bug_lists 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             status = COALESCE($3, status),
             priority = COALESCE($4, priority),
             assigned_to = $5,
             updated_at = NOW()
         WHERE uuid = $6 RETURNING *`,
        [title, description, status, priority, assigned_to || null, uuid]
    );
    return result.rows[0] || null;
}

export async function deleteBugList(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM bug_lists WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
}

export async function deleteBugListByUuid(uuid: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM bug_lists WHERE uuid = $1', [uuid]);
    return (result.rowCount || 0) > 0;
}

export async function createBugComment(comment: BugComment): Promise<BugComment> {
    const { bug_id, user_id, comment: commentText, attachment_url, parent_id } = comment;
    const result = await pool.query(
        `INSERT INTO bug_comments (bug_id, user_id, comment, attachment_url, parent_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [bug_id, user_id, commentText, attachment_url || null, parent_id || null]
    );

    const fullResult = await pool.query(`
        SELECT bc.*, u.first_name, u.last_name, u.avatar_url
        FROM bug_comments bc
        INNER JOIN users u ON bc.user_id = u.id
        WHERE bc.id = $1
    `, [result.rows[0].id]);

    return fullResult.rows[0];
}

export async function getBugComments(bugId: number): Promise<any[]> {
    const result = await pool.query(`
        SELECT bc.*, u.first_name, u.last_name, u.avatar_url
        FROM bug_comments bc
        INNER JOIN users u ON bc.user_id = u.id
        WHERE bc.bug_id = $1
        ORDER BY 
            CASE WHEN bc.parent_id IS NULL THEN 0 ELSE 1 END, -- Сначала родительские комментарии
            bc.created_at DESC, -- Новые комментарии сверху
            bc.id DESC -- Для одинакового времени создания
    `, [bugId]);
    const comments = result.rows;
    const map: { [id: number]: any } = {};
    const roots: any[] = [];
    comments.forEach(c => { c.replies = []; map[c.id] = c; });
    comments.forEach(c => {
        if (c.parent_id) {
            if (map[c.parent_id]) map[c.parent_id].replies.push(c);
        } else {
            roots.push(c);
        }
    });

    roots.forEach(root => {
        if (root.replies && root.replies.length > 0) {
            root.replies.sort((a: any, b: any) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        }
    });

    return roots;
}

export async function checkDuplicateProjectMembers() {
    try {
        const result = await pool.query(`
            SELECT project_id, user_id, COUNT(*) as count
            FROM project_members 
            GROUP BY project_id, user_id
            HAVING COUNT(*) > 1
        `);

        if (result.rows.length > 0) {
            console.log('Найдены дубликаты участников проекта:', result.rows);
        } else {
            console.log('Дубликатов участников проекта не найдено');
        }

        return result.rows;
    } catch (error) {
        console.error('Ошибка проверки дубликатов:', error);
        return [];
    }
}

export async function cleanDuplicateProjectMembers() {
    try {
        const duplicates = await checkDuplicateProjectMembers();

        if (duplicates.length > 0) {
            const result = await pool.query(`
                DELETE FROM project_members 
                WHERE id NOT IN (
                    SELECT MIN(id) 
                    FROM project_members 
                    GROUP BY project_id, user_id
                )
            `);
            console.log(`Очищено ${result.rowCount || 0} дубликатов участников проекта`);
        }
    } catch (error) {
        console.error('Ошибка очистки дубликатов:', error);
    }
}

export async function getProjectMembersForAssignment(projectId: number): Promise<any[]> {
    const result = await pool.query(`
        SELECT u.id, u.first_name, u.last_name, u.email, u.position, u.avatar_url
        FROM (
            SELECT DISTINCT user_id FROM (
                SELECT user_id FROM project_members WHERE project_id = $1
                UNION
                SELECT created_by as user_id FROM projects WHERE id = $1
            ) unique_users
        ) unique_user_ids
        INNER JOIN users u ON u.id = unique_user_ids.user_id
        ORDER BY u.first_name, u.last_name
    `, [projectId]);
    return result.rows;
}

export async function findUsersByEmail(email: string): Promise<any[]> {
    const result = await pool.query(`
        SELECT id, first_name, last_name, email, position, avatar_url
        FROM users 
        WHERE email ILIKE $1
        LIMIT 10
    `, [`%${email}%`]);
    return result.rows;
}

export async function removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    try {
        const result = await pool.query(`
            DELETE FROM project_members 
            WHERE project_id = $1 AND user_id = $2
        `, [projectId, userId]);

        return (result.rowCount || 0) > 0;
    } catch (error) {
        console.error('Error removing project member:', error);
        throw error;
    }
} 