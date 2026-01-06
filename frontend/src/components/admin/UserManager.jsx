import { useState, useEffect, useMemo } from 'react';
import { adminUsersAPI } from '../../api';
import EditUserModal from './EditUserModal';
import AdminTable from './AdminTable';
import { logger } from '../../utils/logger';
import { getUserFriendlyError } from '../../utils/errorMessages';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 20;

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * usersPerPage;
      const data = await adminUsersAPI.getAllUsers(skip, usersPerPage);

      // Handle different response formats
      if (Array.isArray(data)) {
        setUsers(data);
        setTotalUsers(data.length);
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
        setTotalUsers(data.total || data.users.length);
      } else {
        setUsers([]);
        setTotalUsers(0);
      }
    } catch (err) {
      const friendlyError = getUserFriendlyError(err);
      setError(friendlyError);
      logger.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    const query = searchTerm.toLowerCase();
    return users.filter((user) => {
      const firstName = (user.first_name || '').toLowerCase();
      const lastName = (user.last_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const city = (user.city || '').toLowerCase();

      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        email.includes(query) ||
        city.includes(query)
      );
    });
  }, [users, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage + 1;
  const endIndex = Math.min(currentPage * usersPerPage, totalUsers);

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle user update
  const handleUserUpdate = (updatedUser) => {
    // Update user in list
    setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    setShowEditModal(false);
    setSelectedUser(null);
  };

  // Define table columns configuration
  const columns = [
    {
      key: 'id',
      label: 'ID',
      className: 'whitespace-nowrap',
      render: (user) => <div className="text-sm text-gray-900">{user.id}</div>,
    },
    {
      key: 'first_name',
      label: 'Имя',
      className: 'whitespace-nowrap',
      render: (user) => <div className="text-sm text-gray-900">{user.first_name || '-'}</div>,
    },
    {
      key: 'last_name',
      label: 'Фамилия',
      className: 'whitespace-nowrap',
      render: (user) => <div className="text-sm text-gray-900">{user.last_name || '-'}</div>,
    },
    {
      key: 'email',
      label: 'Email',
      className: 'whitespace-nowrap',
      render: (user) => <div className="text-sm text-gray-900">{user.email}</div>,
    },
    {
      key: 'city',
      label: 'Город',
      className: 'whitespace-nowrap',
      render: (user) => <div className="text-sm text-gray-900">{user.city || '-'}</div>,
    },
    {
      key: 'status',
      label: 'Статус',
      className: 'whitespace-nowrap text-center',
      headerClassName: 'text-center',
      render: (user) =>
        user.is_active ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Активен
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Неактивен
          </span>
        ),
    },
    {
      key: 'admin',
      label: 'Админ',
      className: 'whitespace-nowrap text-center',
      headerClassName: 'text-center',
      render: (user) =>
        user.is_superuser ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];

  // Define table actions
  const actions = [
    {
      label: 'Редактировать',
      onClick: handleEditUser,
      className: 'text-indigo-600 hover:text-indigo-900',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управление пользователями</h2>
          <p className="mt-1 text-sm text-gray-500">Всего пользователей: {totalUsers}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Поиск
          </label>
          <input
            type="text"
            id="search"
            placeholder="Имя, фамилия, email, город..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{getUserFriendlyError(error)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <AdminTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage={
          searchTerm ? 'Попробуйте изменить параметры поиска' : 'Пока нет пользователей в системе'
        }
        actions={actions}
      />

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперед
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Показано <span className="font-medium">{startIndex}</span> -{' '}
                <span className="font-medium">{endIndex}</span> из{' '}
                <span className="font-medium">{totalUsers}</span> результатов
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Предыдущая страница"
                >
                  <span className="sr-only">Предыдущая</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                      aria-label={`Страница ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Следующая страница"
                >
                  <span className="sr-only">Следующая</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
};

export default UserManager;
