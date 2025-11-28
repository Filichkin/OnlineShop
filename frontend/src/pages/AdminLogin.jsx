import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../store/slices/authSlice';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rateLimitTimer, setRateLimitTimer] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  // Rate limit timer countdown
  useEffect(() => {
    if (rateLimitTimer > 0) {
      const timer = setTimeout(() => {
        setRateLimitTimer(rateLimitTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (rateLimitTimer === 0) {
      setIsRateLimited(false);
      setRateLimitTimer(null);
    }
  }, [rateLimitTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login({ identifier: username, password })).unwrap();
      navigate('/admin/panel');
    } catch (err) {
      // Handle rate limiting (429 error)
      if (err.status === 429 || err.message?.includes('Слишком много попыток')) {
        setIsRateLimited(true);
        // Extract retry-after from error or default to 60 seconds
        const retryAfterMatch = err.message?.match(/через (\d+)/);
        const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : 60;
        setRateLimitTimer(retryAfter);
      }
      // Ошибка уже обработана в slice
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в админ-панель
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Введите учетные данные для доступа к панели администратора
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Имя пользователя
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={handleClearError}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleClearError}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Ошибка входа
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || isRateLimited}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isRateLimited ? `Подождите ${rateLimitTimer} секунд` : undefined}
            >
              {loading ? (
                'Вход...'
              ) : isRateLimited && rateLimitTimer ? (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Подождите {rateLimitTimer} сек
                </span>
              ) : (
                'Войти'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
