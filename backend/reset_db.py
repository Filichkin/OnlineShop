#!/usr/bin/env python
"""
Скрипт для сброса базы данных.

Использование:
    python reset_db.py           # Полный сброс БД
    python reset_db.py drop      # Только удалить таблицы
    python reset_db.py create    # Только создать таблицы
    python reset_db.py check     # Проверить БД
"""
import asyncio
import sys

from app.utils.db_reset import (
    check_database_exists,
    create_all_tables,
    drop_all_tables,
    reset_database,
)


async def main():
    """Главная функция скрипта."""
    command = sys.argv[1] if len(sys.argv) > 1 else 'reset'

    if command == 'drop':
        print('Удаление всех таблиц из базы данных...')
        await drop_all_tables()
        print('Готово!')

    elif command == 'create':
        print('Создание всех таблиц в базе данных...')
        await create_all_tables()
        print('Готово!')

    elif command == 'reset':
        print('Полный сброс базы данных...')
        print('ВНИМАНИЕ: Все данные будут удалены!')
        response = input('Продолжить? (yes/no): ')

        if response.lower() in ['yes', 'y', 'да']:
            await reset_database()
            print('Готово!')
        else:
            print('Операция отменена')

    elif command == 'check':
        print('Проверка базы данных...')
        exists = await check_database_exists()
        print(f'База данных существует: {exists}')

    else:
        print('Неизвестная команда.')
        print('Использование:')
        print('  python reset_db.py         - Полный сброс БД')
        print('  python reset_db.py drop    - Удалить все таблицы')
        print('  python reset_db.py create  - Создать все таблицы')
        print('  python reset_db.py check   - Проверить БД')
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
