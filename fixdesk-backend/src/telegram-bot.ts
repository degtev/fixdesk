import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import pool from './db';
import { findSocialAccount } from './models/socialAccount';
import { getUserById } from './models/user';
import {
    getBotState,
    setBotState,
    clearBotState,
    updateBotStateData,
    createTelegramBotStateTable
} from './models/telegramBotState';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN не найден в переменных окружения');
}

let bot: TelegramBot | null = null;

export async function initTelegramBot() {
    if (!TELEGRAM_BOT_TOKEN) {
        console.log('Telegram бот не запущен: отсутствует токен');
        return;
    }

    try {
        await createTelegramBotStateTable();

        bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

        console.log('Telegram бот успешно запущен');

        bot.onText(/\/start/, handleStart);
        bot.onText(/\/help/, handleHelp);
        bot.onText(/\/menu/, handleMenu);
        bot.onText(/\/cancel/, handleCancel);

        bot.on('callback_query', handleCallbackQuery);

        bot.on('message', handleMessage);

    } catch (error) {
        console.error('Ошибка запуска Telegram бота:', error);
    }
}

async function handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    await clearBotState(telegramUserId);

    const welcomeMessage = `
👋 Добро пожаловать в FixDesk Bot!

Этот бот позволяет управлять воркспейсами, проектами и задачами прямо из Telegram.

Для начала работы, пожалуйста, привяжите свой аккаунт FixDesk к Telegram в настройках профиля на сайте.

После привязки используйте /menu для доступа к функциям бота.
    `.trim();

    bot?.sendMessage(chatId, welcomeMessage);
}

async function handleHelp(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    const helpMessage = `
📖 Помощь по использованию FixDesk Bot

Доступные команды:
/start - Начать работу с ботом
/menu - Открыть главное меню
/cancel - Отменить текущую операцию
/help - Показать эту справку

Функции бота:
• Создание и просмотр воркспейсов
• Создание и просмотр проектов
• Создание задач
• Управление статусами и приоритетами

Для работы необходимо привязать аккаунт Telegram в настройках профиля на сайте FixDesk.
    `.trim();

    bot?.sendMessage(chatId, helpMessage);
}

async function handleMenu(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    const socialAccount = await findSocialAccount('telegram', telegramUserId);

    if (!socialAccount) {
        bot?.sendMessage(
            chatId,
            '❌ Аккаунт не привязан.\n\nПожалуйста, привяжите свой Telegram в настройках профиля на сайте FixDesk.',
            {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🌐 Перейти на сайт', url: process.env.FRONTEND_URL || 'http://localhost:5173' }
                    ]]
                }
            }
        );
        return;
    }

    const user = await getUserById(socialAccount.user_id);
    if (!user) {
        bot?.sendMessage(chatId, '❌ Пользователь не найден.');
        return;
    }

    await clearBotState(telegramUserId);

    const menuMessage = `
🏠 Главное меню

Привет, ${user.first_name}!

Выберите действие:
    `.trim();

    bot?.sendMessage(chatId, menuMessage, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📁 Воркспейсы', callback_data: 'workspaces_menu' }],
                [{ text: '📂 Проекты', callback_data: 'projects_menu' }],
                [{ text: '📋 Задачи', callback_data: 'bugs_menu' }],
                [{ text: '❓ Помощь', callback_data: 'help' }]
            ]
        }
    });
}

async function handleCancel(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    await clearBotState(telegramUserId);
    bot?.sendMessage(chatId, '❌ Операция отменена. Используйте /menu для возврата в главное меню.');
}

async function handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();
    const text = msg.text;

    if (!telegramUserId || !text) return;

    if (text.startsWith('/')) return;

    const state = await getBotState(telegramUserId);

    if (!state || !state.state) return;

    switch (state.state) {
        case 'creating_workspace_name':
            await handleCreatingWorkspaceName(chatId, telegramUserId, text);
            break;
        case 'creating_workspace_description':
            await handleCreatingWorkspaceDescription(chatId, telegramUserId, text);
            break;
        case 'creating_project_name':
            await handleCreatingProjectName(chatId, telegramUserId, text);
            break;
        case 'creating_project_description':
            await handleCreatingProjectDescription(chatId, telegramUserId, text);
            break;
        case 'creating_bug_title':
            await handleCreatingBugTitle(chatId, telegramUserId, text);
            break;
        case 'creating_bug_description':
            await handleCreatingBugDescription(chatId, telegramUserId, text);
            break;
    }
}

