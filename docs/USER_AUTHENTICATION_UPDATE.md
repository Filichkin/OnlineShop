# User Authentication System Update

This document describes the comprehensive updates made to the User model and authentication system.

## Overview

The User model has been extended with additional profile fields, and the authentication system now supports login with both email and phone numbers. When users log in, their anonymous cart and favorites are automatically merged into their user account.

## Table of Contents

1. [User Model Changes](#user-model-changes)
2. [Registration Changes](#registration-changes)
3. [Authentication Changes](#authentication-changes)
4. [Profile Management](#profile-management)
5. [Password Reset](#password-reset)
6. [Cart and Favorites Migration](#cart-and-favorites-migration)
7. [API Endpoints](#api-endpoints)
8. [Validation Rules](#validation-rules)
9. [Database Migration](#database-migration)
10. [Testing](#testing)

---

## User Model Changes

### New Fields

The User model (`/backend/app/models/user.py`) now includes the following fields:

#### Required Fields:
- **first_name** (string, max 50 chars)
  - User's first name
  - Required during registration
  - Indexed for faster queries

- **phone** (string, exactly 12 chars)
  - Phone number in format: +7XXXXXXXXXX (Russian format)
  - Required during registration
  - Unique constraint
  - Indexed for faster queries
  - Used for authentication (alternative to email)

#### Optional Fields:
- **last_name** (string, max 50 chars)
  - User's last name
  - Can be updated in profile

- **date_of_birth** (date)
  - User's date of birth
  - Validated to not be in the future

- **city** (string, max 100 chars)
  - User's city

- **telegram_id** (string, 6-33 chars)
  - Telegram username in format: @username
  - Unique constraint
  - Validated with regex pattern

- **address** (string, max 255 chars)
  - User's full address

### File Location
`/Users/alexeyfilichkin/Desktop/React/Course materials React JS Essential/08-React Router/start/OnlineShop/backend/app/models/user.py`

---

## Registration Changes

### Registration Requirements

Users must provide ONLY these fields during registration:
- **first_name**: Required, 1-50 characters
- **phone**: Required, format +7XXXXXXXXXX
- **email**: Required, valid email format
- **password**: Required, minimum 8 characters with complexity rules

All other fields are optional and can be updated later through the profile.

### Validation Rules

**Password must contain:**
- At least 8 characters
- At least one letter (A-Z or a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}; ':"\\|,.<>/?~`)
- Cannot contain the user's email or phone number

**Phone number:**
- Format: +7XXXXXXXXXX (11 digits total)
- Example: +79161234567

**First name:**
- Minimum 1 character
- Maximum 50 characters
- Leading/trailing whitespace is trimmed

### API Endpoint

**POST** `/auth/register`

**Request Body:**
```json
{
  "first_name": "Ivan",
  "phone": "+79161234567",
  "email": "ivan@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "ivan@example.com",
  "phone": "+79161234567",
  "first_name": "Ivan",
  "last_name": null,
  "date_of_birth": null,
  "city": null,
  "telegram_id": null,
  "address": null,
  "is_active": true,
  "is_superuser": false,
  "is_verified": false
}
```

---

## Authentication Changes

### Dual Login System

Users can now authenticate using EITHER:
1. Email + password
2. Phone number + password

### Custom Login Endpoint

**POST** `/auth/login`

**Request Body:**
```json
{
  "email_or_phone": "+79161234567",
  "password": "SecurePass123!"
}
```
OR
```json
{
  "email_or_phone": "ivan@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "ivan@example.com",
    "phone": "+79161234567",
    "first_name": "Ivan",
    "last_name": "Petrov",
    "is_active": true,
    "is_superuser": false,
    "is_verified": false
  }
}
```

### Authentication Logic

1. System determines if input is email or phone (using regex pattern)
2. Queries database for user with matching email or phone
3. Verifies password using bcrypt
4. **Automatically merges anonymous cart and favorites** (see section below)
5. Generates JWT token
6. Clears session cookie (user is now authenticated)

### File Location
`/Users/alexeyfilichkin/Desktop/React/Course materials React JS Essential/08-React Router/start/OnlineShop/backend/app/core/auth.py`

---

## Profile Management

### Get Current User Profile

**GET** `/users/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "email": "ivan@example.com",
  "phone": "+79161234567",
  "first_name": "Ivan",
  "last_name": "Petrov",
  "date_of_birth": "1990-01-15",
  "city": "Moscow",
  "telegram_id": "@ivan_petrov",
  "address": "Red Square, 1",
  "is_active": true,
  "is_superuser": false,
  "is_verified": false
}
```

### Update Current User Profile

**PATCH** `/users/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (all fields optional):**
```json
{
  "first_name": "Ivan",
  "last_name": "Petrov",
  "phone": "+79161234567",
  "date_of_birth": "1990-01-15",
  "city": "Moscow",
  "telegram_id": "@ivan_petrov",
  "address": "Red Square, 1"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "ivan@example.com",
  "phone": "+79161234567",
  "first_name": "Ivan",
  "last_name": "Petrov",
  "date_of_birth": "1990-01-15",
  "city": "Moscow",
  "telegram_id": "@ivan_petrov",
  "address": "Red Square, 1",
  "is_active": true,
  "is_superuser": false,
  "is_verified": false
}
```

### Validation During Update

- **Phone**: Must be unique, validated against pattern
- **Telegram ID**: Must be unique, validated against pattern (@username)
- **Date of birth**: Cannot be in the future
- **First name**: Minimum 1 character if provided

### File Location
`/Users/alexeyfilichkin/Desktop/React/Course materials React JS Essential/08-React Router/start/OnlineShop/backend/app/api/endpoints/user.py`

---

## Password Reset

### Request Password Reset

**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "ivan@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset instructions sent to email"
}
```

### Password Reset Process

1. User submits email address
2. System finds user by email
3. Generates new secure password (meets all complexity requirements)
4. Hashes password and updates database
5. Sends email with new password using configured SMTP service
6. User can log in with new password and change it in profile

**Note:** The response is always the same regardless of whether the email exists (security best practice to prevent email enumeration).

### Email Service

The password reset uses the existing `EmailService` from `/backend/app/api/utils.py`:
- SMTP host: Configured in environment variables
- Email content includes new password and security recommendations

---

## Cart and Favorites Migration

### Automatic Migration on Login

When a user logs in, the system automatically:

1. **Checks for anonymous session data**
   - Reads session_id from cookie
   - Queries for cart and favorites associated with that session

2. **Gets or creates user cart and favorites**
   - Retrieves existing user cart/favorites or creates new ones

3. **Merges cart items**
   - For each product in session cart:
     - If product exists in user cart: adds quantities (up to max limit)
     - If product doesn't exist: moves item to user cart
   - Deletes session cart after merge

4. **Merges favorites**
   - For each product in session favorites:
     - If product doesn't exist in user favorites: moves item
     - If product already exists: skips (no duplicates)
   - Deletes session favorites after merge

5. **Clears session cookie**
   - User is now authenticated, session cookie no longer needed

### CRUD Operations

#### Cart CRUD (`/backend/app/crud/cart.py`)

**New Methods:**
- `get_or_create_for_user(user_id, session)`: Get or create cart for authenticated user
- `merge_carts(session_cart, user_cart, session)`: Merge session cart into user cart

#### Favorites CRUD (`/backend/app/crud/favorite.py`)

**New Methods:**
- `get_or_create_for_user(user_id, session)`: Get or create favorites for authenticated user
- `merge_favorites(session_favorite, user_favorite, session)`: Merge session favorites into user favorites

### File Locations
- `/Users/alexeyfilichkin/Desktop/React/Course materials React JS Essential/08-React Router/start/OnlineShop/backend/app/core/auth.py` (merge_session_data function)
- `/Users/alexeyfilichkin/Desktop/React/Course materials React JS Essential/08-React Router/start/OnlineShop/backend/app/crud/cart.py`
- `/Users/alexeyfilichkin/Desktop/React/Course materials React JS Essential/08-React Router/start/OnlineShop/backend/app/crud/favorite.py`

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with email/phone | No |
| POST | `/auth/jwt/login` | Login with email (default fastapi-users) | No |
| POST | `/auth/jwt/logout` | Logout current user | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |

### User Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user profile | Yes |
| PATCH | `/users/me` | Update current user profile | Yes |
| PATCH | `/users/{id}` | Update user by ID (admin) | Yes |

### Cart & Favorites (Existing)

These endpoints now work seamlessly with both authenticated and anonymous users, with automatic migration on login.

---

## Validation Rules

### Constants (`/backend/app/core/constants.py`)

**Validation Patterns:**
```python
PASSWORD_PATTERN = r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`]{8,}$'

PHONE_PATTERN = r'^\+7\d{10}$'

EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

TELEGRAM_PATTERN = r'^@[a-zA-Z0-9_]{5,32}$'
```

**Field Lengths:**
```python
# User field constraints
FIRST_NAME_MIN_LEN = 1
FIRST_NAME_MAX_LEN = 50
LAST_NAME_MAX_LEN = 50
PHONE_MIN_LEN = 12
PHONE_MAX_LEN = 12
CITY_MAX_LEN = 100
TELEGRAM_ID_MIN_LEN = 6
TELEGRAM_ID_MAX_LEN = 33
ADDRESS_MAX_LEN = 255
```

### Messages (`/backend/app/core/messages.py`)

Error messages are centralized for consistency:
- Password validation errors
- Phone validation errors
- Name validation errors
- Telegram validation errors
- Authentication errors
- Profile update messages

---

## Database Migration

### Migration File

**File:** `/backend/alembic/versions/c5aa825dd064_add_user_profile_fields.py`

**Revision:** c5aa825dd064
**Parent Revision:** 89b1a44b2544

### Migration Process

The migration was designed to handle existing users safely:

1. **Add columns as nullable**
   - All new columns added without NOT NULL constraint

2. **Update existing users**
   - Sets default values for existing users:
     - `first_name = 'User'`
     - `phone = '+70000000000'`

3. **Make required fields NOT NULL**
   - Alters `first_name` and `phone` to be NOT NULL

4. **Create indexes**
   - `ix_user_first_name`: Index on first_name
   - `ix_user_last_name`: Index on last_name
   - `ix_user_phone`: Unique index on phone

5. **Create constraints**
   - `uq_user_telegram_id`: Unique constraint on telegram_id

### Running the Migration

```bash
cd backend
alembic upgrade head
```

### Rolling Back

```bash
cd backend
alembic downgrade -1
```

---

## Testing

### Manual Testing Checklist

#### Registration
- [ ] Register with valid data (first_name, phone, email, password)
- [ ] Verify phone format validation (+7XXXXXXXXXX)
- [ ] Verify password complexity validation
- [ ] Try registering with duplicate phone
- [ ] Try registering with duplicate email

#### Login (Email)
- [ ] Login with email + password
- [ ] Verify JWT token is returned
- [ ] Verify user data is returned
- [ ] Try login with invalid email
- [ ] Try login with invalid password

#### Login (Phone)
- [ ] Login with phone + password
- [ ] Verify JWT token is returned
- [ ] Verify user data is returned
- [ ] Try login with invalid phone
- [ ] Try login with invalid password

#### Cart/Favorites Migration
- [ ] Add items to cart as anonymous user
- [ ] Add items to favorites as anonymous user
- [ ] Login with existing account
- [ ] Verify cart items are merged
- [ ] Verify favorites are merged
- [ ] Verify no duplicate items

#### Profile Management
- [ ] Get current user profile
- [ ] Update first_name
- [ ] Update last_name
- [ ] Update phone (verify uniqueness)
- [ ] Update date_of_birth
- [ ] Update city
- [ ] Update telegram_id (verify format and uniqueness)
- [ ] Update address

#### Password Reset
- [ ] Request password reset with valid email
- [ ] Verify email is sent
- [ ] Login with new password from email
- [ ] Request password reset with non-existent email (should not reveal)

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ivan",
    "phone": "+79161234567",
    "email": "ivan@example.com",
    "password": "SecurePass123!"
  }'
```

**Login with Phone:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "+79161234567",
    "password": "SecurePass123!"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer <access_token>"
```

**Update Profile:**
```bash
curl -X PATCH http://localhost:8000/users/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "last_name": "Petrov",
    "city": "Moscow"
  }'
```

**Password Reset:**
```bash
curl -X POST http://localhost:8000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ivan@example.com"
  }'
```

---

## Files Modified

### Models
- `/backend/app/models/user.py` - Extended User model with new fields

### Schemas
- `/backend/app/schemas/user.py` - Updated Pydantic schemas (UserCreate, UserUpdate, UserRead, UserLogin, PasswordResetRequest)

### Core
- `/backend/app/core/constants.py` - Added validation patterns and field length constants
- `/backend/app/core/messages.py` - Added error/success messages
- `/backend/app/core/user.py` - Updated UserManager with phone validation
- `/backend/app/core/auth.py` - **NEW FILE** - Custom authentication with email/phone support and cart/favorites migration

### CRUD
- `/backend/app/crud/cart.py` - Implemented merge_carts and get_or_create_for_user methods
- `/backend/app/crud/favorite.py` - Implemented merge_favorites and get_or_create_for_user methods

### API Endpoints
- `/backend/app/api/endpoints/user.py` - Added custom login, password reset, and profile endpoints

### Database Migrations
- `/backend/alembic/versions/c5aa825dd064_add_user_profile_fields.py` - **NEW FILE** - Migration for User model changes

---

## Security Considerations

1. **Password Security**
   - Passwords are hashed using bcrypt
   - Complex password requirements enforced
   - Password cannot contain email or phone

2. **Phone Uniqueness**
   - Phone numbers are unique across all users
   - Validated on registration and profile update

3. **Telegram ID Uniqueness**
   - Telegram IDs are unique across all users
   - Validated with regex pattern

4. **Email Enumeration Prevention**
   - Password reset always returns success message
   - Doesn't reveal if email exists

5. **Session Management**
   - Anonymous session cookies cleared on login
   - JWT tokens used for authenticated requests

6. **Data Migration**
   - Cart and favorites automatically migrated on login
   - No data loss for anonymous users who register

---

## Future Enhancements

1. **Email Verification**
   - Send verification email on registration
   - Require email verification before full access

2. **Two-Factor Authentication**
   - SMS-based 2FA using phone number
   - TOTP-based 2FA

3. **Social Login**
   - Login with Telegram
   - Login with Google/Facebook

4. **Token-Based Password Reset**
   - Generate time-limited reset tokens
   - Allow user to set their own new password

5. **Profile Image**
   - Add avatar/profile picture support

6. **Privacy Settings**
   - Control visibility of profile information
   - Email notification preferences

---

## Contact

For questions or issues related to this implementation, please refer to the codebase or contact the development team.

---

**Documentation Version:** 1.0
**Last Updated:** 2025-11-02
**Author:** Claude (FastAPI Backend Engineer)
