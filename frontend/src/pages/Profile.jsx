import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import ordersIcon from '../assets/images/orders.webp';
import favoriteIcon from '../assets/images/favorite.webp';
import profileIcon from '../assets/images/profile.webp';

/**
 * Profile компонент - страница профиля пользователя
 *
 * Содержит три раздела:
 * - Профайл: просмотр и редактирование профиля
 * - Заказы: список заказов пользователя
 * - Избранное: список избранных товаров
 */
function Profile() {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'orders', 'favorites'
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    phone: '+7 900 000-00-00',
    address: 'г. Москва, ул. Примерная, д. 1',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // TODO: Интеграция с backend API для сохранения профиля
    console.log('Profile saved:', profileData);
    setIsEditing(false);
  };

  const tabs = [
    { id: 'profile', label: 'Профайл', icon: profileIcon },
    { id: 'orders', label: 'Заказы', icon: ordersIcon },
    { id: 'favorites', label: 'Избранное', icon: favoriteIcon },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Выйти
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow-md p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <img
                  src={tab.icon}
                  alt={tab.label}
                  className="w-6 h-6 object-contain"
                />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Профайл</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Редактировать
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Имя
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Телефон
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Адрес
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Имя</h3>
                      <p className="mt-1 text-gray-900">{profileData.name}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="mt-1 text-gray-900">{profileData.email}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Телефон</h3>
                      <p className="mt-1 text-gray-900">{profileData.phone}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Адрес</h3>
                      <p className="mt-1 text-gray-900">{profileData.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Заказы</h2>

                {/* Placeholder для заказов - будет заменено на реальные данные */}
                <div className="space-y-4">
                  {[1, 2, 3].map((orderId) => (
                    <div
                      key={orderId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Заказ #{orderId.toString().padStart(6, '0')}
                        </h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          Доставлен
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Дата: 15 января 2025</p>
                      <p className="text-sm text-gray-600">Сумма: 15 000 руб.</p>
                      <button className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors focus:outline-none focus:underline">
                        Подробнее
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-center text-gray-500 text-sm">
                  Здесь будут отображаться ваши заказы
                </p>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Избранное</h2>

                <p className="text-gray-600 mb-4">
                  Ваши избранные товары также доступны на{' '}
                  <button
                    onClick={() => navigate('/favorites')}
                    className="text-blue-600 hover:text-blue-800 font-medium underline focus:outline-none"
                  >
                    странице избранного
                  </button>
                </p>

                <div className="text-center py-12">
                  <img
                    src={favoriteIcon}
                    alt="Избранное"
                    className="w-24 h-24 mx-auto mb-4 opacity-50"
                  />
                  <p className="text-gray-500">
                    Здесь будут отображаться ваши избранные товары
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Перейти к покупкам
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
