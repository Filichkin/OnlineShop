import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearSessionExpired } from '../store/slices/authSlice';

/**
 * SessionExpiredHandler - компонент для обработки истечения сессии
 *
 * Отслеживает флаг sessionExpired в Redux state и показывает
 * уведомление только когда сессия действительно истекла (не при явном logout)
 */
function SessionExpiredHandler({ onOpenLoginModal }) {
  const { sessionExpired, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Show notification only when session has expired (not on explicit logout)
    if (sessionExpired && !loading) {
      // If user was on a protected page, redirect to home
      const protectedPaths = ['/profile', '/checkout', '/order'];
      const isProtectedPath = protectedPaths.some(path => location.pathname.startsWith(path));

      if (isProtectedPath) {
        navigate('/', { replace: true });

        // Special handling for profile page - no popup, immediate login modal
        if (location.pathname.startsWith('/profile')) {
          if (onOpenLoginModal) {
            onOpenLoginModal();
          }
          dispatch(clearSessionExpired());
          return; // Exit early - no notification shown
        }
      }

      // For other cases (non-profile protected pages or general session expiration)
      // Show notification popup
      setShowNotification(true);

      // Auto-hide notification after 4 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
        // Open login modal after notification disappears
        if (onOpenLoginModal) {
          onOpenLoginModal();
        }
        // Clear the sessionExpired flag
        dispatch(clearSessionExpired());
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [sessionExpired, loading, navigate, location.pathname, onOpenLoginModal, dispatch]);

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Сессия истекла
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Ваша сессия истекла. Пожалуйста, войдите снова для продолжения работы.
            </p>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="ml-4 flex-shrink-0 text-yellow-400 hover:text-yellow-600 focus:outline-none"
            aria-label="Закрыть"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionExpiredHandler;