async function handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const chatId = query.message?.chat.id;
    const telegramUserId = query.from.id.toString();
    const data = query.data;

    if (!chatId || !data) return;

    bot?.answerCallbackQuery(query.id);

    if (data === 'main_menu') {
        await handleMenu({ chat: { id: chatId }, from: { id: parseInt(telegramUserId) } } as TelegramBot.Message);
        return;
    }

    if (data === 'help') {
        await handleHelp({ chat: { id: chatId }, from: { id: parseInt(telegramUserId) } } as TelegramBot.Message);
        return;
    }

    if (data === 'workspaces_menu') {
        await showWorkspacesMenu(chatId, telegramUserId);
        return;
    }

    if (data === 'create_workspace') {
        await startCreatingWorkspace(chatId, telegramUserId);
        return;
    }

    if (data === 'list_workspaces') {
        await listWorkspaces(chatId, telegramUserId);
        return;
    }

    if (data.startsWith('workspace_')) {
        const workspaceId = data.replace('workspace_', '');
        await showWorkspaceDetails(chatId, telegramUserId, workspaceId);
        return;
    }

    if (data === 'projects_menu') {
        await showProjectsMenu(chatId, telegramUserId);
        return;
    }

    if (data === 'create_project') {
        await startCreatingProject(chatId, telegramUserId);
        return;
    }

    if (data === 'list_projects') {
        await listProjects(chatId, telegramUserId);
        return;
    }

    if (data.startsWith('project_')) {
        const projectId = data.replace('project_', '');
        await showProjectDetails(chatId, telegramUserId, projectId);
        return;
    }

    if (data.startsWith('select_workspace_')) {
        const workspaceId = data.replace('select_workspace_', '');
        await selectWorkspaceForProject(chatId, telegramUserId, workspaceId);
        return;
    }

    if (data === 'bugs_menu') {
        await showBugsMenu(chatId, telegramUserId);
        return;
    }

    if (data === 'create_bug') {
        await startCreatingBug(chatId, telegramUserId);
        return;
    }

    if (data === 'list_bugs') {
        await listAllBugs(chatId, telegramUserId);
        return;
    }

    if (data.startsWith('bug_')) {
        const bugId = data.replace('bug_', '');
        await showBugDetails(chatId, telegramUserId, bugId);
        return;
    }

    if (data.startsWith('select_project_')) {
        const projectId = data.replace('select_project_', '');
        await selectProjectForBug(chatId, telegramUserId, projectId);
        return;
    }

    if (data.startsWith('bugs_project_')) {
        const projectId = data.replace('bugs_project_', '');
        await listBugsByProject(chatId, telegramUserId, projectId);
        return;
    }
}

async function showWorkspacesMenu(chatId: number, telegramUserId: string) {
    const message = `
📁 Воркспейсы

Выберите действие:
    `.trim();

    bot?.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Создать воркспейс', callback_data: 'create_workspace' }],
                [{ text: '📋 Список воркспейсов', callback_data: 'list_workspaces' }],
                [{ text: '🔙 Главное меню', callback_data: 'main_menu' }]
            ]
        }
    });
}

async function startCreatingWorkspace(chatId: number, telegramUserId: string) {
    await setBotState(telegramUserId, 'creating_workspace_name', {});
    bot?.sendMessage(
        chatId,
        '➕ Создание воркспейса\n\nВведите название воркспейса:',
        {
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Отменить', callback_data: 'workspaces_menu' }]]
            }
        }
    );
}

