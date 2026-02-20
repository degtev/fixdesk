import express from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import pool from '../db';
import { isProjectMember, getProjectById, getProjectByUuid } from '../models/project';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

router.post('/projects/:projectUuid/export', authMiddleware, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.projectUuid;
        const { format, fields } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        const hasAccess = await isProjectMember(project.id!, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const bugsQuery = await pool.query(
            `SELECT 
                bl.*,
                creator.first_name as creator_first_name,
                creator.last_name as creator_last_name,
                assignee.first_name as assignee_first_name,
                assignee.last_name as assignee_last_name,
                COALESCE(SUM(tt.duration), 0) as total_time
            FROM bug_lists bl
            LEFT JOIN users creator ON bl.created_by = creator.id
            LEFT JOIN users assignee ON bl.assigned_to = assignee.id
            LEFT JOIN bug_time_tracks tt ON bl.id = tt.bug_id AND tt.end_time IS NOT NULL
            WHERE bl.project_id = $1
            GROUP BY bl.id, creator.id, assignee.id
            ORDER BY bl.created_at DESC`,
            [project.id!]
        );

        const bugs = bugsQuery.rows;

        const exportData = bugs.map(bug => {
            const row: any = {};

            if (fields.includes('title')) row['Название'] = bug.title || '';
            if (fields.includes('description')) row['Описание'] = bug.description || '';
            if (fields.includes('creator')) row['Постановщик'] = `${bug.creator_first_name || ''} ${bug.creator_last_name || ''}`.trim();
            if (fields.includes('assignee')) row['Исполнитель'] = bug.assignee_first_name ? `${bug.assignee_first_name} ${bug.assignee_last_name}`.trim() : '';
            if (fields.includes('status')) row['Статус'] = bug.status || '';
            if (fields.includes('priority')) row['Приоритет'] = bug.priority || '';
            if (fields.includes('created_at')) row['Дата создания'] = bug.created_at ? new Date(bug.created_at).toLocaleString('ru-RU') : '';
            if (fields.includes('updated_at')) row['Дата обновления'] = bug.updated_at ? new Date(bug.updated_at).toLocaleString('ru-RU') : '';
            if (fields.includes('total_time')) {
                const totalSeconds = parseInt(bug.total_time) || 0;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                row['Общее время'] = `${hours}ч ${minutes}м`;
            }

            return row;
        });

        if (format === 'csv') {
            stringify(exportData, {
                header: true,
                bom: true,
                delimiter: ';'
            }, (err: Error | undefined, output: string | undefined) => {
                if (err) {
                    return res.status(500).json({ message: 'Ошибка создания CSV' });
                }

                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="export_${project.uuid}_${Date.now()}.csv"`);
                res.send(output);
            });
        } else if (format === 'xlsx') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Bugs');

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="export_${project.uuid}_${Date.now()}.xlsx"`);
            res.send(buffer);
        } else {
            return res.status(400).json({ message: 'Неверный формат экспорта' });
        }

    } catch (error) {
        console.error('Error exporting bugs:', error);
        res.status(500).json({ message: 'Ошибка экспорта элементов' });
    }
});

router.post('/projects/:projectUuid/import/preview', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.projectUuid;
        const { delimiter, columnMapping } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' });
        }

        const hasAccess = await isProjectMember(project.id!, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
        let rows: any[] = [];

        if (fileExtension === 'csv') {
            const content = req.file.buffer.toString('utf-8');
            const parser = parse(content, {
                delimiter: delimiter || ';',
                columns: true,
                skip_empty_lines: true,
                bom: true
            });

            rows = await new Promise((resolve, reject) => {
                const records: any[] = [];
                parser.on('readable', function () {
                    let record;
                    while ((record = parser.read()) !== null) {
                        records.push(record);
                    }
                });
                parser.on('error', reject);
                parser.on('end', () => resolve(records));
            });

        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rows = XLSX.utils.sheet_to_json(worksheet);
        } else {
            return res.status(400).json({ message: 'Неподдерживаемый формат файла' });
        }

        const preview = rows.slice(0, 5);

        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        res.json({
            preview,
            columns,
            totalRows: rows.length
        });

    } catch (error) {
        console.error('Error previewing import:', error);
        res.status(500).json({ message: 'Ошибка предпросмотра импорта' });
    }
});

router.post('/projects/:projectUuid/import', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const projectUuid = req.params.projectUuid;
        const { delimiter, columnMapping } = req.body;

        if (!authReq.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const project = await getProjectByUuid(projectUuid);
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' });
        }

        const hasAccess = await isProjectMember(project.id!, authReq.user.userId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Нет доступа к проекту' });
        }

        const projectData = project;
        let defaultStatus = 'open';
        let defaultPriority = 'medium';

        if (projectData && projectData.custom_statuses && projectData.custom_statuses.length > 0) {
            defaultStatus = projectData.custom_statuses[0].code;
        }

        if (projectData && projectData.custom_priorities && projectData.custom_priorities.length > 0) {
            defaultPriority = projectData.custom_priorities[0].code;
        }

        const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
        let rows: any[] = [];

        if (fileExtension === 'csv') {
            const content = req.file.buffer.toString('utf-8');
            const parser = parse(content, {
                delimiter: delimiter || ';',
                columns: true,
                skip_empty_lines: true,
                bom: true
            });

            rows = await new Promise((resolve, reject) => {
                const records: any[] = [];
                parser.on('readable', function () {
                    let record;
                    while ((record = parser.read()) !== null) {
                        records.push(record);
                    }
                });
                parser.on('error', reject);
                parser.on('end', () => resolve(records));
            });

        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rows = XLSX.utils.sheet_to_json(worksheet);
        } else {
            return res.status(400).json({ message: 'Неподдерживаемый формат файла' });
        }

        const mapping = typeof columnMapping === 'string' ? JSON.parse(columnMapping) : columnMapping;

        let imported = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            try {
                const title = row[mapping.title] || `Элемент ${i + 1}`;
                const description = row[mapping.description] || '';

                if (!title.trim()) {
                    errors.push(`Строка ${i + 1}: отсутствует название`);
                    continue;
                }

                await pool.query(
                    `INSERT INTO bug_lists (project_id, title, description, status, priority, created_by)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [project.id!, title, description, defaultStatus, defaultPriority, authReq.user.userId]
                );

                imported++;
            } catch (error) {
                console.error(`Error importing row ${i + 1}:`, error);
                errors.push(`Строка ${i + 1}: ошибка импорта`);
            }
        }

        res.json({
            imported,
            total: rows.length,
            errors
        });

    } catch (error) {
        console.error('Error importing bugs:', error);
        res.status(500).json({ message: 'Ошибка импорта элементов' });
    }
});

export default router;

