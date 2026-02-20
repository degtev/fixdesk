// текст политики сгенерирован в чатгпт
import React from 'react';
import { Box, Typography, Container, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#0f0f17',
            py: 6
        }}>
            <Container maxWidth="md">
                <Box sx={{
                    bgcolor: '#16161a',
                    border: '1px solid #32324d',
                    borderRadius: 2,
                    p: 4
                }}>
                    <Typography
                        variant="h3"
                        sx={{
                            color: '#fff',
                            mb: 2,
                            fontWeight: 700
                        }}
                    >
                        Политика конфиденциальности и обработки персональных данных
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#a5a5ba', mb: 4 }}>
                        Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
                    </Typography>

                    <Divider sx={{ borderColor: '#32324d', mb: 4 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                1. Общие положения
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                Настоящая Политика конфиденциальности и обработки персональных данных (далее — Политика)
                                разработана в соответствии с Федеральным законом РФ №152-ФЗ «О персональных данных»
                                и определяет порядок обработки персональных данных и меры по обеспечению безопасности
                                персональных данных в FixDesk (далее — Оператор, мы, нас, наш).
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7 }}>
                                Оператор ставит своей важнейшей целью и условием осуществления своей деятельности
                                соблюдение прав и свобод человека и гражданина при обработке его персональных данных,
                                в том числе защиты прав на неприкосновенность частной жизни, личную и семейную тайну.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                2. Основные понятия (ФЗ-152)
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, lineHeight: 1.7 }}>
                                <li><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определенному или определяемому физическому лицу (субъекту персональных данных)</li>
                                <li><strong>Оператор персональных данных</strong> — государственный орган, муниципальный орган, юридическое или физическое лицо, организующие и (или) осуществляющие обработку персональных данных</li>
                                <li><strong>Обработка персональных данных</strong> — любое действие с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение, извлечение, использование, передачу, обезличивание, блокирование, удаление, уничтожение</li>
                                <li><strong>Конфиденциальность персональных данных</strong> — обязательное для соблюдения Оператором требование не допускать их распространения без согласия субъекта персональных данных</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                2. Какие данные мы собираем
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                Мы собираем следующую информацию:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3 }}>
                                <li><strong>Учетные данные:</strong> email, имя, фамилия, должность</li>
                                <li><strong>Пароль:</strong> хранится в зашифрованном виде (bcrypt)</li>
                                <li><strong>Данные OAuth:</strong> информация из Google, Яндекс, GitHub, Telegram при авторизации через эти сервисы</li>
                                <li><strong>Аватары:</strong> изображения профиля пользователей</li>
                                <li><strong>Рабочие данные:</strong> проекты, задачи, баги, комментарии, файлы</li>
                                <li><strong>История активности:</strong> действия пользователей в системе</li>
                                <li><strong>Технические данные:</strong> IP-адрес, браузер, время доступа (логи сервера)</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                3. Правовые основания обработки персональных данных
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                Оператор обрабатывает персональные данные на следующих правовых основаниях:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, lineHeight: 1.7 }}>
                                <li>Согласие субъекта персональных данных на обработку его персональных данных (ст. 9 ФЗ-152)</li>
                                <li>Исполнение договора, стороной которого является субъект персональных данных</li>
                                <li>Достижение целей, предусмотренных законодательством РФ</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                4. Цели обработки персональных данных
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                Персональные данные обрабатываются в следующих целях:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, lineHeight: 1.7 }}>
                                <li>Предоставление доступа к функционалу системы управления проектами, задачами и багами</li>
                                <li>Идентификация и аутентификация пользователя</li>
                                <li>Связь с пользователем для направления уведомлений, запросов и информации</li>
                                <li>Улучшение качества и функционала сервиса</li>
                                <li>Проведение статистических и иных исследований</li>
                                <li>Обеспечение информационной безопасности</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                5. Категории и состав персональных данных
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                Оператор обрабатывает следующие категории персональных данных:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, lineHeight: 1.7 }}>
                                <li><strong>Идентификационные данные:</strong> фамилия, имя, email</li>
                                <li><strong>Профессиональные данные:</strong> должность, место работы</li>
                                <li><strong>Данные аутентификации:</strong> пароль (хранится в хешированном виде с использованием bcrypt), токены доступа</li>
                                <li><strong>Данные OAuth-провайдеров:</strong> идентификатор пользователя, имя, фотография (при авторизации через Google, Яндекс, GitHub, Telegram)</li>
                                <li><strong>Изображения:</strong> аватар пользователя, файлы, прикрепленные к задачам</li>
                                <li><strong>Рабочие данные:</strong> проекты, задачи, комментарии, история изменений</li>
                                <li><strong>Технические данные:</strong> IP-адрес, информация о браузере, cookie-файлы, логи действий</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                6. Порядок и условия обработки персональных данных
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                Обработка персональных данных осуществляется с соблюдением следующих принципов:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, lineHeight: 1.7 }}>
                                <li>Обработка осуществляется на законной и справедливой основе</li>
                                <li>Обработка ограничивается достижением конкретных, заранее определенных целей</li>
                                <li>Не допускается объединение баз данных, содержащих персональные данные, обработка которых осуществляется в целях, несовместимых между собой</li>
                                <li>Обработке подлежат только персональные данные, которые отвечают целям их обработки</li>
                                <li>Содержание и объем обрабатываемых персональных данных соответствуют заявленным целям обработки</li>
                                <li>При обработке обеспечивается точность персональных данных, их достаточность и актуальность</li>
                                <li>Хранение осуществляется в форме, позволяющей определить субъекта персональных данных, не дольше, чем этого требуют цели обработки</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                4. Обмен данными с третьими лицами
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                Мы можем передавать данные:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3 }}>
                                <li><strong>OAuth провайдеры:</strong> Google, Яндекс, GitHub, Telegram (только при использовании авторизации через них)</li>
                                <li><strong>Email сервис:</strong> для отправки уведомлений и восстановления пароля</li>
                                <li><strong>Хостинг провайдер:</strong> для размещения данных на сервере</li>
                            </Box>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mt: 1 }}>
                                Мы <strong>не продаем</strong> ваши персональные данные третьим лицам.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                5. Как мы защищаем данные
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3 }}>
                                <li>Пароли хранятся в зашифрованном виде (bcrypt с солью)</li>
                                <li>Используется HTTPS для защиты передачи данных</li>
                                <li>Регулярное резервное копирование</li>
                                <li>Ограниченный доступ к серверам и базе данных</li>
                                <li>Логирование действий для аудита безопасности</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                6. Cookies и технологии отслеживания
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7 }}>
                                Мы используем localStorage для хранения токена аутентификации и настроек пользователя.
                                Эти данные хранятся только в вашем браузере и используются для работы приложения.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                7. Ваши права
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                Вы имеете право:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3 }}>
                                <li><strong>Доступ:</strong> просматривать свои данные в профиле</li>
                                <li><strong>Изменение:</strong> редактировать свою информацию в настройках</li>
                                <li><strong>Удаление:</strong> удалить свой аккаунт и все связанные данные</li>
                                <li><strong>Экспорт:</strong> получить копию своих данных</li>
                                <li><strong>Отзыв согласия:</strong> отключить уведомления или удалить аккаунт</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                8. Срок хранения данных
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7 }}>
                                Мы храним ваши данные до тех пор, пока ваш аккаунт активен или пока это необходимо
                                для предоставления услуг. При удалении аккаунта все персональные данные удаляются
                                в течение 30 дней. Некоторые данные могут храниться дольше в соответствии с
                                законодательными требованиями.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                9. Дети
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7 }}>
                                Наш сервис не предназначен для лиц младше 16 лет. Мы сознательно не собираем
                                персональные данные детей. Если вы родитель и обнаружили, что ваш ребенок
                                предоставил нам данные, свяжитесь с нами для их удаления.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                10. Международная передача данных
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7 }}>
                                Ваши данные могут обрабатываться на серверах, расположенных за пределами вашей
                                страны. Мы принимаем меры для обеспечения адекватной защиты данных при такой передаче.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                11. Изменения в политике
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7 }}>
                                Мы можем обновлять эту политику конфиденциальности время от времени. Мы уведомим
                                вас о существенных изменениях через email или уведомление в системе. Дата последнего
                                обновления указана в начале документа.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                12. Контактная информация Оператора (ФЗ-152)
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                По вопросам обработки персональных данных Вы можете обратиться к Оператору:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, lineHeight: 1.7 }}>
                                <li><strong>Email для вопросов по персональным данным:</strong> privacy@fixdesk.ru</li>
                                <li><strong>Email технической поддержки:</strong> support@fixdesk.ru</li>
                                <li><strong>Юридический адрес:</strong> Россия, [укажите юридический адрес организации]</li>
                                <li><strong>ОГРН/ИНН:</strong> [укажите регистрационные данные после регистрации ЮЛ/ИП]</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                13. Права субъекта персональных данных (ст. 14 ФЗ-152)
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                В соответствии с ФЗ-152, Вы имеете следующие права:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, lineHeight: 1.7 }}>
                                <li>Получать информацию, касающуюся обработки ваших персональных данных</li>
                                <li>Требовать уточнения, блокирования или уничтожения персональных данных в случае, если они являются неполными, устаревшими, неточными, незаконно полученными</li>
                                <li>Отозвать согласие на обработку персональных данных</li>
                                <li>Обжаловать действия или бездействие Оператора в Роскомнадзор или в судебном порядке</li>
                                <li>Требовать возмещения убытков и компенсации морального вреда в случае нарушения ваших прав</li>
                            </Box>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mt: 2 }}>
                                <strong>Для реализации своих прав:</strong>
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, lineHeight: 1.7 }}>
                                <li>Отправьте запрос на privacy@fixdesk.ru с указанием своих требований</li>
                                <li>Приложите документ, удостоверяющий личность (при необходимости)</li>
                                <li>Мы обязаны ответить на ваш запрос в течение 30 дней</li>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                14. Согласие на обработку персональных данных
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mb: 1 }}>
                                Регистрируясь в сервисе FixDesk и отмечая соответствующий чекбокс, Вы подтверждаете, что:
                            </Typography>
                            <Box component="ul" sx={{ color: '#a5a5ba', pl: 3, lineHeight: 1.7 }}>
                                <li>Ознакомились с настоящей Политикой конфиденциальности</li>
                                <li>Даете свое добровольное согласие на обработку персональных данных в соответствии с условиями настоящей Политики</li>
                                <li>Понимаете свои права как субъекта персональных данных</li>
                                <li>Достигли возраста 18 лет или получили согласие законного представителя</li>
                                <li>Понимаете, что можете отозвать согласие в любое время</li>
                            </Box>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mt: 2 }}>
                                Согласие действует с момента регистрации до момента его отзыва субъектом персональных данных или до момента удаления аккаунта.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                15. Трансграничная передача данных (ст. 12 ФЗ-152)
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7 }}>
                                Оператор осуществляет трансграничную передачу персональных данных только при использовании
                                OAuth-провайдеров (Google, GitHub, Telegram). При этом Оператор убеждается в наличии
                                адекватной защиты прав субъектов персональных данных в соответствующих иностранных
                                государствах. Трансграничная передача осуществляется только с вашего согласия при
                                выборе соответствующего способа авторизации.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                16. Обезличивание и уничтожение персональных данных
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7 }}>
                                При достижении целей обработки или при отзыве согласия персональные данные подлежат
                                удалению или обезличиванию в течение 30 календарных дней. Обезличенные данные могут
                                использоваться для статистических целей без возможности идентификации субъекта.
                            </Typography>
                        </Box>

                        <Box sx={{ bgcolor: '#212529', borderRadius: 2, p: 3, border: '1px solid #32324d' }}>
                            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                                ⚖️ Важная информация о соответствии ФЗ-152
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7 }}>
                                Настоящая Политика конфиденциальности разработана в соответствии с требованиями
                                Федерального закона №152-ФЗ «О персональных данных». Оператор обязуется обеспечивать
                                конфиденциальность и безопасность персональных данных при их обработке.
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#a5a5ba', lineHeight: 1.7, mt: 2 }}>
                                <strong>Регуляторный орган:</strong> Роскомнадзор (Федеральная служба по надзору в сфере связи,
                                информационных технологий и массовых коммуникаций)
                            </Typography>
                        </Box>


                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default PrivacyPolicy;

