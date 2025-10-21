function ErrorBoundary() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-blue-100">
      <div className="max-w-md p-8 text-center bg-white border border-blue-200 shadow-md rounded-2xl">
        <div className="flex justify-center mb-4">
          <svg
            className="w-16 h-16 text-blue-500"
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
        <h1 className="mb-2 text-2xl font-bold text-blue-700">
          Упс! Что-то пошло не так
        </h1>
        <p className="mb-6 text-gray-600">
          Мы уже работаем над исправлением. Попробуйте обновить страницу.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 text-white transition bg-blue-500 shadow rounded-xl hover:bg-blue-600"
        >
          Обновить
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;