import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../api';
import { resetCart } from './cartSlice';
import { resetFavorites } from './favoritesSlice';
import { logger } from '../../utils/logger';

// Асинхронные действия

/**
 * Регистрация нового пользователя
 */
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Вход пользователя (phone или email + password)
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(identifier, password);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Восстановление пароля
 */
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (identifier, { rejectWithValue }) => {
    try {
      const response = await authAPI.forgotPassword(identifier);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Получение текущего пользователя
 */
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Обновление профиля пользователя
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Выход пользователя
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    // Reset cart and favorites FIRST to clear state and localStorage
    // This prevents any race conditions during logout
    dispatch(resetCart());
    dispatch(resetFavorites());

    // Call backend logout endpoint to clear httpOnly cookies
    // Use /api/v1 prefix only - VITE_API_BASE_URL already includes it
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    try {
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Important for sending cookies
      });
    } catch (err) {
      // Ignore logout errors - still clear local state
      logger.error('Logout API error:', err);
    }

    // Double-check: Reset cart and favorites again after backend call
    // This ensures localStorage is cleared even if any async operations occurred
    dispatch(resetCart());
    dispatch(resetFavorites());

    return null;
  }
);

const initialState = {
  user: null, // User object with: first_name, last_name, email, phone, date_of_birth, city, telegram_id, address
  // CSRF token removed - now using only httpOnly cookies via getCsrfTokenFromCookie()
  isAuthenticated: false, // Check user existence instead of token
  loading: false,
  error: null,
  successMessage: null,
  sessionExpired: false, // Flag to distinguish explicit logout from session expiration
  authChecked: false, // Flag to indicate initial auth check has completed
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearSessionExpired: (state) => {
      state.sessionExpired = false;
    },
    // setCsrfToken removed - CSRF tokens now managed via httpOnly cookies only
  },
  extraReducers: (builder) => {
    builder
      // Регистрация
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user; // Save user data from response
        // CSRF token no longer stored in state - using httpOnly cookies
        state.isAuthenticated = true;
        state.successMessage = 'Регистрация прошла успешно!';
        state.sessionExpired = false; // Clear session expired flag on successful registration
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ошибка регистрации';
        state.isAuthenticated = false;
      })

      // Логин
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user; // Save user data from response
        // CSRF token no longer stored in state - using httpOnly cookies
        state.isAuthenticated = true;
        state.successMessage = 'Вход выполнен успешно!';
        state.sessionExpired = false; // Clear session expired flag on successful login
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ошибка входа';
        state.isAuthenticated = false;
      })

      // Восстановление пароля
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Инструкции отправлены на указанный контакт';
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ошибка при восстановлении пароля';
      })

      // Получение текущего пользователя
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.authChecked = true; // Auth check completed
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.authChecked = true; // Auth check completed (even if failed)
        
        // Check if session expired (401 error)
        // Only mark as session expired if user WAS previously authenticated
        // This prevents showing "session expired" message after explicit logout
        const wasAuthenticated = state.isAuthenticated || state.user !== null;
        
        if (action.payload?.includes('Сессия истекла') || action.payload?.includes('Токен не найден')) {
          // Clear authentication state
          state.isAuthenticated = false;
          state.user = null;
          state.error = null; // Don't show error message, just redirect
          
          // Only mark session as expired if user was previously logged in
          if (wasAuthenticated) {
            state.sessionExpired = true; // Mark as session expired
          }
          // If user was never authenticated, just silently fail (normal case for guests)
        } else {
          state.error = action.payload || 'Не удалось загрузить данные пользователя';
        }
      })

      // Обновление профиля
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.successMessage = 'Профиль успешно обновлен!';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        // Check if session expired (401 error)
        // User must have been authenticated to call updateProfile, so always mark as expired
        if (action.payload?.includes('Сессия истекла') || action.payload?.includes('Токен не найден')) {
          // Clear authentication state
          state.isAuthenticated = false;
          state.user = null;
          state.error = null;
          state.sessionExpired = true; // Mark as session expired (user was definitely logged in before)
        } else {
          state.error = action.payload || 'Ошибка при обновлении профиля';
        }
      })

      // Выход
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.successMessage = null;
        state.sessionExpired = false; // Clear session expired flag on explicit logout
      });
  },
});

export const { clearError, clearSuccessMessage, setUser, clearSessionExpired } = authSlice.actions;
export default authSlice.reducer;
