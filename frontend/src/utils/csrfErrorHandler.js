/**
 * CSRF Error Handler
 *
 * Handles CSRF token validation errors and retry logic
 */

import { fetchCsrfToken } from './csrf';
import { logger } from './logger';

/**
 * Handle CSRF errors and attempt retry with fresh token
 *
 * When a CSRF error is detected (403 status with CSRF message),
 * this function fetches a new CSRF token from the backend
 * and optionally retries the failed operation.
 *
 * @param {Error} error - Error object from failed request
 * @param {Function} retryCallback - Optional callback to retry operation with new token
 * @param {object} store - Redux store instance (for updating CSRF token in state)
 * @returns {Promise<any>} Result of retry callback or throws error
 *
 * @example
 * try {
 *   await ordersAPI.createOrder(orderData);
 * } catch (error) {
 *   await handleCsrfError(error, () => ordersAPI.createOrder(orderData), store);
 * }
 */
export const handleCsrfError = async (error, retryCallback = null, store = null) => {
  // Check if error is CSRF related
  const isCsrfError =
    error.message?.toLowerCase().includes('csrf') ||
    error.status === 403;

  if (!isCsrfError) {
    throw error;
  }

  console.warn('CSRF token validation failed, fetching new token...');

  // Fetch new CSRF token
  const newToken = await fetchCsrfToken();

  if (!newToken) {
    logger.error('Failed to fetch new CSRF token');
    throw new Error('Не удалось обновить токен безопасности. Попробуйте обновить страницу.');
  }

  // Update Redux store if provided
  if (store) {
    const { setCsrfToken } = await import('../store/slices/authSlice');
    store.dispatch(setCsrfToken(newToken));
  }

  // Retry callback if provided
  if (retryCallback && typeof retryCallback === 'function') {
    console.log('Retrying operation with new CSRF token...');
    return await retryCallback();
  }

  // If no retry callback, just throw original error
  throw error;
};

/**
 * Check if error is CSRF related
 *
 * @param {Error} error - Error object to check
 * @returns {boolean} True if error is CSRF related
 */
export const isCsrfError = (error) => {
  return (
    error?.message?.toLowerCase().includes('csrf') ||
    error?.status === 403
  );
};