async function handleCreatingWorkspaceName(chatId: number, telegramUserId: string, name: string) {
    await updateBotStateData(telegramUserId, { name });
    await setBotState(telegramUserId, 'creating_workspace_description', { name });

    bot?.sendMessage(
        chatId,
        `✅ Название: ${name}\n\nТеперь введите описание воркспейса (или отправьте "-" чтобы пропустить):`,
        {
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Отменить', callback_data: 'workspaces_menu' }]]
            }
        }
    );
}

async function handleCreatingWorkspaceDescription(chatId: number, telegramUserId: string, description: string) {
    const state = await getBotState(telegramUserId);
    const name = state?.data?.name;

    if (!name) {
        bot?.sendMessage(chatId, '❌ Ошибка: название не найдено. Попробуйте снова.');
        await clearBotState(telegramUserId);
        return;
    }

    const socialAccount = await findSocialAccount('telegram', telegramUserId);
    if (!socialAccount) {
        bot?.sendMessage(chatId, '❌ Аккаунт не привязан.');
        await clearBotState(telegramUserId);
        return;
    }

    const finalDescription = description === '-' ? null : description;

    try {
        const result = await pool.query(
            `INSERT INTO workspaces (name, description, owner_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, finalDescription, socialAccount.user_id]
        );

        const workspace = result.rows[0];
        await clearBotState(telegramUserId);

        bot?.sendMessage(
            chatId,
            `✅ Воркспейс создан!\n\n📁 ${workspace.name}\n${workspace.description || 'Без описания'}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📁 Воркспейсы', callback_data: 'workspaces_menu' }],
                        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Ошибка создания воркспейса:', error);
        bot?.sendMessage(chatId, '❌ Ошибка при создании воркспейса. Попробуйте позже.');
        await clearBotState(telegramUserId);
    }
}

async function listWorkspaces(chatId: number, telegramUserId: string) {
    const socialAccount = await findSocialAccount('telegram', telegramUserId);
    if (!socialAccount) {
        bot?.sendMessage(chatId, '❌ Аккаунт не привязан.');
        return;
    }

    const result = await pool.query(
        `SELECT w.*, 
                (SELECT COUNT(*) FROM projects WHERE workspace_id = w.id) as project_count
         FROM workspaces w
         WHERE w.owner_id = $1
         OR w.id IN (SELECT workspace_id FROM workspace_members WHERE user_id = $1)
         ORDER BY w.created_at DESC`,
        [socialAccount.user_id]
    );

    if (result.rows.length === 0) {
        bot?.sendMessage(
            chatId,
            '📁 У вас пока нет воркспейсов.\n\nСоздайте первый воркспейс!',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➕ Создать воркспейс', callback_data: 'create_workspace' }],
                        [{ text: '🔙 Назад', callback_data: 'workspaces_menu' }]
                    ]
                }
            }
        );
        return;
    }

    const keyboard = result.rows.map(ws => [{
        text: `📁 ${ws.name} (проектов: ${ws.project_count})`,
        callback_data: `workspace_${ws.id}`
    }]);

    keyboard.push([{ text: '🔙 Назад', callback_data: 'workspaces_menu' }]);

    bot?.sendMessage(chatId, '📁 Ваши воркспейсы:', {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function showWorkspaceDetails(chatId: number, telegramUserId: string, workspaceId: string) {
    const result = await pool.query(
        `SELECT w.*, 
                (SELECT COUNT(*) FROM projects WHERE workspace_id = w.id) as project_count,
                (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) + 1 as member_count,
                u.first_name || ' ' || u.last_name as owner_name
         FROM workspaces w
         JOIN users u ON w.owner_id = u.id
         WHERE w.id = $1`,
        [workspaceId]
    );

    if (result.rows.length === 0) {
        bot?.sendMessage(chatId, '❌ Воркспейс не найден.');
        return;
    }

    const workspace = result.rows[0];

    const message = `
📁 ${workspace.name}

📝 Описание: ${workspace.description || 'Без описания'}
👤 Владелец: ${workspace.owner_name}
📂 Проектов: ${workspace.project_count}
👥 Участников: ${workspace.member_count}
📅 Создан: ${new Date(workspace.created_at).toLocaleDateString('ru-RU')}
    `.trim();

    bot?.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📋 Список воркспейсов', callback_data: 'list_workspaces' }],
                [{ text: '🔙 Назад', callback_data: 'workspaces_menu' }]
            ]
        }
    });
}

