/**
 * CSRF Token Management Utilities
 *
 * Handles CSRF token retrieval from cookies and backend API
 * for protection against Cross-Site Request Forgery attacks.
 */

import { logger } from './logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Get CSRF token from browser cookies
 * Parses document.cookie to find csrf_token cookie
 *
 * @returns {string|null} CSRF token from cookie or null if not found
 */
export const getCsrfTokenFromCookie = () => {
  const cookies = document.cookie.split('; ');
  const csrfCookie = cookies.find(row => row.startsWith('csrf_token='));
  return csrfCookie ? csrfCookie.split('=')[1] : null;
};

/**
 * Get CSRF token from Redux store or fallback to cookie
 * First tries to get token from Redux state, then from cookies
 *
 * @param {object} store - Redux store instance
 * @returns {string|null} CSRF token or null if not found
 */
export const getCsrfToken = (store) => {
  // Try to get from Redux state first
  const csrfToken = store.getState().auth.csrfToken;
  if (csrfToken) {
    return csrfToken;
  }

  // Fallback to cookie
  return getCsrfTokenFromCookie();
};

/**
 * Fetch fresh CSRF token from backend
 * Makes request to /api/v1/user/csrf-token endpoint
 *
 * @returns {Promise<string|null>} Promise resolving to CSRF token or null on error
 */
export const fetchCsrfToken = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/v1/user/csrf-token`,
      {
        credentials: 'include', // Send cookies with request
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.csrf_token;
    }
  } catch (err) {
    logger.error('Failed to fetch CSRF token:', err);
  }

  return null;
};
