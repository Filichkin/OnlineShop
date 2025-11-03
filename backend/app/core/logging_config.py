"""
Конфигурация системы логирования с использованием Loguru.

Предоставляет структурированное логирование с различными уровнями
для разработки и продакшена.
"""
import logging
import sys
from pathlib import Path

from loguru import logger

from app.core.config import settings


def configure_logging(environment: str = 'development') -> None:
    """
    Настройка системы логирования Loguru.

    Настраивает:
    - Консольный хендлер с цветами для разработки
    - Ротацию файлов логов
    - Отдельный файл для ошибок
    - Соответствующие уровни логирования в зависимости от окружения

    Args:
        environment: Окружение ('development' или 'production')
    """
    # Удаляем дефолтный хендлер
    logger.remove()

    # Создаем директорию для логов если не существует
    logs_dir = Path('logs')
    logs_dir.mkdir(exist_ok=True)

    # Консольный хендлер
    if environment == 'development':
        # Разработка: цветные логи с подробным форматом
        logger.add(
            sys.stdout,
            format=(
                '<green>{time:YYYY-MM-DD HH:mm:ss}</green> | '
                '<level>{level: <8}</level> | '
                '<cyan>{name}</cyan>:<cyan>{function}</cyan>:'
                '<cyan>{line}</cyan> - '
                '<level>{message}</level>'
            ),
            level='DEBUG',
            colorize=True,
            backtrace=True,
            diagnose=True
        )
    else:
        # Продакшен: простой формат без цветов
        logger.add(
            sys.stdout,
            format=(
                '{time:YYYY-MM-DD HH:mm:ss} | '
                '{level: <8} | '
                '{name}:{function}:{line} - '
                '{message}'
            ),
            level='INFO',
            colorize=False,
            backtrace=False,
            diagnose=False
        )

    # Файловый хендлер с ротацией (все логи)
    logger.add(
        'logs/app_{time:YYYY-MM-DD}.log',
        rotation='00:00',  # Новый файл в полночь
        retention='30 days',  # Хранить 30 дней
        compression='zip',  # Сжимать старые логи
        level='INFO',
        format=(
            '{time:YYYY-MM-DD HH:mm:ss} | '
            '{level: <8} | '
            '{name}:{function}:{line} - '
            '{message}'
        ),
        encoding='utf-8',
        enqueue=True,  # Асинхронная запись
        backtrace=True,
        diagnose=False
    )

    # Файловый хендлер для ошибок
    logger.add(
        'logs/error_{time:YYYY-MM-DD}.log',
        rotation='00:00',
        retention='90 days',  # Хранить ошибки дольше
        compression='zip',
        level='ERROR',
        format=(
            '{time:YYYY-MM-DD HH:mm:ss} | '
            '{level: <8} | '
            '{name}:{function}:{line} - '
            '{message}\n'
            '{exception}'
        ),
        encoding='utf-8',
        enqueue=True,
        backtrace=True,
        diagnose=True
    )

    # Снижаем шум от сторонних библиотек
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('asyncio').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)

    logger.info(
        f'Система логирования настроена для окружения: {environment}'
    )


class InterceptHandler(logging.Handler):
    """
    Хендлер для перехвата стандартных логов Python и перенаправления
    их в Loguru.

    Используется для интеграции с uvicorn и другими библиотеками,
    использующими стандартный logging.
    """

    def emit(self, record: logging.LogRecord) -> None:
        """
        Обработка записи лога из стандартного logging.

        Args:
            record: Запись лога из стандартной библиотеки logging
        """
        # Получаем соответствующий уровень Loguru
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Находим вызывающий код
        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(
            depth=depth,
            exception=record.exc_info
        ).log(level, record.getMessage())


def setup_logging() -> None:
    """
    Инициализация системы логирования.

    Настраивает Loguru и перехватывает логи от uvicorn.
    """
    # Настраиваем Loguru
    configure_logging(settings.environment)

    # Перехватываем логи uvicorn
    logging.getLogger('uvicorn').handlers = [InterceptHandler()]
    logging.getLogger('uvicorn.access').handlers = [InterceptHandler()]
    logging.getLogger('uvicorn.error').handlers = [InterceptHandler()]

    # Перехватываем логи FastAPI
    logging.getLogger('fastapi').handlers = [InterceptHandler()]
