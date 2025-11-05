from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re
import secrets
import smtplib
import string

from loguru import logger

from app.core.config import settings
from app.core.constants import Constants


def generate_password_by_pattern() -> str:
    """
    Генерирует пароль по паттерну из настроек.

    Returns:
        str: Сгенерированный пароль, соответствующий password_pattern
    """
    # Извлекаем требования из паттерна
    # Паттерн: r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'

    # Минимальная длина из паттерна (8 символов)
    # Паттерн требует минимум 8 символов, поэтому используем
    # max(8, settings.user_password_min_len)
    min_length = max(8, Constants.USER_PASSWORD_MIN_LEN)

    # Символы для генерации
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special_chars = '@$!%*?&'

    # Объединяем все допустимые символы
    all_chars = lowercase + uppercase + digits + special_chars

    # Максимальное количество попыток для генерации валидного пароля
    max_attempts = 100

    for attempt in range(max_attempts):
        # Генерируем пароль с гарантированным наличием всех типов символов
        password_chars = []

        # Добавляем по одному символу каждого типа
        password_chars.append(secrets.choice(lowercase))
        password_chars.append(secrets.choice(uppercase))
        password_chars.append(secrets.choice(digits))
        password_chars.append(secrets.choice(special_chars))

        # Заполняем остальную длину случайными символами
        for _ in range(min_length - 4):
            password_chars.append(secrets.choice(all_chars))

        # Перемешиваем символы
        secrets.SystemRandom().shuffle(password_chars)

        password = ''.join(password_chars)

        # Проверяем соответствие паттерну
        if re.match(Constants.PASSWORD_PATTERN, password):
            return password

    # Если не удалось сгенерировать валидный пароль за max_attempts попыток
    # Это не должно произойти при правильной работе алгоритма
    # В качестве fallback генерируем безопасный пароль вручную
    raise RuntimeError(
        f'Failed to generate valid password after {max_attempts} attempts. '
        'This indicates a problem with the password generation algorithm.'
    )


class EmailService:
    """Сервис для отправки email сообщений"""

    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.email = settings.yandex_email
        self.password = settings.yandex_app_pass

    async def send_password_reset_email(
        self,
        to_email: str,
        new_password: str,
        user_name: str
    ) -> bool:
        """
        Отправляет email с новым паролем пользователю.

        Args:
            to_email: Email получателя
            new_password: Новый пароль
            user_name: Имя пользователя

        Returns:
            bool: True если email отправлен успешно, False иначе
        """
        try:
            # Создаем сообщение
            msg = MIMEMultipart()
            msg['From'] = self.email
            msg['To'] = to_email
            msg['Subject'] = 'Сброс пароля - SA_RAG Agent'

            # Создаем тело письма
            body = f'''
Добро пожаловать, {user_name}!

Ваш пароль был сброшен. Используйте новый пароль для входа:

Новый пароль: {new_password}

ВАЖНО:
- Сохраните этот пароль в безопасном месте
- После входа рекомендуем сменить пароль в настройках профиля
- Все ваши активные сессии были завершены

Если вы не запрашивали сброс пароля, немедленно свяжитесь с
администратором.

С уважением,
Команда Ecom Market
'''

            msg.attach(MIMEText(body, 'plain', 'utf-8'))

            # Подключаемся к серверу и отправляем
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.email, self.password)
                server.send_message(msg)

            return True

        except Exception as e:
            logger.exception(
                f'Ошибка отправки email для сброса пароля: {e}'
            )
            return False

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str
    ) -> bool:
        """
        Общий метод для отправки email.

        Args:
            to_email: Email получателя
            subject: Тема письма
            body: Тело письма

        Returns:
            bool: True если email отправлен успешно, False иначе
        """
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'plain', 'utf-8'))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.email, self.password)
                server.send_message(msg)

            return True

        except Exception as e:
            logger.exception(f'Ошибка отправки email: {e}')
            return False


# Создаем экземпляр сервиса
email_service = EmailService()
