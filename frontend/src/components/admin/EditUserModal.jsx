import { useState, useEffect } from 'react';
import { adminUsersAPI } from '../../api';
import { logger } from '../../utils/logger';
import { getUserFriendlyError, getUserFriendlyErrorWithContext } from '../../utils/errorMessages';
import AdminModal from './AdminModal';

const EditUserModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    telegram_id: '',
    date_of_birth: '',
    is_active: true,
    is_superuser: false,
    is_verified: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        address: user.address || '',
        telegram_id: user.telegram_id || '',
        date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '',
        is_active: user.is_active ?? true,
        is_superuser: user.is_superuser ?? false,
        is_verified: user.is_verified ?? false,
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data for update - only include fields that can be updated
      const updateData = {
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        phone: formData.phone || null,
        city: formData.city || null,
        address: formData.address || null,
        telegram_id: formData.telegram_id || null,
        date_of_birth: formData.date_of_birth || null,
        is_active: formData.is_active,
        is_superuser: formData.is_superuser,
        is_verified: formData.is_verified,
      };

      const updatedUser = await adminUsersAPI.updateUser(user.id, updateData);
      onUpdate(updatedUser);
    } catch (err) {
      const friendlyError = getUserFriendlyErrorWithContext(err, 'при обновлении пользователя');
      setError(friendlyError);
      logger.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={!!user}
      onClose={onClose}
      title="Редактировать пользователя"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      size="large"
      closeOnBackdropClick={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            Имя
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
            Фамилия
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">Email нельзя изменить</p>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Телефон
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Город
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
            Дата рождения
          </label>
          <input
            type="date"
            id="date_of_birth"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Telegram ID */}
        <div>
          <label htmlFor="telegram_id" className="block text-sm font-medium text-gray-700 mb-1">
            Telegram ID
          </label>
          <input
            type="text"
            id="telegram_id"
            name="telegram_id"
            value={formData.telegram_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Address (full width) */}
      <div className="mt-4">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Адрес
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Status Checkboxes */}
      <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900">Статусы</h4>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
            Активен (пользователь может входить в систему)
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_superuser"
            name="is_superuser"
            checked={formData.is_superuser}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_superuser" className="ml-2 text-sm text-gray-700">
            Администратор (доступ к админ-панели)
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_verified"
            name="is_verified"
            checked={formData.is_verified}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_verified" className="ml-2 text-sm text-gray-700">
            Верифицирован (email подтвержден)
          </label>
        </div>
      </div>
    </AdminModal>
  );
};

export default EditUserModal;
