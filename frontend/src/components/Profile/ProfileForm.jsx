/**
 * ProfileForm - форма редактирования профиля пользователя
 */
function ProfileForm({
  profileData,
  validationErrors,
  loading,
  onInputChange,
  onSubmit,
  onCancel
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onInputChange}
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
          className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

export default ProfileForm;
