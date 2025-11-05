import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { logout, updateProfile, getCurrentUser, clearError, clearSuccessMessage } from '../store/slices/authSlice';
import { selectFavoriteItems, selectFavoritesIsLoading, fetchFavorites } from '../store/slices/favoritesSlice';
import { isValidPhone, isValidTelegramId, isValidBirthDate, formatPhoneNumber } from '../utils/validation';
import { getImageUrl, formatPrice } from '../utils';
import { ordersAPI } from '../api';
import ordersIcon from '../assets/images/orders.webp';
import favoriteIcon from '../assets/images/favorite.webp';
import profileIcon from '../assets/images/profile.webp';
import AddToCartButton from '../UI/AddToCartButton';
import FavoriteButton from '../UI/FavoriteButton';

/**
 * Profile компонент - страница профиля пользователя
 *
 * Содержит три раздела:
 * - Профайл: просмотр и редактирование профиля
 * - Заказы: список заказов пользователя
 * - Избранное: список избранных товаров
 */
function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, error, successMessage } = useSelector((state) => state.auth);
  const favoriteItems = useSelector(selectFavoriteItems);
  const favoritesLoading = useSelector(selectFavoritesIsLoading);

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    city: '',
    telegram_id: '',
    address: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Check if we should open orders tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'orders') {
      setActiveTab('orders');
    }
  }, [searchParams]);

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
  }, [user, dispatch]);

  // Load favorites when user is authenticated
  useEffect(() => {
    if (user) {
      dispatch(fetchFavorites());
    }
  }, [user, dispatch]);

  // Load orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders' && user && orders.length === 0) {
      loadOrders();
    }
  }, [activeTab, user]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await ordersAPI.getOrders(0, 20);
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
      setOrdersError(err || 'Не удалось загрузить заказы');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Update local state when user data is loaded
  useEffect(() => {
    if (user) {
      // Format date_of_birth for input field (YYYY-MM-DD format)
      let formattedDate = '';
      if (user.date_of_birth) {
        try {
          // If it's already in YYYY-MM-DD format, use it directly
          if (typeof user.date_of_birth === 'string' && user.date_of_birth.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = user.date_of_birth;
          } else {
            // Parse and format to YYYY-MM-DD
            const date = new Date(user.date_of_birth);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              formattedDate = `${year}-${month}-${day}`;
            }
          }
        } catch (e) {
          console.error('Error formatting date_of_birth:', e, user.date_of_birth);
        }
      }
      
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: formattedDate,
        city: user.city || '',
        telegram_id: user.telegram_id || '',
        address: user.address || '',
      });
    }
  }, [user]);

  // Clear messages after some time
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Format phone number
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setProfileData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setProfileData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    // First name is required
    if (!profileData.first_name || profileData.first_name.trim().length === 0) {
      errors.first_name = 'Имя обязательно для заполнения';
    } else if (profileData.first_name.length > 50) {
      errors.first_name = 'Имя не может быть длиннее 50 символов';
    }

    // Phone is required and must be valid
    if (!profileData.phone) {
      errors.phone = 'Телефон обязателен';
    } else if (!isValidPhone(profileData.phone)) {
      errors.phone = 'Неверный формат телефона (+7XXXXXXXXXX)';
    }

    // Last name is optional but has max length
    if (profileData.last_name && profileData.last_name.length > 50) {
      errors.last_name = 'Фамилия не может быть длиннее 50 символов';
    }

    // Telegram ID validation (optional)
    if (profileData.telegram_id && !isValidTelegramId(profileData.telegram_id)) {
      errors.telegram_id = 'Неверный формат Telegram ID (должен начинаться с @ и содержать 6-33 символа)';
    }

    // Date of birth validation (optional, must not be in future)
    if (profileData.date_of_birth && !isValidBirthDate(profileData.date_of_birth)) {
      errors.date_of_birth = 'Дата рождения не может быть в будущем';
    }

    // City max length
    if (profileData.city && profileData.city.length > 100) {
      errors.city = 'Город не может быть длиннее 100 символов';
    }

    // Address max length
    if (profileData.address && profileData.address.length > 255) {
      errors.address = 'Адрес не может быть длиннее 255 символов';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Only send fields that can be updated
      const updateData = {
        first_name: profileData.first_name,
        phone: profileData.phone,
      };

      // Add optional fields only if they have values
      if (profileData.last_name) updateData.last_name = profileData.last_name;
      if (profileData.date_of_birth) updateData.date_of_birth = profileData.date_of_birth;
      if (profileData.city) updateData.city = profileData.city;
      if (profileData.telegram_id) updateData.telegram_id = profileData.telegram_id;
      if (profileData.address) updateData.address = profileData.address;

      await dispatch(updateProfile(updateData)).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update error:', err);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to user data
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        city: user.city || '',
        telegram_id: user.telegram_id || '',
        address: user.address || '',
      });
    }
    setValidationErrors({});
    setIsEditing(false);
    dispatch(clearError());
  };

  const tabs = [
    { id: 'profile', label: 'Профайл', icon: profileIcon },
    { id: 'orders', label: 'Заказы', icon: ordersIcon },
    { id: 'favorites', label: 'Избранное', icon: favoriteIcon },
  ];

  if (!user && loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Загрузка профиля...</p>
          </div>
        </div>
      </div>
    );
  }

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

                {/* Success Message */}
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md text-sm">
                    {successMessage}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    {/* First Name - Required */}
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Имя <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={profileData.first_name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.first_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loading}
                      />
                      {validationErrors.first_name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.first_name}</p>
                      )}
                    </div>

                    {/* Last Name - Optional */}
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Фамилия
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={profileData.last_name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.last_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loading}
                      />
                      {validationErrors.last_name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.last_name}</p>
                      )}
                    </div>

                    {/* Email - Display Only */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                        disabled
                      />
                      <p className="mt-1 text-xs text-gray-500">Email нельзя изменить</p>
                    </div>

                    {/* Phone - Required */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Телефон <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+7 900 000-00-00"
                        disabled={loading}
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                      )}
                    </div>

                    {/* Date of Birth - Optional */}
                    <div>
                      <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                        Дата рождения
                      </label>
                      <input
                        type="date"
                        id="date_of_birth"
                        name="date_of_birth"
                        value={profileData.date_of_birth}
                        onChange={handleInputChange}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loading}
                      />
                      {validationErrors.date_of_birth && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.date_of_birth}</p>
                      )}
                    </div>

                    {/* City - Optional */}
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        Город
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={profileData.city}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Москва"
                        disabled={loading}
                      />
                      {validationErrors.city && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
                      )}
                    </div>

                    {/* Telegram ID - Optional */}
                    <div>
                      <label htmlFor="telegram_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Telegram ID
                      </label>
                      <input
                        type="text"
                        id="telegram_id"
                        name="telegram_id"
                        value={profileData.telegram_id}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.telegram_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="@username"
                        disabled={loading}
                      />
                      {validationErrors.telegram_id && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.telegram_id}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Формат: @username (6-33 символа)</p>
                    </div>

                    {/* Address - Optional */}
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
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                          validationErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="г. Москва, ул. Примерная, д. 1, кв. 10"
                        disabled={loading}
                      />
                      {validationErrors.address && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors disabled:opacity-50"
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Имя</h3>
                        <p className="mt-1 text-gray-900">{profileData.first_name || '-'}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Фамилия</h3>
                        <p className="mt-1 text-gray-900">{profileData.last_name || '-'}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="mt-1 text-gray-900">{profileData.email || '-'}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Телефон</h3>
                        <p className="mt-1 text-gray-900">{profileData.phone || '-'}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Дата рождения</h3>
                        <p className="mt-1 text-gray-900">
                          {profileData.date_of_birth
                            ? (() => {
                                try {
                                  // If it's already in YYYY-MM-DD format, parse it directly
                                  const dateStr = profileData.date_of_birth;
                                  if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    const [year, month, day] = dateStr.split('-');
                                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                    return date.toLocaleDateString('ru-RU');
                                  } else {
                                    // Try to parse as Date
                                    const date = new Date(dateStr);
                                    if (!isNaN(date.getTime())) {
                                      return date.toLocaleDateString('ru-RU');
                                    }
                                    return dateStr;
                                  }
                                } catch (e) {
                                  console.error('Error formatting date_of_birth:', e, profileData.date_of_birth);
                                  return profileData.date_of_birth;
                                }
                              })()
                            : '-'}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Город</h3>
                        <p className="mt-1 text-gray-900">{profileData.city || '-'}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Telegram ID</h3>
                        <p className="mt-1 text-gray-900">{profileData.telegram_id || '-'}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Адрес</h3>
                      <p className="mt-1 text-gray-900">{profileData.address || '-'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Мои заказы</h2>

                {ordersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-4">{ordersError}</div>
                    <button
                      onClick={loadOrders}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Попробовать снова
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <img
                      src={ordersIcon}
                      alt="Заказы"
                      className="w-24 h-24 mx-auto mb-4 opacity-50"
                    />
                    <p className="text-gray-500 mb-4">
                      У вас пока нет заказов
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Начать покупки
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const statusColors = {
                        created: 'bg-blue-100 text-blue-800',
                        updated: 'bg-yellow-100 text-yellow-800',
                        confirmed: 'bg-purple-100 text-purple-800',
                        shipped: 'bg-green-100 text-green-800',
                        canceled: 'bg-red-100 text-red-800',
                      };

                      const statusLabels = {
                        created: 'Создан',
                        updated: 'Обновлен',
                        confirmed: 'Подтвержден',
                        shipped: 'Отправлен',
                        canceled: 'Отменен',
                      };

                      return (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              Заказ {order.order_number}
                            </h3>
                            <span className={`px-3 py-1 text-sm rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                              {statusLabels[order.status] || order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Дата: {new Date(order.created_at).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Товаров: {order.total_items} шт.
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            Сумма: {formatPrice(order.total_price)}
                          </p>
                          <Link
                            to={`/order/${order.id}`}
                            className="mt-3 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors focus:outline-none focus:underline"
                          >
                            Подробнее →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Избранное {favoriteItems.length > 0 && `(${favoriteItems.length})`}
                  </h2>
                  <button
                    onClick={() => navigate('/favorites')}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Перейти на страницу избранного
                  </button>
                </div>

                {favoritesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : favoriteItems.length === 0 ? (
                  <div className="text-center py-12">
                    <img
                      src={favoriteIcon}
                      alt="Избранное"
                      className="w-24 h-24 mx-auto mb-4 opacity-50"
                    />
                    <p className="text-gray-500 mb-4">
                      У вас пока нет избранных товаров
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Перейти к покупкам
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {favoriteItems.map((product) => (
                      <li
                        key={product.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row gap-4 p-4">
                          {/* Изображение товара */}
                          <div className="flex-shrink-0">
                            <Link to={`/product/${product.id}`}>
                              <img
                                src={getImageUrl(product.main_image)}
                                alt={product.name}
                                className="w-full sm:w-24 h-24 object-cover rounded-md bg-gray-100"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                                }}
                              />
                            </Link>
                          </div>

                          {/* Информация о товаре */}
                          <div className="flex-grow min-w-0">
                            <Link
                              to={`/product/${product.id}`}
                              className="block mb-2"
                            >
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                {product.name}
                              </h3>
                            </Link>

                            {/* Артикул и цена */}
                            <div className="text-sm text-gray-500">
                              {product.part_number && (
                                <p className="mb-1">Арт: {product.part_number}</p>
                              )}
                              <p className="text-lg font-bold text-gray-900">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </div>

                          {/* Кнопки действий */}
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                            <AddToCartButton
                              product={product}
                              className="px-4 py-2"
                            />
                            <FavoriteButton product={product} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
