import { logger } from '../../utils/logger';

/**
 * ProfileDisplay - компонент для отображения данных профиля в режиме просмотра
 */
function ProfileDisplay({ profileData }) {
  const formatDateOfBirth = (dateStr) => {
    if (!dateStr) return '-';

    try {
      // If it's already in YYYY-MM-DD format, parse it directly
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
      logger.error('Error formatting date_of_birth:', e, dateStr);
      return dateStr;
    }
  };

  return (
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
          <p className="mt-1 text-gray-900">{formatDateOfBirth(profileData.date_of_birth)}</p>
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
  );
}

export default ProfileDisplay;
