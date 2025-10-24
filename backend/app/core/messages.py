from app.core.constants import Constants


class Messages:
    PASSWORD_TOO_SHORT = (
        f'Password must be not less {Constants.USER_PASSWORD_MIN_LEN}'
    )
    EMAIL_IN_PASSWORD = 'Password should`t contain email'
    USER_REGISTERED = 'User registered: '
