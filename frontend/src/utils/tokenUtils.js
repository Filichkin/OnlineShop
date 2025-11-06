/**
 * Utility functions for JWT token validation
 */

/**
 * Check if token exists in localStorage
 * @returns {boolean} True if token exists
 */
export const hasToken = () => {
  return !!localStorage.getItem('token');
};

/**
 * Check if JWT token is expired
 * @returns {boolean} True if token is expired or invalid
 */
export const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;

  try {
    // Decode JWT (only payload part)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;

    if (!exp) return false; // No exp field - consider valid

    // Check expiration time (with 30 second buffer)
    const now = Math.floor(Date.now() / 1000);
    return now >= (exp - 30);
  } catch (e) {
    // If cannot decode - consider invalid
    console.error('Error decoding token:', e);
    return true;
  }
};

/**
 * Get token from localStorage
 * @returns {string|null} Token or null
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * Check if token is valid (exists and not expired)
 * @returns {boolean} True if token is valid
 */
export const isTokenValid = () => {
  return hasToken() && !isTokenExpired();
};
