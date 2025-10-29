import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние, чтобы показать fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Отправляем ошибку в сервис мониторинга (если есть)
    // this.logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorMessage = () => {
    const { error } = this.state;
    
    if (!error) return 'Произошла неизвестная ошибка';
    
    // Обрабатываем различные типы ошибок
    if (error.message) {
      if (error.message.includes('CORS')) {
        return 'Ошибка подключения к серверу. Проверьте настройки CORS.';
      }
      if (error.message.includes('Failed to fetch')) {
        return 'Не удается подключиться к серверу. Проверьте, что backend запущен.';
      }
      if (error.message.includes('NetworkError')) {
        return 'Ошибка сети. Проверьте подключение к интернету.';
      }
      if (error.message.includes('404')) {
        return 'Запрашиваемый ресурс не найден.';
      }
      if (error.message.includes('500')) {
        return 'Внутренняя ошибка сервера. Попробуйте позже.';
      }
      if (error.message.includes('403')) {
        return 'Доступ запрещен. Проверьте права доступа.';
      }
      if (error.message.includes('401')) {
        return 'Требуется авторизация. Войдите в систему.';
      }
      
      return error.message;
    }
    
    return 'Произошла ошибка приложения';
  };

  getErrorDetails = () => {
    const { error, errorInfo } = this.state;
    
    if (process.env.NODE_ENV === 'development' && error) {
      return {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack
      };
    }
    
    return null;
  };

  render() {
    if (this.state.hasError) {
      const errorDetails = this.getErrorDetails();
      
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-50">
          <div className="max-w-2xl w-full p-8 text-center bg-white border border-red-200 shadow-lg rounded-2xl">
            {/* Иконка ошибки */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 rounded-full">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Заголовок */}
            <h1 className="mb-4 text-2xl font-bold text-red-700">
              Упс! Что-то пошло не так
            </h1>

            {/* Сообщение об ошибке */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">
                {this.getErrorMessage()}
              </p>
            </div>

            {/* Детали ошибки для разработки */}
            {errorDetails && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Детали ошибки (для разработчиков)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Сообщение:</strong> {errorDetails.message}
                  </div>
                  {errorDetails.stack && (
                    <div className="mb-2">
                      <strong>Stack trace:</strong>
                      <pre className="whitespace-pre-wrap">{errorDetails.stack}</pre>
                    </div>
                  )}
                  {errorDetails.componentStack && (
                    <div>
                      <strong>Component stack:</strong>
                      <pre className="whitespace-pre-wrap">{errorDetails.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Кнопки действий */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Попробовать снова
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Обновить страницу
              </button>
            </div>

            {/* Счетчик попыток */}
            {this.state.retryCount > 0 && (
              <p className="mt-4 text-sm text-gray-500">
                Попыток восстановления: {this.state.retryCount}
              </p>
            )}

            {/* Дополнительная информация */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Что можно сделать:
              </h3>
              <ul className="text-sm text-blue-700 text-left space-y-1">
                <li>• Проверьте подключение к интернету</li>
                <li>• Убедитесь, что backend сервер запущен</li>
                <li>• Очистите кэш браузера</li>
                <li>• Попробуйте войти в систему заново</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;