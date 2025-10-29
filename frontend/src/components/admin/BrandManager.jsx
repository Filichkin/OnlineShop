import { useState, useEffect } from 'react';
import { brandsAPI } from '../../api';

const BrandManager = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });

  useEffect(() => {
    loadBrands();
  }, [statusFilter]);

  const loadBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      let isActive = true;
      if (statusFilter === 'inactive') {
        isActive = false;
      } else if (statusFilter === 'all') {
        isActive = undefined;
      }
      
      const data = await brandsAPI.getBrands(0, 100, isActive);
      setBrands(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (editingBrand) {
        await brandsAPI.updateBrand(editingBrand.id, formData);
      } else {
        await brandsAPI.createBrand(formData);
      }
      
      setShowModal(false);
      setEditingBrand(null);
      setFormData({ name: '', is_active: true });
      loadBrands();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      is_active: brand.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (brandId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот бренд?')) {
      try {
        await brandsAPI.deleteBrand(brandId);
        loadBrands();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleRestore = async (brandId) => {
    try {
      await brandsAPI.restoreBrand(brandId);
      loadBrands();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBrand(null);
    setFormData({ name: '', is_active: true });
    setError(null);
  };

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Управление брендами</h2>
        <button
          onClick={() => setShowModal(true)}
          className='bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium'
        >
          Добавить бренд
        </button>
      </div>

      {/* Фильтры */}
      <div className='mb-6 bg-white p-4 rounded-lg shadow'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <label className='block text-sm font-medium text-gray-700'>
              Фильтр по статусу
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
            >
              <option value='all'>Все бренды</option>
              <option value='active'>Только активные</option>
              <option value='inactive'>Только неактивные</option>
            </select>
          </div>
          <div className='text-sm text-gray-500'>
            Найдено: {brands.length} брендов
          </div>
        </div>
      </div>

      {error && (
        <div className='mb-4 rounded-md bg-red-50 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>
                Ошибка
              </h3>
              <div className='mt-2 text-sm text-red-700'>
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className='text-center py-8'>
          <div className='text-gray-500'>Загрузка...</div>
        </div>
      ) : (
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  ID
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48'>
                  Название
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32'>
                  Статус
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {brands.length > 0 ? (
                brands.map((brand) => (
                  <tr key={brand.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap w-20'>
                      <div className='text-sm text-gray-900'>{brand.id}</div>
                    </td>
                    <td className='px-6 py-4 w-48'>
                      <div className='text-sm font-medium text-gray-900 truncate'>
                        {brand.name}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap w-32'>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        brand.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {brand.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm font-medium'>
                      <div className='flex gap-4 whitespace-nowrap'>
                        <button
                          onClick={() => handleEdit(brand)}
                          className='text-indigo-600 hover:text-indigo-900'
                        >
                          Редактировать
                        </button>
                        {brand.is_active ? (
                          <button
                            onClick={() => handleDelete(brand.id)}
                            className='text-red-600 hover:text-red-900'
                          >
                            Удалить
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(brand.id)}
                            className='text-green-600 hover:text-green-900'
                          >
                            Восстановить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='4' className='px-6 py-4 text-center text-gray-500'>
                    Бренды не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]'
          onClick={handleCloseModal}
        >
          <div
            className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                {editingBrand ? 'Редактировать бренд' : 'Добавить бренд'}
              </h3>
              
              {error && (
                <div className='mb-4 rounded-md bg-red-50 p-4'>
                  <div className='text-sm text-red-700'>{error}</div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Название
                  </label>
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                  />
                </div>

                <div className='mb-4'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      name='is_active'
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className='rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                    />
                    <span className='ml-2 text-sm text-gray-700'>
                      Бренд активен
                    </span>
                  </label>
                </div>

                <div className='flex justify-end space-x-3'>
                  <button
                    type='button'
                    onClick={handleCloseModal}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md'
                  >
                    Отмена
                  </button>
                  <button
                    type='submit'
                    disabled={loading}
                    className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50'
                  >
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandManager;

