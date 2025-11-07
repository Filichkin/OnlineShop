import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../store/slices/authSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchProducts } from '../store/slices/productsSlice';
import CategoryManager from '../components/admin/CategoryManager';
import ProductManager from '../components/admin/ProductManager';
import BrandManager from '../components/admin/BrandManager';
import OrderManager from '../components/admin/OrderManager';
import { adminOrdersAPI } from '../api';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [ordersStats, setOrdersStats] = useState({ total: 0, pending: 0 });
  const [productsStats, setProductsStats] = useState({ total: 0, active: 0 });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);

  useEffect(() => {
    // Загружаем данные при входе в админ-панель
    if (token) {
      dispatch(getCurrentUser(token));
    }
    dispatch(fetchCategories());

    // Загружаем статистику продуктов отдельным запросом
    const fetchProductsStats = async () => {
      try {
        // Загружаем ВСЕ продукты для подсчета статистики
        const allProductsResponse = await dispatch(
          fetchProducts({ skip: 0, limit: 1000, isActive: undefined })
        ).unwrap();

        const total = allProductsResponse.length;
        const active = allProductsResponse.filter(p => p.is_active).length;
        setProductsStats({ total, active });
      } catch (error) {
        // Silently handle error
      }
    };

    // Загружаем статистику заказов
    const fetchOrdersStats = async () => {
      try {
        const data = await adminOrdersAPI.getAllOrders(0, 1000);
        const total = data.total || (data.orders ? data.orders.length : 0);
        const pending = data.orders ? data.orders.filter(order =>
          order.status === 'created' || order.status === 'updated'
        ).length : 0;
        setOrdersStats({ total, pending });
      } catch (error) {
        // Set default stats on error
        setOrdersStats({ total: 0, pending: 0 });
      }
    };

    if (token) {
      fetchProductsStats();
      fetchOrdersStats();
    }
  }, [dispatch, token]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Panel Title */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
            <span className="text-sm text-gray-700">
              Добро пожаловать, {user?.email || user?.username || 'Администратор'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Категории
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Продукты
            </button>
            <button
              onClick={() => setActiveTab('brands')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'brands'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Бренды
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Заказы
              {ordersStats.pending > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {ordersStats.pending}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Всего категорий</dt>
                    <dd className="text-lg font-medium text-gray-900">{categories.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Всего продуктов</dt>
                    <dd className="text-lg font-medium text-gray-900">{productsStats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Активных продуктов</dt>
                    <dd className="text-lg font-medium text-gray-900">{productsStats.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Всего заказов</dt>
                    <dd className="text-lg font-medium text-gray-900">{ordersStats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'products' && <ProductManager />}
          {activeTab === 'brands' && <BrandManager />}
          {activeTab === 'orders' && <OrderManager />}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
