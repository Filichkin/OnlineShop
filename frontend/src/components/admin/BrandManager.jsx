import { useState, useEffect } from 'react';
import { brandsAPI } from '../../api';
import { getImageUrl } from '../../utils';
import { useAdminResource } from '../../hooks/useAdminResource';
import AdminTable from './AdminTable';
import AdminModal from './AdminModal';

const BrandManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    is_active: true,
  });

  // Use the reusable useAdminResource hook
  const {
    items: brands,
    loading,
    error,
    editingItem: editingBrand,
    setError,
    loadItems,
    handleCreate,
    handleUpdate,
    handleRestore,
    startEdit,
    cancelEdit,
  } = useAdminResource({
    fetchFn: (filters = {}) => brandsAPI.getBrands(
      filters.skip || 0,
      filters.limit || 100,
      filters.isActive
    ),
    createFn: brandsAPI.createBrand,
    updateFn: brandsAPI.updateBrand,
    deleteFn: brandsAPI.deleteBrand,
    restoreFn: brandsAPI.restoreBrand,
    resourceName: 'бренд',
  });

  // Load brands on mount and when status filter changes
  useEffect(() => {
    let isActive = true;
    if (statusFilter === 'inactive') {
      isActive = false;
    } else if (statusFilter === 'all') {
      isActive = undefined;
    }

    loadItems({ skip: 0, limit: 100, isActive });
  }, [statusFilter, loadItems]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('is_active', formData.is_active.toString());
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    const result = editingBrand
      ? await handleUpdate(editingBrand.id, formDataToSend)
      : await handleCreate(formDataToSend);

    if (result.success) {
      handleCloseModal();
    }
  };

  // Handle edit button click
  const handleEdit = (brand) => {
    startEdit(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      image: null,
      is_active: brand.is_active,
    });
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    cancelEdit();
    setFormData({ name: '', description: '', image: null, is_active: true });
  };

  // Define table columns configuration
  const columns = [
    {
      key: 'image',
      label: 'Изображение',
      className: 'whitespace-nowrap',
      render: (brand) => (
        <div className="relative h-12 w-12">
          {brand.image ? (
            <img
              src={getImageUrl(brand.image)}
              alt={`${brand.name} brand image`}
              className="h-12 w-12 rounded-lg object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center"
            style={{ display: brand.image ? 'none' : 'flex' }}
          >
            <span className="text-gray-400 text-xs">Нет фото</span>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Название',
      className: 'whitespace-nowrap',
      render: (brand) => <div className="text-sm font-medium text-gray-900">{brand.name}</div>,
    },
    {
      key: 'description',
      label: 'Описание',
      render: (brand) => (
        <div className="text-sm text-gray-900 max-w-xs truncate">
          {brand.description || 'Нет описания'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Статус',
      className: 'whitespace-nowrap',
      render: (brand) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            brand.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {brand.is_active ? 'Активен' : 'Неактивен'}
        </span>
      ),
    },
  ];

  // Define table actions
  const actions = [
    {
      label: 'Редактировать',
      onClick: handleEdit,
      className: 'text-indigo-600 hover:text-indigo-900',
    },
    {
      label: 'Восстановить',
      onClick: (brand) => handleRestore(brand.id),
      className: 'text-green-600 hover:text-green-900',
      show: (brand) => !brand.is_active,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Управление брендами</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Добавить бренд
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="block text-sm font-medium text-gray-700">Фильтр по статусу</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Все бренды</option>
              <option value="active">Только активные</option>
              <option value="inactive">Только неактивные</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">Найдено: {brands.length} брендов</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
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
              <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <AdminTable
        columns={columns}
        data={brands}
        loading={loading}
        emptyMessage="Бренды не найдены"
        actions={actions}
      />

      {/* Modal */}
      <AdminModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingBrand ? 'Редактировать бренд' : 'Добавить бренд'}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        size="small"
        closeOnBackdropClick={false}
      >
        {/* Name Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Image Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Изображение</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {editingBrand && formData.image && (
            <p className="mt-1 text-xs text-green-600">Новое изображение выбрано</p>
          )}
          {editingBrand && !formData.image && editingBrand.image && (
            <div className="mt-2">
              <img
                src={getImageUrl(editingBrand.image)}
                alt="Текущее изображение"
                className="h-20 w-20 rounded-lg object-cover"
              />
              <p className="mt-1 text-xs text-gray-500">Текущее изображение</p>
            </div>
          )}
        </div>

        {/* Active Checkbox */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
              }
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Бренд активен</span>
          </label>
        </div>
      </AdminModal>
    </div>
  );
};

export default BrandManager;
