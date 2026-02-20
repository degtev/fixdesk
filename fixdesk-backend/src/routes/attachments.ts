import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { isProjectMember, getBugListByUuid, getBugListWithUsers } from '../models/project';
import pool from '../db';

function transliterate(text: string): string {
    const translitMap: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    return text.split('').map(char => translitMap[char] || char).join('');
}

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);

        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

        const transliteratedName = transliterate(originalName)
            .replace(/[^a-z0-9.-]/gi, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();

        const fileName = `${transliteratedName}-${uniqueSuffix}${extension}`;
        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip', 'application/x-zip-compressed',
            'application/x-rar-compressed', 'application/vnd.rar'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Неподдерживаемый тип файла'));
        }
    }
});

router.get('/bugs/:bugUuid/attachments', authMiddleware, async (req, res) => {
    try {
        const { bugUuid } = req.params;
        const userId = (req as any).user.userId;

        const bug = await getBugListByUuid(bugUuid);

        if (!bug) {
            return res.status(404).json({ message: 'Баг не найден' });
        }

        const hasAccess = await isProjectMember(bug.project_id, userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        const attachments = await pool.query(
            `SELECT 
                ba.id,
                ba.type,
                ba.name,
                ba.url,
                ba.file_size,
                ba.mime_type,
                ba.created_at,
                u.first_name,
                u.last_name
             FROM bug_attachments ba
             JOIN users u ON ba.created_by = u.id
             WHERE ba.bug_id = $1
             ORDER BY ba.created_at DESC`,
            [bug.id]
        );

        res.json(attachments.rows);
    } catch (error) {
        console.error('Error fetching attachments:', error);
        res.status(500).json({ message: 'Ошибка получения вложений' });
    }
});

router.post('/bugs/:bugUuid/attachments/file', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { bugUuid } = req.params;
        const userId = (req as any).user.userId;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Файл не загружен' });
        }

        const bug = await getBugListByUuid(bugUuid);

        if (!bug) {
            return res.status(404).json({ message: 'Баг не найден' });
        }

        const hasAccess = await isProjectMember(bug.project_id, userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

        const attachment = await pool.query(
            `INSERT INTO bug_attachments (bug_id, type, name, url, file_size, mime_type, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [bug.id, 'file', originalName, `/uploads/${file.filename}`, file.size, file.mimetype, userId]
        );

        const updatedAttachments = await pool.query(
            `SELECT * FROM bug_attachments WHERE bug_id = $1`, [bug.id]
        );

        const bugWithUsers = await getBugListWithUsers(bug.id!);
        const bugWithAttachments = { ...bugWithUsers, attachments: updatedAttachments.rows };
        const { io } = require('../index');
        if (io && bug.project_id) {
            io.to(`project_${bug.project_id}`).emit('bug_updated', {
                bugId: bug.id,
                bugUuid: bug.uuid,
                bug: bugWithAttachments
            });
        }

        res.json({
            message: 'Файл успешно загружен',
            attachment: attachment.rows[0]
        });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: error.message || 'Ошибка загрузки файла' });
    }
});

router.post('/bugs/:bugUuid/attachments/link', authMiddleware, async (req, res) => {
    try {
        const { bugUuid } = req.params;
        const { name, url } = req.body;
        const userId = (req as any).user.userId;

        if (!name || !url) {
            return res.status(400).json({ message: 'Название и ссылка обязательны' });
        }

        try {
            new URL(url);
        } catch (error) {
            return res.status(400).json({ message: 'Некорректный URL' });
        }

        const bug = await getBugListByUuid(bugUuid);

        if (!bug) {
            return res.status(404).json({ message: 'Баг не найден' });
        }

        const hasAccess = await isProjectMember(bug.project_id, userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        const attachment = await pool.query(
            `INSERT INTO bug_attachments (bug_id, type, name, url, created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [bug.id, 'link', name, url, userId]
        );

        res.json({
            message: 'Ссылка успешно добавлена',
            attachment: attachment.rows[0]
        });
    } catch (error) {
        console.error('Error adding link:', error);
        res.status(500).json({ message: 'Ошибка добавления ссылки' });
    }
});

router.delete('/attachments/:attachmentId', authMiddleware, async (req, res) => {
    try {
        const { attachmentId } = req.params;
        const userId = (req as any).user.userId;

        const attachmentCheck = await pool.query(
            `SELECT ba.*, bl.project_id
             FROM bug_attachments ba
             JOIN bug_lists bl ON ba.bug_id = bl.id
             WHERE ba.id = $1`,
            [attachmentId]
        );

        if (attachmentCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Вложение не найдено' });
        }

        const attachment = attachmentCheck.rows[0];

        const hasAccess = await isProjectMember(attachment.project_id, userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        const attachmentData = attachmentCheck.rows[0];

        if (attachmentData.type === 'file') {
            const filePath = path.join(__dirname, '../../', attachmentData.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await pool.query('DELETE FROM bug_attachments WHERE id = $1', [attachmentId]);

        const updatedAttachments = await pool.query(
            `SELECT * FROM bug_attachments WHERE bug_id = $1`, [attachment.bug_id]
        );
        const bugWithUsers = await getBugListWithUsers(attachment.bug_id);
        const bugWithAttachments = { ...bugWithUsers, attachments: updatedAttachments.rows };
        const { io } = require('../index');
        if (io && attachment.project_id) {
            io.to(`project_${attachment.project_id}`).emit('bug_updated', {
                bugId: attachment.bug_id,
                bugUuid: bugWithUsers.uuid,
                bug: bugWithAttachments
            });
        }

        res.json({ message: 'Вложение успешно удалено' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка удаления вложения' });
    }
});

router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'Размер файла слишком большой. Максимальный размер: 10 МБ'
            });
        }
        return res.status(400).json({
            message: `Ошибка загрузки файла: ${error.message}`
        });
    }

    if (error && error.message === 'Неподдерживаемый тип файла') {
        return res.status(400).json({
            message: 'Неподдерживаемый тип файла. Разрешены: JPEG, PNG, GIF, WebP, MP4, AVI, MOV, WMV, PDF, DOC, DOCX, TXT, ZIP, RAR'
        });
    }

    next(error);
});

router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

export default router; 