async function showProjectsMenu(chatId: number, telegramUserId: string) {
    const message = `
📂 Проекты

Выберите действие:
    `.trim();

    bot?.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Создать проект', callback_data: 'create_project' }],
                [{ text: '📋 Список проектов', callback_data: 'list_projects' }],
                [{ text: '🔙 Главное меню', callback_data: 'main_menu' }]
            ]
        }
    });
}

async function startCreatingProject(chatId: number, telegramUserId: string) {
    const socialAccount = await findSocialAccount('telegram', telegramUserId);
    if (!socialAccount) {
        bot?.sendMessage(chatId, '❌ Аккаунт не привязан.');
        return;
    }

    const workspaces = await pool.query(
        `SELECT w.* FROM workspaces w
         WHERE w.owner_id = $1
         OR w.id IN (SELECT workspace_id FROM workspace_members WHERE user_id = $1)
         ORDER BY w.created_at DESC`,
        [socialAccount.user_id]
    );

    if (workspaces.rows.length === 0) {
        bot?.sendMessage(
            chatId,
            '❌ У вас нет воркспейсов.\n\nСначала создайте воркспейс.',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➕ Создать воркспейс', callback_data: 'create_workspace' }],
                        [{ text: '🔙 Назад', callback_data: 'projects_menu' }]
                    ]
                }
            }
        );
        return;
    }

    const keyboard = workspaces.rows.map(ws => [{
        text: `📁 ${ws.name}`,
        callback_data: `select_workspace_${ws.id}`
    }]);

    keyboard.push([{ text: '❌ Отменить', callback_data: 'projects_menu' }]);

    bot?.sendMessage(chatId, '➕ Создание проекта\n\nВыберите воркспейс:', {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function selectWorkspaceForProject(chatId: number, telegramUserId: string, workspaceId: string) {
    await setBotState(telegramUserId, 'creating_project_name', { workspace_id: workspaceId });

    bot?.sendMessage(
        chatId,
        '➕ Создание проекта\n\nВведите название проекта:',
        {
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Отменить', callback_data: 'projects_menu' }]]
            }
        }
    );
}

async function handleCreatingProjectName(chatId: number, telegramUserId: string, name: string) {
    const state = await getBotState(telegramUserId);
    const workspaceId = state?.data?.workspace_id;

    if (!workspaceId) {
        bot?.sendMessage(chatId, '❌ Ошибка: воркспейс не выбран.');
        await clearBotState(telegramUserId);
        return;
    }

    await updateBotStateData(telegramUserId, { name });
    await setBotState(telegramUserId, 'creating_project_description', { workspace_id: workspaceId, name });

    bot?.sendMessage(
        chatId,
        `✅ Название: ${name}\n\nТеперь введите описание проекта (или отправьте "-" чтобы пропустить):`,
        {
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Отменить', callback_data: 'projects_menu' }]]
            }
        }
    );
}

