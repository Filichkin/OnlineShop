"""
Утилиты для управления базой данных.

Включает функции для сброса и пересоздания таблиц.
"""
import asyncio
from typing import Optional

from loguru import logger
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import AsyncSessionLocal, Base, engine


async def drop_all_tables(
    session: Optional[AsyncSession] = None
) -> None:
    """
    Удаляет все таблицы из базы данных.

    ВНИМАНИЕ: Это необратимая операция!
    Все данные будут потеряны.

    Args:
        session: Опциональная сессия БД. Если не указана,
                создается новая.

    Example:
        # Использование с существующей сессией
        async with AsyncSessionLocal() as session:
            await drop_all_tables(session)

        # Или без сессии (создастся автоматически)
        await drop_all_tables()
    """
    close_session = False

    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        logger.warning('Начало удаления всех таблиц из базы данных...')

        # Используем метаданные SQLAlchemy для получения всех таблиц
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

        logger.info('Все таблицы успешно удалены')

    except Exception as e:
        logger.error(f'Ошибка при удалении таблиц: {e}')
        raise

    finally:
        if close_session:
            await session.close()


async def create_all_tables(
    session: Optional[AsyncSession] = None
) -> None:
    """
    Создает все таблицы в базе данных на основе моделей SQLAlchemy.

    Args:
        session: Опциональная сессия БД. Если не указана,
                создается новая.

    Example:
        # Использование с существующей сессией
        async with AsyncSessionLocal() as session:
            await create_all_tables(session)

        # Или без сессии (создастся автоматически)
        await create_all_tables()
    """
    close_session = False

    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        logger.info('Начало создания всех таблиц в базе данных...')

        # Создаем таблицы на основе метаданных SQLAlchemy
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info('Все таблицы успешно созданы')

    except Exception as e:
        logger.error(f'Ошибка при создании таблиц: {e}')
        raise

    finally:
        if close_session:
            await session.close()


async def reset_database(
    session: Optional[AsyncSession] = None
) -> None:
    """
    Полностью сбрасывает базу данных: удаляет все таблицы
    и создает их заново.

    ВНИМАНИЕ: Это необратимая операция!
    Все данные будут потеряны.

    Args:
        session: Опциональная сессия БД. Если не указана,
                создается новая.

    Example:
        await reset_database()
    """
    close_session = False

    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        logger.warning('Начало полного сброса базы данных...')

        # Удаляем все таблицы
        await drop_all_tables(session)

        # Создаем таблицы заново
        await create_all_tables(session)

        logger.info('База данных успешно сброшена и пересоздана')

    except Exception as e:
        logger.error(f'Ошибка при сбросе базы данных: {e}')
        raise

    finally:
        if close_session:
            await session.close()


async def check_database_exists() -> bool:
    """
    Проверяет существование базы данных и таблиц.

    Returns:
        True если таблицы существуют, иначе False
    """
    try:
        async with AsyncSessionLocal() as session:
            # Пытаемся выполнить простой запрос
            result = await session.execute(
                text('SELECT 1')
            )
            result.scalar()
            logger.info('База данных доступна')
            return True

    except Exception as e:
        logger.warning(f'База данных недоступна: {e}')
        return False


# CLI функция для запуска из командной строки
async def main():
    """
    Главная функция для запуска сброса БД из командной строки.

    Usage:
        python -m app.utils.db_reset
    """
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == 'drop':
            logger.warning('Выполнение команды: Удаление всех таблиц')
            await drop_all_tables()

        elif command == 'create':
            logger.info('Выполнение команды: Создание всех таблиц')
            await create_all_tables()

        elif command == 'reset':
            logger.warning('Выполнение команды: Полный сброс БД')
            await reset_database()

        elif command == 'check':
            logger.info('Выполнение команды: Проверка БД')
            exists = await check_database_exists()
            print(f'База данных существует: {exists}')

        else:
            print('Неизвестная команда. Доступные команды:')
            print('  drop   - Удалить все таблицы')
            print('  create - Создать все таблицы')
            print('  reset  - Полный сброс БД (drop + create)')
            print('  check  - Проверить доступность БД')
            sys.exit(1)
    else:
        print('Использование: python -m app.utils.db_reset <команда>')
        print('Доступные команды:')
        print('  drop   - Удалить все таблицы')
        print('  create - Создать все таблицы')
        print('  reset  - Полный сброс БД (drop + create)')
        print('  check  - Проверить доступность БД')
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
