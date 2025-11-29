export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const handleApiError = (error) => {
  if (error.name === 'AbortError') {
    return null; // Ignore cancelled requests
  }

  if (error.message === 'Failed to fetch' || error.message.includes('timeout')) {
    return new ApiError(
      'Ошибка сети. Проверьте подключение к интернету',
      0,
      error
    );
  }

  if (error.status === 401) {
    return new ApiError(
      'Сессия истекла. Войдите снова',
      401,
      error
    );
  }

  if (error.status === 403) {
    return new ApiError(
      'Доступ запрещён',
      403,
      error
    );
  }

  if (error.status === 404) {
    return new ApiError(
      'Ресурс не найден',
      404,
      error
    );
  }

  if (error.status === 429) {
    return new ApiError(
      'Слишком много запросов. Попробуйте позже',
      429,
      error
    );
  }

  if (error.status >= 500) {
    return new ApiError(
      'Ошибка сервера. Попробуйте позже',
      error.status,
      error
    );
  }

  return error;
};
