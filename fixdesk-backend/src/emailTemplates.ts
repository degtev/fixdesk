import nodemailer from 'nodemailer';

export type EmailTemplateKey =
  | 'project_invitation'
  | 'bug_assignment'
  | 'bug_comment'
  | 'bug_comment_reply'
  | 'bug_verification'
  | 'register_confirmation'
  | 'register_invite'
  | 'password_reset'
  | 'workspace_invitation';

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, {
  subject: (vars: any) => string,
  html: (vars: any) => string
}> = {
  project_invitation: {
    subject: ({ projectName }) => `FIXDESK: Вас добавили в проект "${projectName}" - FixDesk`,
    html: ({ userName, projectName, inviterName, projectUrl }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #1976d2; margin-top: 0;">Добро пожаловать в проект!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Здравствуйте, <strong>${userName}</strong>!</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Вас добавили в проект <strong>"${projectName}"</strong> пользователем <strong>${inviterName}</strong>.</p>
          <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1565c0; font-weight: 500;">Теперь вы можете:</p>
            <ul style="margin: 10px 0 0 0; color: #1565c0;">
              <li>Создавать и редактировать задачи</li>
              <li>Назначать задачи другим участникам</li>
              <li>Добавлять комментарии и вложения</li>
              <li>Отслеживать активность проекта</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${projectUrl}" style="background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Перейти к проекту</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">Если у вас есть вопросы, обратитесь к администратору проекта.</p>
        </div>
      </div>
    `
  },
  bug_assignment: {
    subject: ({ bugTitle }) => `FIXDESK: Вам назначена задача "${bugTitle}" - FixDesk`,
    html: ({ assigneeName, bugTitle, projectName, assignedByName, bugUrl }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #d32f2f; margin-top: 0;">Вам назначена новая задача!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Здравствуйте, <strong>${assigneeName}</strong>!</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Вам назначена задача в проекте <strong>"${projectName}"</strong> пользователем <strong>${assignedByName}</strong>.</p>
          <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #d32f2f;">Детали задачи:</h3>
            <p style="margin: 0; color: #333; font-weight: 500;"><strong>Название:</strong> ${bugTitle}</p>
            <p style="margin: 5px 0 0 0; color: #666;"><strong>Проект:</strong> ${projectName}</p>
            <p style="margin: 5px 0 0 0; color: #666;"><strong>Назначил:</strong> ${assignedByName}</p>
          </div>
          <div style="background: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #2e7d32; font-weight: 500;">Что нужно сделать:</p>
            <ul style="margin: 10px 0 0 0; color: #2e7d32;">
              <li>Изучить описание задачи</li>
              <li>Оценить сложность и время выполнения</li>
              <li>Обновить статус задачи</li>
              <li>Добавить комментарии о прогрессе</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${bugUrl}" style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Открыть задачу</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">Если у вас есть вопросы, обратитесь к назначившему задачу или администратору проекта.</p>
        </div>
      </div>
    `
  },
  bug_comment: {
    subject: ({ bugTitle }) => `FIXDESK: Новый комментарий к задаче "${bugTitle}" - FixDesk`,
    html: ({ recipientName, bugTitle, projectName, commentAuthorName, commentText, bugUrl }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #1976d2; margin-top: 0;">Новый комментарий к задаче!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Здравствуйте, <strong>${recipientName}</strong>!</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Пользователь <strong>${commentAuthorName}</strong> добавил комментарий к задаче <strong>"${bugTitle}"</strong> в проекте <strong>"${projectName}"</strong>.</p>
          <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2;">Детали:</h3>
            <p style="margin: 0; color: #333; font-weight: 500;"><strong>Задача:</strong> ${bugTitle}</p>
            <p style="margin: 5px 0 0 0; color: #666;"><strong>Проект:</strong> ${projectName}</p>
            <p style="margin: 5px 0 0 0; color: #666;"><strong>Автор:</strong> ${commentAuthorName}</p>
          </div>
          <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #f57c00;">Комментарий:</h3>
            <p style="margin: 0; color: #333; font-style: italic; line-height: 1.5;">"${commentText.length > 200 ? commentText.substring(0, 200) + '...' : commentText}"</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${bugUrl}" style="background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Открыть задачу</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">Вы получили это уведомление, потому что вы являетесь ответственным за эту задачу.</p>
        </div>
      </div>
    `
  },
  bug_comment_reply: {
    subject: ({ bugTitle }) => `FIXDESK: Ответ на ваш комментарий к задаче "${bugTitle}" - FixDesk`,
    html: ({ recipientName, bugTitle, projectName, commentAuthorName, commentText, bugUrl, parentCommentAuthor }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #1976d2; margin-top: 0;">Ответ на ваш комментарий!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Здравствуйте, <strong>${recipientName}</strong>!</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Пользователь <strong>${commentAuthorName}</strong> ответил на ваш комментарий к задаче <strong>"${bugTitle}"</strong> в проекте <strong>"${projectName}"</strong>.</p>
          <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2;">Детали:</h3>
            <p style="margin: 0; color: #333; font-weight: 500;"><strong>Задача:</strong> ${bugTitle}</p>
            <p style="margin: 5px 0 0 0; color: #666;"><strong>Проект:</strong> ${projectName}</p>
            <p style="margin: 5px 0 0 0; color: #666;"><strong>Автор:</strong> ${commentAuthorName}</p>
            <p style="margin: 5px 0 0 0; color: #666;"><strong>Ответ на комментарий:</strong> ${parentCommentAuthor}</p>
          </div>
          <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #f57c00;">Комментарий:</h3>
            <p style="margin: 0; color: #333; font-style: italic; line-height: 1.5;">"${commentText.length > 200 ? commentText.substring(0, 200) + '...' : commentText}"</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${bugUrl}" style="background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Открыть задачу</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">Вы получили это уведомление, потому что на ваш комментарий был дан ответ.</p>
        </div>
      </div>
    `
  },
  bug_verification: {
    subject: ({ bugTitle }) => `FIXDESK: Задача "${bugTitle}" выполнена и ожидает проверки - FixDesk`,
    html: ({ creatorName, bugTitle, projectName, bugUrl }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #388e3c, #1976d2); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #388e3c; margin-top: 0;">Задача выполнена и ожидает вашей проверки!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Здравствуйте, <strong>${creatorName}</strong>!</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Задача <strong>"${bugTitle}"</strong> в проекте <strong>"${projectName}"</strong> была переведена в статус <b>Решен</b> и ожидает вашей проверки.</p>
          <div style="background: #e8f5e9; border-left: 4px solid #388e3c; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #388e3c;">Что делать дальше?</h3>
            <ul style="margin: 10px 0 0 0; color: #388e3c;">
              <li>Проверьте выполнение задачи</li>
              <li>Если всё хорошо — закройте задачу</li>
              <li>Если есть замечания — добавьте комментарий или верните задачу в работу</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${bugUrl}" style="background: #388e3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Открыть задачу</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">Если у вас есть вопросы, обратитесь к исполнителю или администратору проекта.</p>
        </div>
      </div>
    `
  },
  register_confirmation: {
    subject: () => 'FIXDESK: Подтверждение регистрации - FixDesk',
    html: ({ verificationCode }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #1976d2; margin-top: 0;">Подтверждение регистрации</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Спасибо за регистрацию в системе <strong>FixDesk</strong>!</p>
          <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px; margin: 20px 0; border-radius: 4px; text-align: center;">
            <p style="margin: 0; color: #1565c0; font-weight: 500;">Ваш код подтверждения:</p>
            <div style="font-size: 32px; color: #1976d2; font-weight: bold; margin: 10px 0; letter-spacing: 2px;">${verificationCode}</div>
          </div>
          <p style="font-size: 15px; color: #666; margin: 20px 0 0 0;">Код действителен в течение 15 минут.</p>
          <p style="font-size: 14px; color: #999; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">Если вы не регистрировались в системе, проигнорируйте это письмо.</p>
        </div>
      </div>
    `
  },
  register_invite: {
    subject: () => 'FIXDESK: Приглашение на регистрацию - FixDesk',
    html: ({ registrationLink }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #1976d2; margin-top: 0;">Приглашение на регистрацию</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Вы были приглашены зарегистрироваться в системе <strong>FixDesk</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationLink}" style="background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Завершить регистрацию</a>
          </div>
          <p style="font-size: 15px; color: #666; margin: 20px 0 0 0;">Или перейдите по ссылке: <a href="${registrationLink}">${registrationLink}</a></p>
          <p style="font-size: 15px; color: #666; margin: 10px 0 0 0;">Приглашение действительно в течение 7 дней.</p>
          <p style="font-size: 14px; color: #999; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">Если вы не ожидали это приглашение, проигнорируйте это письмо.</p>
        </div>
      </div>
    `
  },
  password_reset: {
    subject: () => 'FIXDESK: Восстановление пароля - FixDesk',
    html: ({ resetLink }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #1976d2; margin-top: 0;">Восстановление пароля</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Вы запросили восстановление пароля для аккаунта в системе <strong>FixDesk</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Сбросить пароль</a>
          </div>
          <p style="font-size: 15px; color: #666; margin: 20px 0 0 0;">Ссылка действительна в течение 1 часа.</p>
          <p style="font-size: 14px; color: #999; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
        </div>
      </div>
    `
  },
  workspace_invitation: {
    subject: ({ workspaceName }) => `FIXDESK: Приглашение в воркспейс "${workspaceName}" - FixDesk`,
    html: ({ workspaceName, inviterName, invitationLink }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #673ab7, #512da8); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">FixDesk</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <h2 style="color: #673ab7; margin-top: 0;">Приглашение в воркспейс!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Здравствуйте!</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Пользователь <strong>${inviterName}</strong> приглашает вас присоединиться к воркспейсу <strong>"${workspaceName}"</strong>.</p>
          <div style="background: #ede7f6; border-left: 4px solid #673ab7; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #512da8; font-weight: 500;">После присоединения вы сможете:</p>
            <ul style="margin: 10px 0 0 0; color: #512da8;">
              <li>Просматривать проекты в воркспейсе</li>
              <li>Участвовать в работе над задачами</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" style="background: #673ab7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Принять приглашение</a>
          </div>
          <p style="font-size: 15px; color: #666; margin: 20px 0 0 0;">Или перейдите по ссылке: <a href="${invitationLink}">${invitationLink}</a></p>
          <p style="font-size: 15px; color: #666; margin: 10px 0 0 0;">Приглашение действительно в течение 7 дней.</p>
          <p style="font-size: 14px; color: #999; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">Если вы не ожидали это приглашение, проигнорируйте это письмо.</p>
        </div>
      </div>
    `
  }
};

export function renderEmailTemplate(template: EmailTemplateKey, vars: any) {
  const t = EMAIL_TEMPLATES[template];
  return {
    subject: t.subject(vars),
    html: t.html(vars)
  };
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return info;
  } catch (error) {
    throw error;
  }
}

export function workspaceInvitationTemplate(workspaceName: string, inviterName: string, invitationLink: string) {
  const template = EMAIL_TEMPLATES.workspace_invitation;
  return template.html({ workspaceName, inviterName, invitationLink });
} 