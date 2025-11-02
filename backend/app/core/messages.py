from app.core.constants import Constants


class Messages:
    # Password validation messages
    PASSWORD_TOO_SHORT = (
        f'Password must be at least {Constants.USER_PASSWORD_MIN_LEN} '
        f'characters'
    )
    EMAIL_IN_PASSWORD = 'Password should not contain email'
    PHONE_IN_PASSWORD = 'Password should not contain phone number'

    # User registration messages
    USER_REGISTERED = 'User registered: '
    PHONE_ALREADY_EXISTS = 'Phone number already registered'
    EMAIL_ALREADY_EXISTS = 'Email already registered'

    # Phone validation messages
    INVALID_PHONE_FORMAT = (
        'Invalid phone format. Use format: +7XXXXXXXXXX'
    )
    PHONE_REQUIRED = 'Phone number is required'

    # Name validation messages
    FIRST_NAME_REQUIRED = 'First name is required'
    FIRST_NAME_TOO_SHORT = (
        f'First name must be at least '
        f'{Constants.FIRST_NAME_MIN_LEN} character'
    )

    # Telegram validation messages
    INVALID_TELEGRAM_FORMAT = (
        'Invalid Telegram ID format. Use format: @username'
    )
    TELEGRAM_ALREADY_EXISTS = 'Telegram ID already registered'

    # Date validation messages
    INVALID_DATE_FORMAT = 'Invalid date format. Use format: YYYY-MM-DD'
    INVALID_DATE_OF_BIRTH = 'Invalid date of birth'

    # Password reset messages
    PASSWORD_RESET_EMAIL_SENT = (
        'Password reset instructions sent to email'
    )
    PASSWORD_RESET_SUCCESS = 'Password reset successfully'
    USER_NOT_FOUND = 'User not found'
    INVALID_RESET_TOKEN = 'Invalid or expired reset token'

    # Profile update messages
    PROFILE_UPDATED = 'Profile updated successfully'
    PROFILE_UPDATE_ERROR = 'Error updating profile'

    # Authentication messages
    INVALID_CREDENTIALS = 'Invalid email/phone or password'
    LOGIN_SUCCESS = 'Login successful'
    CART_FAVORITES_MERGED = 'Cart and favorites merged successfully'