async function handleCreatingProjectDescription(chatId: number, telegramUserId: string, description: string) {
    const state = await getBotState(telegramUserId);
    const { name, workspace_id } = state?.data || {};

    if (!name || !workspace_id) {
        bot?.sendMessage(chatId, '❌ Ошибка: данные не найдены. Попробуйте снова.');
        await clearBotState(telegramUserId);
        return;
    }

    const socialAccount = await findSocialAccount('telegram', telegramUserId);
    if (!socialAccount) {
        bot?.sendMessage(chatId, '❌ Аккаунт не привязан.');
        await clearBotState(telegramUserId);
        return;
    }

    const finalDescription = description === '-' ? 'Без описания' : description;

    try {
        const defaultIconUrl = '/api/project-icons/default-1.png';

        const result = await pool.query(
            `INSERT INTO projects (name, description, workspace_id, created_by, icon_url)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, finalDescription, workspace_id, socialAccount.user_id, defaultIconUrl]
        );

        const project = result.rows[0];
        await clearBotState(telegramUserId);

        bot?.sendMessage(
            chatId,
            `✅ Проект создан!\n\n📂 ${project.name}\n${project.description}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📂 Проекты', callback_data: 'projects_menu' }],
                        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Ошибка создания проекта:', error);
        bot?.sendMessage(chatId, '❌ Ошибка при создании проекта. Попробуйте позже.');
        await clearBotState(telegramUserId);
    }
}

async function listProjects(chatId: number, telegramUserId: string) {
    const socialAccount = await findSocialAccount('telegram', telegramUserId);
    if (!socialAccount) {
        bot?.sendMessage(chatId, '❌ Аккаунт не привязан.');
        return;
    }

    const result = await pool.query(
        `SELECT DISTINCT p.*, w.name as workspace_name,
                (SELECT COUNT(*) FROM bug_lists WHERE project_id = p.id) as bug_count
         FROM projects p
         LEFT JOIN workspaces w ON p.workspace_id = w.id
         LEFT JOIN project_members pm ON p.id = pm.project_id
         WHERE p.created_by = $1 OR pm.user_id = $1
         ORDER BY p.created_at DESC`,
        [socialAccount.user_id]
    );

    if (result.rows.length === 0) {
        bot?.sendMessage(
            chatId,
            '📂 У вас пока нет проектов.\n\nСоздайте первый проект!',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➕ Создать проект', callback_data: 'create_project' }],
                        [{ text: '🔙 Назад', callback_data: 'projects_menu' }]
                    ]
                }
            }
        );
        return;
    }

    const keyboard = result.rows.map(project => [{
        text: `📂 ${project.name} (${project.bug_count || 0} задач)`,
        callback_data: `project_${project.id}`
    }]);

    keyboard.push([{ text: '🔙 Назад', callback_data: 'projects_menu' }]);

    bot?.sendMessage(chatId, '📂 Ваши проекты:', {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function showProjectDetails(chatId: number, telegramUserId: string, projectId: string) {
    const result = await pool.query(
        `SELECT p.*, w.name as workspace_name,
                (SELECT COUNT(*) FROM bug_lists WHERE project_id = p.id) as bug_count,
                u.first_name || ' ' || u.last_name as creator_name
         FROM projects p
         LEFT JOIN workspaces w ON p.workspace_id = w.id
         JOIN users u ON p.created_by = u.id
         WHERE p.id = $1`,
        [projectId]
    );

    if (result.rows.length === 0) {
        bot?.sendMessage(chatId, '❌ Проект не найден.');
        return;
    }

    const project = result.rows[0];

    const message = `
📂 ${project.name}

📝 Описание: ${project.description || 'Без описания'}
📁 Воркспейс: ${project.workspace_name}
👤 Создатель: ${project.creator_name}
📋 Задач: ${project.bug_count}
📅 Создан: ${new Date(project.created_at).toLocaleDateString('ru-RU')}
    `.trim();

    bot?.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📋 Задачи проекта', callback_data: `bugs_project_${projectId}` }],
                [{ text: '📋 Список проектов', callback_data: 'list_projects' }],
                [{ text: '🔙 Назад', callback_data: 'projects_menu' }]
            ]
        }
    });
}

async function showBugsMenu(chatId: number, telegramUserId: string) {
    const message = `
📋 Задачи

Выберите действие:
    `.trim();

    bot?.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Создать задачу', callback_data: 'create_bug' }],
                [{ text: '🔙 Главное меню', callback_data: 'main_menu' }]
            ]
        }
    });
}

