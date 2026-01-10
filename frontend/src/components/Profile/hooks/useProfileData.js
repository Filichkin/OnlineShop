import { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';

/**
 * Hook для управления данными профиля
 */
export function useProfileData(user) {
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
          logger.error('Error formatting date_of_birth:', e, user.date_of_birth);
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

  return [profileData, setProfileData];
}
