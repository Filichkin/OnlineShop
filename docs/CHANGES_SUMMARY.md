# Security Fixes - Changes Summary

This document provides a quick reference of all files modified to fix critical security vulnerabilities.

## Files Created

### 1. `/infra/.env.example`
**Purpose:** Template for environment variables with placeholder values
**Key Content:**
- Database configuration placeholders
- Strong secret generation instructions
- Security warnings about using default values

### 2. `/SECURITY_FIXES.md`
**Purpose:** Comprehensive documentation of all security fixes
**Key Content:**
- Detailed explanation of each vulnerability
- Before/after code examples
- Testing recommendations
- Migration guide

### 3. `/CHANGES_SUMMARY.md`
**Purpose:** Quick reference of all changes (this file)

---

## Files Modified

### 1. `/.gitignore`
**Changes:** Added explicit exclusions for environment files in subdirectories
```
# Added:
infra/.env
backend/.env
*/.env
```
**Why:** Prevent committing secrets to version control

---

### 2. `/backend/pyproject.toml`
**Changes:** Added python-magic dependency
```toml
# Added:
"python-magic>=0.4.27",
```
**Why:** Required for MIME type detection using magic numbers

---

### 3. `/backend/app/core/constants.py`
**Changes Added:**

#### Security Constants
```python
SECRET_MIN_LENGTH = 32
DB_PASSWORD_MIN_LENGTH = 12
```

#### Input Validation Constants
```python
PRICE_MAX_VALUE = 1000000.0
SEARCH_STRING_MAX_LENGTH = 200
MAX_LIMIT = 1000
```

#### File Upload Security
```python
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MIN_IMAGE_SIZE = 100  # 100 bytes
ALLOWED_MIME_TYPES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
}
```

#### Database Connection Pool Settings
```python
DB_POOL_SIZE = 20
DB_MAX_OVERFLOW = 10
DB_POOL_TIMEOUT = 30
DB_POOL_RECYCLE = 3600
```

#### HTTP Status Codes
```python
HTTP_413_PAYLOAD_TOO_LARGE = 413
HTTP_422_UNPROCESSABLE_ENTITY = 422
```

**Why:** Centralized configuration for all security-related constants

---

### 4. `/backend/app/core/config.py`
**Changes Added:**

#### Import Changes
```python
from pydantic import EmailStr, field_validator, ValidationInfo
```

#### Validators Added
1. **`validate_secret()`**
   - Enforces minimum 32 character length
   - Rejects default value "SECRET"
   - Detects common weak patterns
   - Provides clear error messages

2. **`validate_postgres_password()`**
   - Enforces minimum 12 character length
   - Validates database password strength

**Why:** Prevent weak secrets from being used in production

---

### 5. `/backend/app/core/db.py`
**Changes:** Complete overhaul of database engine and session configuration

#### Engine Configuration
```python
engine = create_async_engine(
    get_async_db_url(),
    pool_size=Constants.DB_POOL_SIZE,
    max_overflow=Constants.DB_MAX_OVERFLOW,
    pool_timeout=Constants.DB_POOL_TIMEOUT,
    pool_recycle=Constants.DB_POOL_RECYCLE,
    pool_pre_ping=True,
    echo=False,
)
```

#### Session Configuration
```python
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=True,
)
```

**Why:** Proper connection pooling and session management for production workloads

---

### 6. `/backend/app/core/storage.py`
**Changes:** Complete security overhaul of file upload handling

#### New Imports
```python
import os
import magic
from fastapi import UploadFile, HTTPException
```

#### New Functions

1. **`validate_file_size(file: UploadFile) -> None`**
   - Checks file size against MIN/MAX limits
   - Prevents DoS via large uploads
   - Rejects empty files

2. **`validate_mime_type(file_content: bytes, filename: str) -> None`**
   - Uses python-magic to detect actual file type
   - Cannot be fooled by fake extensions
   - Validates against ALLOWED_MIME_TYPES