async function startCreatingBug(chatId: number, telegramUserId: string) {
    const socialAccount = await findSocialAccount('telegram', telegramUserId);
    if (!socialAccount) {
        bot?.sendMessage(chatId, '❌ Аккаунт не привязан.');
        return;
    }

    const projects = await pool.query(
        `SELECT DISTINCT p.*, w.name as workspace_name
         FROM projects p
         LEFT JOIN workspaces w ON p.workspace_id = w.id
         LEFT JOIN project_members pm ON p.id = pm.project_id
         WHERE p.created_by = $1 OR pm.user_id = $1
         ORDER BY p.created_at DESC`,
        [socialAccount.user_id]
    );

    if (projects.rows.length === 0) {
        bot?.sendMessage(
            chatId,
            '❌ У вас нет проектов.\n\nСначала создайте проект.',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➕ Создать проект', callback_data: 'create_project' }],
                        [{ text: '🔙 Назад', callback_data: 'bugs_menu' }]
                    ]
                }
            }
        );
        return;
    }

    const keyboard = projects.rows.map(project => [{
        text: `📂 ${project.name} (${project.workspace_name})`,
        callback_data: `select_project_${project.id}`
    }]);

    keyboard.push([{ text: '❌ Отменить', callback_data: 'bugs_menu' }]);

    bot?.sendMessage(chatId, '➕ Создание задачи\n\nВыберите проект:', {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function selectProjectForBug(chatId: number, telegramUserId: string, projectId: string) {
    await setBotState(telegramUserId, 'creating_bug_title', { project_id: projectId });

    bot?.sendMessage(
        chatId,
        '➕ Создание задачи\n\nВведите название задачи:',
        {
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Отменить', callback_data: 'bugs_menu' }]]
            }
        }
    );
}

async function handleCreatingBugTitle(chatId: number, telegramUserId: string, title: string) {
    const state = await getBotState(telegramUserId);
    const projectId = state?.data?.project_id;

    if (!projectId) {
        bot?.sendMessage(chatId, '❌ Ошибка: проект не выбран.');
        await clearBotState(telegramUserId);
        return;
    }

    await updateBotStateData(telegramUserId, { title });
    await setBotState(telegramUserId, 'creating_bug_description', { project_id: projectId, title });

    bot?.sendMessage(
        chatId,
        `✅ Название: ${title}\n\nТеперь введите описание задачи:`,
        {
            reply_markup: {
                inline_keyboard: [[{ text: '❌ Отменить', callback_data: 'bugs_menu' }]]
            }
        }
    );
}

async function handleCreatingBugDescription(chatId: number, telegramUserId: string, description: string) {
    const state = await getBotState(telegramUserId);
    const { title, project_id } = state?.data || {};

    if (!title || !project_id) {
        bot?.sendMessage(chatId, '❌ Ошибка: данные не найдены. Попробуйте снова.');
        await clearBotState(telegramUserId);
        return;
    }

    const socialAccount = await findSocialAccount('telegram', telegramUserId);
    if (!socialAccount) {
        bot?.sendMessage(chatId, '❌ Аккаунт не привязан.');
        await clearBotState(telegramUserId);
        return;
    }

    try {
        const result = await pool.query(
            `INSERT INTO bug_lists (project_id, title, description, status, priority, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [project_id, title, description, 'open', 'medium', socialAccount.user_id]
        );

        const bug = result.rows[0];
        await clearBotState(telegramUserId);

        const projectResult = await pool.query('SELECT name FROM projects WHERE id = $1', [project_id]);
        const projectName = projectResult.rows[0]?.name || 'Неизвестный проект';

        bot?.sendMessage(
            chatId,
            `✅ Задача создана!\n\n📋 ${bug.title}\n📝 ${bug.description}\n📂 Проект: ${projectName}\n📊 Статус: ${bug.status}\n⚠️ Приоритет: ${bug.priority}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📋 Задачи', callback_data: 'bugs_menu' }],
                        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Ошибка создания задачи:', error);
        bot?.sendMessage(chatId, '❌ Ошибка при создании задачи. Попробуйте позже.');
        await clearBotState(telegramUserId);
    }
}

async function listAllBugs(chatId: number, telegramUserId: string) {
    const socialAccount = await findSocialAccount('telegram', telegramUserId);
    if (!socialAccount) {
        bot?.sendMessage(chatId, '❌ Аккаунт не привязан.');
        return;
    }

    const result = await pool.query(
        `SELECT b.*, p.name as project_name
         FROM bug_lists b
         JOIN projects p ON b.project_id = p.id
         LEFT JOIN project_members pm ON p.id = pm.project_id
         WHERE b.created_by = $1 OR b.assigned_to = $1 OR p.created_by = $1 OR pm.user_id = $1
         ORDER BY b.created_at DESC
         LIMIT 20`,
        [socialAccount.user_id]
    );

    if (result.rows.length === 0) {
        bot?.sendMessage(
            chatId,
            '📋 У вас пока нет задач.\n\nСоздайте первую задачу!',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➕ Создать задачу', callback_data: 'create_bug' }],
                        [{ text: '🔙 Назад', callback_data: 'bugs_menu' }]
                    ]
                }
            }
        );
        return;
    }

    const statusEmoji: Record<string, string> = {
        'open': '🔴',
        'in_progress': '🟡',
        'resolved': '🟢',
        'closed': '⚫'
    };

    const keyboard = result.rows.slice(0, 15).map(bug => [{
        text: `${statusEmoji[bug.status] || '🔵'} ${bug.title} - ${bug.project_name}`,
        callback_data: `bug_${bug.id}`
    }]);

    keyboard.push([{ text: '🔙 Назад', callback_data: 'bugs_menu' }]);

    bot?.sendMessage(chatId, '📋 Ваши задачи (последние 15):', {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function listBugsByProject(chatId: number, telegramUserId: string, projectId: string) {
    const result = await pool.query(
        `SELECT b.*, p.name as project_name
         FROM bug_lists b
         JOIN projects p ON b.project_id = p.id
         WHERE b.project_id = $1
         ORDER BY b.created_at DESC
         LIMIT 20`,
        [projectId]
    );

    if (result.rows.length === 0) {
        bot?.sendMessage(
            chatId,
            '📋 В этом проекте пока нет задач.',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➕ Создать задачу', callback_data: 'create_bug' }],
                        [{ text: '🔙 К проекту', callback_data: `project_${projectId}` }]
                    ]
                }
            }
        );
        return;
    }

    const statusEmoji: Record<string, string> = {
        'open': '🔴',
        'in_progress': '🟡',
        'resolved': '🟢',
        'closed': '⚫'
    };

    const keyboard = result.rows.map(bug => [{
        text: `${statusEmoji[bug.status] || '🔵'} ${bug.title}`,
        callback_data: `bug_${bug.id}`
    }]);

    keyboard.push([{ text: '🔙 К проекту', callback_data: `project_${projectId}` }]);

    const projectName = result.rows[0].project_name;
    bot?.sendMessage(chatId, `📋 Задачи проекта "${projectName}":`, {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function showBugDetails(chatId: number, telegramUserId: string, bugId: string) {
    const result = await pool.query(
        `SELECT b.*, p.name as project_name,
                u1.first_name || ' ' || u1.last_name as creator_name,
                u2.first_name || ' ' || u2.last_name as assignee_name
         FROM bug_lists b
         JOIN projects p ON b.project_id = p.id
         JOIN users u1 ON b.created_by = u1.id
         LEFT JOIN users u2 ON b.assigned_to = u2.id
         WHERE b.id = $1`,
        [bugId]
    );

    if (result.rows.length === 0) {
        bot?.sendMessage(chatId, '❌ Задача не найдена.');
        return;
    }

    const bug = result.rows[0];

    const statusEmoji: Record<string, string> = {
        'open': '🔴 Открыт',
        'in_progress': '🟡 В работе',
        'resolved': '🟢 Решен',
        'closed': '⚫ Закрыт'
    };

    const priorityEmoji: Record<string, string> = {
        'low': '🔵 Низкий',
        'medium': '🟠 Средний',
        'high': '🔴 Высокий'
    };

    const message = `
📋 ${bug.title}

📝 Описание: ${bug.description}
📂 Проект: ${bug.project_name}
📊 Статус: ${statusEmoji[bug.status] || bug.status}
⚠️ Приоритет: ${priorityEmoji[bug.priority] || bug.priority}
👤 Создатель: ${bug.creator_name}
${bug.assignee_name ? `🔧 Назначен: ${bug.assignee_name}` : ''}
📅 Создан: ${new Date(bug.created_at).toLocaleDateString('ru-RU')}
    `.trim();

    bot?.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Назад', callback_data: 'bugs_menu' }]
            ]
        }
    });
}

export { bot };

