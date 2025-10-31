/**
 * CartSkeleton - компонент skeleton loader для корзины
 *
 * Отображается во время загрузки корзины для улучшения UX.
 * Использует анимацию пульсации для имитации загрузки контента.
 */
function CartSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="h-9 bg-gray-300 rounded w-64 mx-auto mb-8 animate-pulse"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skeleton для списка товаров */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div className="h-7 bg-gray-300 rounded w-32 animate-pulse"></div>
            <div className="h-5 bg-gray-300 rounded w-28 animate-pulse"></div>
          </div>

          {/* Skeleton для 3 товаров */}
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Skeleton изображения */}
                <div className="flex-shrink-0">
                  <div className="w-full sm:w-24 h-24 bg-gray-300 rounded-md"></div>
                </div>

                {/* Skeleton информации о товаре */}
                <div className="flex-grow min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="h-6 bg-gray-300 rounded w-2/3"></div>
                    <div className="h-10 bg-gray-300 rounded w-28"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>

                {/* Skeleton для цены и удаления */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                  <div className="space-y-2 text-right">
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                    <div className="h-6 bg-gray-300 rounded w-20"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-300 rounded-md"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton для формы оформления заказа */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="space-y-4">
              <div className="flex justify-between items-baseline pb-4 border-b border-gray-200">
                <div className="h-5 bg-gray-300 rounded w-20"></div>
                <div className="h-6 bg-gray-300 rounded w-16"></div>
              </div>
              <div className="flex justify-between items-baseline pb-6 border-b border-gray-200">
                <div className="h-8 bg-gray-300 rounded w-24"></div>
                <div className="h-8 bg-gray-300 rounded w-32"></div>
              </div>
              <div className="h-12 bg-gray-300 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartSkeleton;
