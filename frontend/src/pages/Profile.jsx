import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { logout, updateProfile, clearError, clearSuccessMessage } from '../store/slices/authSlice';
import { formatPhoneNumber } from '../utils/validation';
import { logger } from '../utils/logger';
import ordersIcon from '../assets/images/orders.webp';
import favoriteIcon from '../assets/images/favorite.webp';
import profileIcon from '../assets/images/profile.webp';
import {
  LoadingSpinner,
  ProfileSidebar,
  ProfileInfo,
  OrdersList,
  useProfileData,
  useProfileValidation,
  useOrders
} from '../components/Profile';

/**
 * Profile компонент - страница профиля пользователя
 *
 * Содержит два раздела:
 * - Профайл: просмотр и редактирование профиля
 * - Заказы: список заказов пользователя
 * - Избранное: ссылка для перехода на страницу избранного
 */
function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, error, successMessage, isAuthenticated, authChecked } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  // Custom hooks
  const [profileData, setProfileData] = useProfileData(user);
  const { validationErrors, validateForm, clearFieldError, clearAllErrors } = useProfileValidation();
  const { orders, ordersLoading, ordersError, loadOrders } = useOrders(activeTab, user);

  const tabs = [
    { id: 'profile', label: 'Профайл', icon: profileIcon },
    { id: 'orders', label: 'Заказы', icon: ordersIcon },
    { id: 'favorites', label: 'Избранное', icon: favoriteIcon },
  ];

  // Check if we should open orders tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'orders') {
      setActiveTab('orders');
    }
  }, [searchParams]);

  // Check authentication and redirect if needed
  // NOTE: Token validation happens in Header before navigation
  // This is a fallback for edge cases
  // Wait for authChecked to be true before redirecting to avoid flickering
  useEffect(() => {
    if (authChecked && !isAuthenticated && !loading) {
      // Session expired or user not logged in - redirect to home
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate, authChecked]);

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
    clearFieldError(name);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!validateForm(profileData)) {
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
      logger.error('Profile update error:', err);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to user data
    if (user) {
      const formattedDate = user.date_of_birth || '';
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
    clearAllErrors();
    setIsEditing(false);
    dispatch(clearError());
  };

  // Show loading state while auth is being checked or user data is being fetched
  // Wait for authChecked before deciding what to show
  if (!authChecked || loading || (!isAuthenticated && !authChecked)) {
    return (
      <div className="container py-8">
        <LoadingSpinner message="Загрузка профиля..." />
      </div>
    );
  }

  // If not authenticated after auth check completed, don't render anything (redirect will happen via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="container py-8">
        <LoadingSpinner message="Загрузка профиля..." />
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-colors"
        >
          Выйти
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <ProfileSidebar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <ProfileInfo
                isEditing={isEditing}
                profileData={profileData}
                validationErrors={validationErrors}
                loading={loading}
                error={error}
                successMessage={successMessage}
                onEditStart={() => setIsEditing(true)}
                onInputChange={handleInputChange}
                onSubmit={handleSaveProfile}
                onCancel={handleCancelEdit}
              />
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <OrdersList
                orders={orders}
                loading={ordersLoading}
                error={ordersError}
                onRetry={loadOrders}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
