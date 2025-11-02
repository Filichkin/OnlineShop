import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../api';

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

const initialState = {
  user: null, // User object with: first_name, last_name, email, phone, date_of_birth, city, telegram_id, address
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.successMessage = null;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
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
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.successMessage = 'Регистрация прошла успешно!';
        localStorage.setItem('token', action.payload.access_token);
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
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.successMessage = 'Вход выполнен успешно!';
        localStorage.setItem('token', action.payload.access_token);
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
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Не удалось загрузить данные пользователя';
        // If token is invalid, logout
        if (action.payload?.includes('Сессия истекла')) {
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          localStorage.removeItem('token');
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
        state.error = action.payload || 'Ошибка при обновлении профиля';
      });
  },
});

export const { logout, clearError, clearSuccessMessage, setUser } = authSlice.actions;
export default authSlice.reducer;
