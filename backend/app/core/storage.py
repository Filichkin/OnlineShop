from pathlib import Path
import shutil
from typing import List
import uuid

from fastapi import UploadFile

from app.core.config import Constants


Constants.PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)
Constants.CATEGORIES_DIR.mkdir(parents=True, exist_ok=True)


def validate_image(file: UploadFile) -> None:
    """Валидация изображения"""
    ext = Path(file.filename).suffix.lower()
    if ext not in Constants.ALLOWED_EXTENSIONS:
        raise ValueError(
            f'Invalid file format. Allowed: '
            f'{', '.join(Constants.ALLOWED_EXTENSIONS)}'
        )

    if not file.content_type.startswith('image/'):
        raise ValueError('File must be an image')


async def save_image(
    file: UploadFile,
    directory: Path,
    prefix: str = ''
) -> str:
    """
    Сохраняет изображение и возвращает URL

    Args:
        file: Загружаемый файл
        directory: Директория для сохранения
        prefix: Префикс имени файла

    Returns:
        str: URL путь к файлу
    """
    validate_image(file)

    # Генерируем уникальное имя
    ext = Path(file.filename).suffix.lower()
    filename = f'{prefix}_{uuid.uuid4().hex}{ext}'
    file_path = directory / filename

    # Сохраняем файл
    with file_path.open('wb') as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Возвращаем относительный URL
    relative_path = file_path.relative_to(Constants.UPLOAD_DIR)
    return f'{Constants.UPLOAD_DIR}/{relative_path.as_posix()}'


async def save_images(
    files: List[UploadFile],
    directory: Path,
    prefix: str = ''
) -> List[str]:
    """Сохраняет несколько изображений"""
    urls = []
    for idx, file in enumerate(files):
        url = await save_image(file, directory, f'{prefix}_{idx}')
        urls.append(url)
    return urls
