const isDevelopment = import.meta.env.MODE === 'development';

// Security: List of sensitive field names that should be filtered from logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'csrfToken',
  'csrf_token',
  'authorization',
  'auth',
  'secret',
  'api_key',
  'apiKey',
  'access_token',
  'refresh_token',
  'sessionId',
  'session_id',
];

/**
 * Recursively filter sensitive data from objects before logging
 * @param {*} data - Data to sanitize
 * @returns {*} Sanitized data
 */
const sanitizeData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // Handle objects
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if key matches sensitive field names (case-insensitive)
      const isSensitive = SENSITIVE_FIELDS.some(
        field => key.toLowerCase().includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }

  // Return primitive values as-is
  return data;
};

/**
 * Sanitize all arguments before logging
 * @param {Array} args - Arguments to sanitize
 * @returns {Array} Sanitized arguments
 */
const sanitizeArgs = (args) => {
  return args.map(arg => sanitizeData(arg));
};

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      const sanitized = sanitizeArgs(args);
      console.log(...sanitized);
    }
  },

  error: (...args) => {
    if (isDevelopment) {
      const sanitized = sanitizeArgs(args);
      console.error(...sanitized);
    } else {
      // In production, could send to Sentry or other error tracking service
      // Make sure to sanitize before sending to external services
      // const sanitized = sanitizeArgs(args);
      // sendToErrorTracking(sanitized);
    }
  },

  warn: (...args) => {
    if (isDevelopment) {
      const sanitized = sanitizeArgs(args);
      console.warn(...sanitized);
    }
  },

  debug: (...args) => {
    if (isDevelopment) {
      const sanitized = sanitizeArgs(args);
      console.debug(...sanitized);
    }
  },
};
