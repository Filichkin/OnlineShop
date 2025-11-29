import os
import uuid
from io import BytesIO
from pathlib import Path
from typing import List

import magic
from fastapi import UploadFile, HTTPException
from loguru import logger
from PIL import Image

from app.core.constants import Constants


Constants.PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)
Constants.CATEGORIES_DIR.mkdir(parents=True, exist_ok=True)


def validate_file_size(file: UploadFile) -> None:
    """
    Validate file size to prevent DoS attacks

    Args:
        file: File to validate

    Raises:
        HTTPException: If file size is invalid
    """
    # Seek to end to get file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size < Constants.MIN_IMAGE_SIZE:
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=f'File is too small. Minimum size: '
            f'{Constants.MIN_IMAGE_SIZE} bytes'
        )

    if file_size > Constants.MAX_IMAGE_SIZE:
        max_size_mb = Constants.MAX_IMAGE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=Constants.HTTP_413_PAYLOAD_TOO_LARGE,
            detail=f'File is too large. Maximum size: {max_size_mb}MB'
        )


def validate_mime_type(file_content: bytes, filename: str) -> None:
    """
    Validate MIME type using magic numbers (file signatures)

    Args:
        file_content: First bytes of file content
        filename: Original filename for additional validation

    Raises:
        HTTPException: If MIME type is not allowed
    """
    # Detect MIME type from file content using magic numbers
    mime = magic.Magic(mime=True)
    detected_mime = mime.from_buffer(file_content)

    if detected_mime not in Constants.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=(
                f'Invalid file type: {detected_mime}. '
                f'Allowed types: {", ".join(Constants.ALLOWED_MIME_TYPES)}'
            )
        )


def validate_and_process_image(file: UploadFile) -> bytes:
    """
    Comprehensive image validation and processing with Pillow.

    This function protects against:
    - Zip bombs (decompression bombs)
    - Polyglot attacks (files that are valid as multiple formats)
    - Malicious metadata
    - Oversized images

    Args:
        file: File to validate and process

    Returns:
        bytes: Processed image content (re-encoded, metadata stripped)

    Raises:
        HTTPException: If validation fails
    """
    # Validate file size BEFORE loading into memory
    validate_file_size(file)

    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in Constants.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=(
                f'Invalid file extension: {ext}. '
                f'Allowed: {", ".join(Constants.ALLOWED_EXTENSIONS)}'
            )
        )

    # Validate content type header (basic check)
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='File must be an image'
        )

    # Read file content
    file_content = file.file.read()
    file.file.seek(0)  # Reset for later use

    # Validate MIME type using magic numbers
    validate_mime_type(file_content[:2048], file.filename)

    # PIL validation and processing
    try:
        # Open image with PIL
        img = Image.open(BytesIO(file_content))

        # Verify image integrity (detects truncated/corrupted images)
        img.verify()

        # Re-open image (verify() closes it)
        img = Image.open(BytesIO(file_content))

        # Check image dimensions to prevent zip bombs
        width, height = img.size
        max_pixels = 25_000_000  # 25 megapixels
        if width * height > max_pixels:
            raise HTTPException(
                status_code=Constants.HTTP_400_BAD_REQUEST,
                detail=(
                    f'Image dimensions too large: {width}x{height}. '
                    f'Maximum {max_pixels} pixels allowed'
                )
            )

        # Determine output format
        output_format = 'JPEG' if ext in ['.jpg', '.jpeg'] else 'PNG'

        # Re-encode image to strip metadata and ensure valid format
        # This prevents polyglot attacks and removes EXIF data
        output_buffer = BytesIO()
        if output_format == 'JPEG':
            # Convert RGBA to RGB for JPEG (no alpha channel)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            img.save(
                output_buffer,
                format=output_format,
                quality=95,
                optimize=True
            )
        else:
            # PNG - keep transparency if present
            img.save(
                output_buffer,
                format=output_format,
                optimize=True
            )

        processed_content = output_buffer.getvalue()

        # Validate processed size doesn't exceed limits
        if len(processed_content) > Constants.MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=Constants.HTTP_413_PAYLOAD_TOO_LARGE,
                detail='Processed image exceeds maximum size'
            )

        return processed_content

    except HTTPException:
        raise
    except Exception as e:
        logger.warning(
            f'Image validation failed for {file.filename}: {str(e)}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=f'Invalid or corrupted image file: {str(e)}'
        )


def validate_image(file: UploadFile) -> None:
    """
    Comprehensive image validation (legacy wrapper).

    This function is kept for backward compatibility.
    New code should use validate_and_process_image().

    Args:
        file: File to validate

    Raises:
        HTTPException: If validation fails
    """
    # Validate file size
    validate_file_size(file)

    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in Constants.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=(
                f'Invalid file extension: {ext}. '
                f'Allowed: {", ".join(Constants.ALLOWED_EXTENSIONS)}'
            )
        )

    # Validate content type header (basic check)
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='File must be an image'
        )

    # Read first bytes to validate MIME type using magic numbers
    file_header = file.file.read(2048)
    file.file.seek(0)  # Reset to beginning

    validate_mime_type(file_header, file.filename)