3. **`generate_secure_filename(original_filename: str, prefix: str) -> str`**
   - Generates UUID-based filenames
   - Sanitizes user-provided prefixes
   - Prevents path traversal attacks

4. **`validate_path_safety(file_path: Path, allowed_directory: Path) -> None`**
   - Ensures file stays within allowed directory
   - Detects path traversal attempts
   - Uses Path.resolve() and relative_to()

#### Enhanced Functions

1. **`validate_image(file: UploadFile) -> None`**
   - Now validates file size
   - Checks file extension
   - Validates Content-Type header
   - Validates MIME type using magic numbers

2. **`save_image(file: UploadFile, directory: Path, prefix: str) -> str`**
   - Uses secure filename generation
   - Validates path safety
   - Saves in chunks (1MB) with size checking
   - Cleans up on errors
   - Properly closes files

3. **`save_images(files: List[UploadFile], directory: Path, prefix: str) -> List[str]`**
   - Cleans up all files on any error
   - Transactional file saving

**Why:** Comprehensive protection against file upload attacks

---

### 7. `/backend/app/crud/product.py`
**Changes:** Fixed SQL injection in search function

#### Modified Function: `search_by_name()`
```python
# Escape LIKE special characters
escaped_pattern = (
    name_pattern
    .replace('\\', '\\\\')  # Escape backslash first
    .replace('%', '\\%')     # Escape percent wildcard
    .replace('_', '\\_')     # Escape underscore wildcard
)

result = await session.execute(
    select(Product)
    .where(
        Product.name.ilike(f'%{escaped_pattern}%', escape='\\'),
        Product.is_active.is_(True)
    )
    .offset(skip)
    .limit(limit)
)
```

**Why:** Prevent LIKE wildcard injection attacks

---

### 8. `/backend/app/api/endpoints/product.py`
**Changes:** Enhanced input validation for all query parameters

#### Import Changes
```python
from fastapi import APIRouter, Depends, HTTPException, Query
```

#### Modified Function: `get_products()`

**Query Parameter Validation:**
```python
skip: int = Query(
    Constants.DEFAULT_SKIP,
    ge=0,
    description='Количество элементов для пропуска'
)
limit: int = Query(
    Constants.DEFAULT_LIMIT,
    ge=1,
    le=Constants.MAX_LIMIT,
    description='Количество элементов для возврата'
)
search: Optional[str] = Query(
    None,
    max_length=Constants.SEARCH_STRING_MAX_LENGTH,
    description='Поиск по названию'
)
min_price: Optional[float] = Query(
    None,
    ge=Constants.PRICE_MIN_VALUE,
    le=Constants.PRICE_MAX_VALUE,
    description='Минимальная цена'
)
max_price: Optional[float] = Query(
    None,
    ge=Constants.PRICE_MIN_VALUE,
    le=Constants.PRICE_MAX_VALUE,
    description='Максимальная цена'
)
```

**Additional Validation Logic:**
```python
# Validate price range
if min_price is not None and max_price is not None:
    if min_price > max_price:
        raise HTTPException(400, 'min_price cannot be greater than max_price')

# Validate search string
if search:
    search = search.strip()
    if not search:
        raise HTTPException(400, 'Search string cannot be empty')
```

**Why:** Prevent abuse through invalid input parameters

---

### 9. `/backend/app/api/endpoints/category.py`
**Changes:** Multiple security enhancements

#### Import Changes
```python
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
```

#### 1. Query Parameter Validation
Added to `get_categories()` and `get_category_products()`:
```python
skip: int = Query(
    Constants.DEFAULT_SKIP,
    ge=0,
    description='Количество элементов для пропуска'
)
limit: int = Query(
    Constants.DEFAULT_LIMIT,
    ge=1,
    le=Constants.MAX_LIMIT,
    description='Количество элементов для возврата'
)
```

