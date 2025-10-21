function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-blue-100">
      <div className="max-w-md p-8 text-center bg-white border border-blue-200 shadow-md rounded-2xl">
        <div className="flex justify-center mb-4">
          <svg
            className="w-20 h-20 text-blue-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17v-6h6v6m2 0h.01M7 17h.01M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.636-6.364l-.707-.707M12 21v-1"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-blue-700">404</h1>
        <h2 className="mb-4 text-xl font-semibold text-blue-600">
          Страница не найдена
        </h2>
        <p className="mb-6 text-gray-600">
          Возможно, страница была удалена или вы перешли по неверной ссылке.
        </p>
        <a
          href="/"
          className="px-6 py-2 text-white transition bg-blue-500 shadow rounded-xl hover:bg-blue-600"
        >
          На главную
        </a>
      </div>
    </div>
  );
}

export default NotFound;