def generate_secure_filename(original_filename: str, prefix: str = '') -> str:
    """
    Generate a secure filename to prevent path traversal attacks

    Args:
        original_filename: Original user-provided filename
        prefix: Optional prefix for the filename

    Returns:
        str: Secure filename with UUID
    """
    # Extract only the extension from original filename
    ext = Path(original_filename).suffix.lower()

    # Validate extension is allowed
    if ext not in Constants.ALLOWED_EXTENSIONS:
        ext = '.jpg'  # Default to .jpg if invalid

    # Generate UUID-based filename
    unique_id = uuid.uuid4().hex

    if prefix:
        # Sanitize prefix: remove special characters
        safe_prefix = ''.join(
            c for c in prefix if c.isalnum() or c in ('_', '-')
        )
        return f'{safe_prefix}_{unique_id}{ext}'

    return f'{unique_id}{ext}'


def validate_path_safety(file_path: Path, allowed_directory: Path) -> None:
    """
    Validate that file path stays within allowed directory

    Args:
        file_path: Path to validate
        allowed_directory: Directory that should contain the file

    Raises:
        HTTPException: If path traversal detected
    """
    # Resolve to absolute paths
    abs_file_path = file_path.resolve()
    abs_allowed_dir = allowed_directory.resolve()

    # Check if file path is within allowed directory
    try:
        abs_file_path.relative_to(abs_allowed_dir)
    except ValueError:
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='Invalid file path: path traversal detected'
        )


async def save_image(
    file: UploadFile,
    directory: Path,
    prefix: str = ''
) -> str:
    """
    Securely save image and return URL.

    Uses enhanced validation via Pillow to protect against:
    - Zip bombs
    - Polyglot attacks
    - Malicious metadata

    Args:
        file: Uploaded file
        directory: Directory to save to
        prefix: Prefix for filename

    Returns:
        str: URL path to file

    Raises:
        HTTPException: If validation fails or save error occurs
    """
    # Validate and process image (strips metadata, re-encodes)
    processed_content = validate_and_process_image(file)

    # Generate secure filename (prevents path traversal)
    filename = generate_secure_filename(file.filename, prefix)
    file_path = directory / filename

    # Validate path safety (double-check against path traversal)
    validate_path_safety(file_path, directory)

    try:
        # Save processed image
        with file_path.open('wb') as buffer:
            buffer.write(processed_content)

    except Exception as e:
        # Clean up on error
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=f'Failed to save file: {str(e)}'
        )
    finally:
        # Always close the file
        await file.close()

    # Return relative URL
    relative_path = file_path.relative_to(Constants.UPLOAD_DIR)
    return f'{Constants.UPLOAD_DIR}/{relative_path.as_posix()}'


async def save_images(
    files: List[UploadFile],
    directory: Path,
    prefix: str = ''
) -> List[str]:
    """
    Save multiple images securely

    Args:
        files: List of uploaded files
        directory: Directory to save to
        prefix: Prefix for filenames

    Returns:
        List[str]: List of URL paths

    Raises:
        HTTPException: If any validation fails
    """
    urls = []
    saved_paths = []

    try:
        for idx, file in enumerate(files):
            url = await save_image(file, directory, f'{prefix}_{idx}')
            urls.append(url)
            saved_paths.append(directory / Path(url).name)
        return urls
    except Exception as e:
        # Clean up any files that were saved before the error
        for saved_path in saved_paths:
            saved_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=f'Failed to save files: {str(e)}'
        )


async def delete_image_file(url: str) -> None:
    """
    Delete an image file from disk given its URL

    This function safely deletes image files from the filesystem,
    with proper validation to prevent path traversal attacks.
    Errors are logged but not raised to avoid failing the main operation.

    Args:
        url: The URL path to the image file (e.g., 'media/products/image.jpg')

    Returns:
        None

    Note:
        - File must be within allowed directories
        (PRODUCTS_DIR or CATEGORIES_DIR)
        - Errors are logged but do not raise exceptions
        - Call this AFTER successful database commit
    """
    try:
        # Parse URL to get file path
        # URL format: 'media/products/filename.jpg'
        # or 'media/categories/filename.jpg'
        file_path = Path(url)

        # Validate that the URL starts with our upload directory
        if not url.startswith(str(Constants.UPLOAD_DIR)):
            logger.warning(
                f'Попытка удаления файла вне директории загрузки: {url}'
            )
            return
        # Check if file path exists
        if not file_path.exists():
            logger.info(f'Файл уже удален или не существует: {url}')
            return

        # Validate file is within allowed directories
        abs_file_path = file_path.resolve()
        abs_products_dir = Constants.PRODUCTS_DIR.resolve()
        abs_categories_dir = Constants.CATEGORIES_DIR.resolve()

        # Check if file is in products or categories directory
        is_in_products = False
        is_in_categories = False

        try:
            abs_file_path.relative_to(abs_products_dir)
            is_in_products = True
        except ValueError:
            pass

        try:
            abs_file_path.relative_to(abs_categories_dir)
            is_in_categories = True
        except ValueError:
            pass

        if not (is_in_products or is_in_categories):
            logger.warning(
                f'Попытка удаления файла вне разрешенных директорий: {url}'
            )
            return

        # Delete the file
        file_path.unlink(missing_ok=True)
        logger.info(f'Файл изображения успешно удален: {url}')

    except Exception as e:
        # Log error but don't raise
        logger.error(
            f'Ошибка удаления файла изображения {url}: {str(e)}'
        )


async def delete_image_files(urls: List[str]) -> None:
    """
    Delete multiple image files from disk

    Args:
        urls: List of URL paths to image files

    Returns:
        None
    """
    for url in urls:
        await delete_image_file(url)
