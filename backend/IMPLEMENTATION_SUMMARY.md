# User Authentication System - Implementation Summary

## Quick Overview

This document provides a quick reference for the User Authentication System update implementation.

---

## Key Changes Summary

### 1. User Model Extended
**File:** `/backend/app/models/user.py`

Added fields:
- `first_name` (required)
- `phone` (required, unique)
- `last_name` (optional)
- `date_of_birth` (optional)
- `city` (optional)
- `telegram_id` (optional, unique)
- `address` (optional)

### 2. Dual Login System
**File:** `/backend/app/core/auth.py`

Users can login with:
- Email + password
- Phone + password

### 3. Automatic Cart/Favorites Migration
**Files:**
- `/backend/app/core/auth.py`
- `/backend/app/crud/cart.py`
- `/backend/app/crud/favorite.py`

On login, anonymous cart and favorites automatically merge into user account.

### 4. Password Reset
**File:** `/backend/app/api/endpoints/user.py`

Users can reset password via email.

### 5. Profile Management
**File:** `/backend/app/api/endpoints/user.py`

Users can view and update their profile.

---

## API Endpoints Quick Reference

### Authentication

```http
# Register
POST /auth/register
Content-Type: application/json

{
  "first_name": "Ivan",
  "phone": "+79161234567",
  "email": "ivan@example.com",
  "password": "SecurePass123!"
}

# Login (email or phone)
POST /auth/login
Content-Type: application/json

{
  "email_or_phone": "+79161234567",
  "password": "SecurePass123!"
}

# Password Reset
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "ivan@example.com"
}
```

### Profile Management

```http
# Get current user profile
GET /users/me
Authorization: Bearer <token>

# Update profile
PATCH /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "last_name": "Petrov",
  "city": "Moscow",
  "telegram_id": "@ivan_petrov"
}
```

---

## Validation Patterns

```python
# Phone: +7XXXXXXXXXX
PHONE_PATTERN = r'^\+7\d{10}$'
Example: +79161234567

# Telegram: @username
TELEGRAM_PATTERN = r'^@[a-zA-Z0-9_]{5,32}$'
Example: @ivan_petrov

# Password: Min 8 chars, letter, digit, special char
PASSWORD_PATTERN = r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`]{8,}$'
Example: SecurePass123!
```

---

## Database Migration

```bash
# Apply migration
cd backend
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

**Migration File:** `c5aa825dd064_add_user_profile_fields.py`

---

## Code Structure

```
backend/
├── app/
│   ├── models/
│   │   └── user.py              # Extended User model
│   ├── schemas/
│   │   └── user.py              # Pydantic schemas
│   ├── core/
│   │   ├── constants.py         # Validation patterns
│   │   ├── messages.py          # Error messages
│   │   ├── user.py              # UserManager
│   │   └── auth.py              # Custom auth (NEW)
│   ├── crud/
│   │   ├── cart.py              # Cart CRUD with merge
│   │   └── favorite.py          # Favorites CRUD with merge
│   └── api/
│       └── endpoints/
│           └── user.py          # Auth & profile endpoints
├── alembic/
│   └── versions/
│       └── c5aa825dd064_*.py    # Migration (NEW)
└── USER_AUTHENTICATION_UPDATE.md # Full documentation
```

---

## Testing Workflow

### 1. Test Registration
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "phone": "+79999999999",
    "email": "test@test.com",
    "password": "TestPass123!"
  }'
```

### 2. Test Login with Phone
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "+79999999999",
    "password": "TestPass123!"
  }'
```

### 3. Test Profile Update
```bash
# Save token from login response
TOKEN="<access_token>"

curl -X PATCH http://localhost:8000/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "last_name": "User",
    "city": "Moscow"
  }'
```

### 4. Test Cart Migration

```bash
# 1. Add item to cart (anonymous)
curl -X POST http://localhost:8000/cart/items \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}' \
  -c cookies.txt

# 2. Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "+79999999999",
    "password": "TestPass123!"
  }' \
  -b cookies.txt

# 3. Check cart (should have merged items)
curl -X GET http://localhost:8000/cart \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Issues & Solutions

### Issue: Migration fails with "column already exists"
**Solution:**
```bash
# Check current migration state
alembic current

# If needed, mark migration as applied without running it
alembic stamp c5aa825dd064
```

### Issue: Phone validation fails
**Solution:** Ensure phone is in exact format: +7XXXXXXXXXX (12 characters total)

### Issue: Password validation fails
**Solution:** Password must have:
- At least 8 characters
- At least one letter
- At least one digit
- At least one special character (!@#$%^&*()_+-=[]{}; ':"\\|,.<>/?~`)

### Issue: Cart not merging on login
**Solution:**
- Ensure session cookie is present in request
- Check that anonymous cart exists before login
- Verify login endpoint is being used (not default JWT login)

---

## Important Notes

1. **Registration requires only:**
   - first_name
   - phone
   - email
   - password

2. **All other fields are optional** and can be updated via profile

3. **Phone must be unique** across all users

4. **Telegram ID must be unique** and start with @

5. **Cart/Favorites migration happens automatically on login** via `/auth/login` endpoint

6. **Password reset sends new password via email** (requires SMTP configuration)

7. **JWT tokens are used for authentication** (not session-based)

8. **The custom login endpoint is `/auth/login`** (different from default `/auth/jwt/login`)

---

## Environment Variables Required

```env
# Email service (for password reset)
YANDAX_EMAIL=your-email@yandex.ru
YANDEX_APP_PASS=your-app-password
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database

# Security
SECRET=your-secret-key-min-32-chars
```

---

## Files Modified/Created

### Modified Files (9)
1. `/backend/app/models/user.py`
2. `/backend/app/schemas/user.py`
3. `/backend/app/core/constants.py`
4. `/backend/app/core/messages.py`
5. `/backend/app/core/user.py`
6. `/backend/app/crud/cart.py`
7. `/backend/app/crud/favorite.py`
8. `/backend/app/api/endpoints/user.py`

### New Files Created (3)
1. `/backend/app/core/auth.py`
2. `/backend/alembic/versions/c5aa825dd064_add_user_profile_fields.py`
3. `/backend/USER_AUTHENTICATION_UPDATE.md`

---

## Next Steps

1. **Run the migration:**
   ```bash
   cd backend
   alembic upgrade head
   ```

2. **Test the endpoints** using the examples above

3. **Update frontend** to use new authentication endpoints

4. **Configure SMTP** for password reset functionality

5. **Consider adding**:
   - Email verification
   - Two-factor authentication
   - Social login

---

## Support

For detailed documentation, see:
- `/backend/USER_AUTHENTICATION_UPDATE.md` - Full documentation
- API documentation at: `http://localhost:8000/docs` (when server is running)

---

**Quick Reference Version:** 1.0
**Last Updated:** 2025-11-02