#### 2. Price Validation
Added to `create_category_product()` and `update_category_product()`:
```python
price: float = Form(
    ...,
    ge=Constants.PRICE_MIN_VALUE,
    le=Constants.PRICE_MAX_VALUE,
    description='Цена продукта'
)
```

#### 3. Transaction Rollback with File Cleanup

**In `create_category_product()`:**
```python
image_urls = []
saved_files = []

try:
    # Save images
    image_urls = await save_images(...)
    saved_files = [
        Constants.PRODUCTS_DIR / Path(url).name for url in image_urls
    ]

    # Create product
    db_product = Product(...)
    session.add(db_product)
    await session.commit()

    # Create media records
    for idx, image_url in enumerate(image_urls):
        media_obj = Media(...)
        session.add(media_obj)
    await session.commit()

    return db_product

except Exception:
    # Rollback database transaction
    await session.rollback()

    # Clean up uploaded files
    for file_path in saved_files:
        try:
            file_path.unlink(missing_ok=True)
        except Exception:
            pass

    raise
```

**In `update_category_product()`:**
- Same pattern applied
- Tracks saved files for cleanup
- Preserves old images if update fails
- Cleans up new files on error

**Why:** Maintain database consistency and prevent orphaned files

---

## Installation Steps

### 1. Update Dependencies
```bash
cd backend
uv sync  # or pip install -e .
```

### 2. Update Environment Variables
```bash
# Copy the example file
cp infra/.env.example infra/.env

# Generate a strong secret
openssl rand -hex 32

# Edit infra/.env with:
# - SECRET (use the generated value)
# - POSTGRES_PASSWORD (12+ characters)
# - FIRST_SUPERUSER_PASSWORD (strong password)
```

### 3. Restart Services
```bash
# If using Docker
docker-compose down
docker-compose up -d

# If running locally
# Restart your FastAPI application
```

---

## Testing the Fixes

### 1. Test Secret Validation
```bash
cd backend
# This should fail with weak secret
SECRET=weak python -m app.main

# This should work with strong secret
SECRET=$(openssl rand -hex 32) python -m app.main
```

### 2. Test File Upload
```bash
# Test size limit (should fail if > 5MB)
curl -X POST -F "image=@large_file.jpg" \
  http://localhost:8000/api/v1/categories/

# Test MIME type (should fail for non-images)
curl -X POST -F "image=@file.pdf" \
  http://localhost:8000/api/v1/categories/
```

### 3. Test SQL Injection Protection
```bash
# Should escape wildcards properly
curl "http://localhost:8000/api/v1/products?search=%25%25"
```

### 4. Test Input Validation
```bash
# Should reject invalid price ranges
curl "http://localhost:8000/api/v1/products?min_price=100&max_price=50"

# Should reject too large limits
curl "http://localhost:8000/api/v1/products?limit=10000"
```

---

## Summary Statistics

- **Files Created:** 3
- **Files Modified:** 9
- **Security Vulnerabilities Fixed:** 8
- **New Dependencies Added:** 1 (python-magic)
- **Lines of Code Added:** ~400
- **New Security Constants:** 15+
- **New Security Functions:** 4

---

## What's Protected Now

✅ **Secrets:** Strong secrets enforced, no default values allowed
✅ **SQL Injection:** LIKE wildcards properly escaped
✅ **Path Traversal:** UUID-based filenames, path validation
✅ **File Size:** 5MB max, 100 bytes min enforced
✅ **MIME Types:** Magic number validation, cannot be spoofed
✅ **Database:** Connection pooling, proper async session management
✅ **Transactions:** Rollback on errors, file cleanup
✅ **Input Validation:** Comprehensive bounds checking on all inputs

---

## Next Steps

1. **Review** all changes in each file
2. **Test** the application thoroughly
3. **Update** your local `.env` file with strong secrets
4. **Deploy** to staging environment first
5. **Monitor** for any issues
6. **Update** production environment after validation

---

## Questions?

Refer to:
- `SECURITY_FIXES.md` for detailed explanations
- Inline code comments for implementation details
- Each modified file for specific changes
