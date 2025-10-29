import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  clearError
} from '../../store/slices/categoriesSlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import { getImageUrl, formatPrice } from '../../utils';

const CategoryManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    icon: null,
    is_active: true,
  });

  const modalRef = useRef(null);
  const detailModalRef = useRef(null);
  const addButtonRef = useRef(null);

  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.categories);
  const { products: categoryProducts, loading: productsLoading } = useSelector((state) => state.products);

  useEffect(() => {
    // Определяем параметр isActive на основе фильтра статуса
    let isActive = true; // по умолчанию только активные
    if (statusFilter === 'inactive') {
      isActive = false;
    } else if (statusFilter === 'all') {
      isActive = undefined; // все категории (не передаем параметр)
    }
    
    dispatch(fetchCategories({ isActive }));
  }, [dispatch, statusFilter]);

  // Focus management for category form modal
  useEffect(() => {
    if (showModal && modalRef.current) {
      const previouslyFocusedElement = document.activeElement;
      modalRef.current.focus();

      return () => {
        if (previouslyFocusedElement && previouslyFocusedElement.focus) {
          previouslyFocusedElement.focus();
        }
      };
    }
  }, [showModal]);

  // Focus management for detail modal
  useEffect(() => {
    if (showProducts && detailModalRef.current) {
      const previouslyFocusedElement = document.activeElement;
      detailModalRef.current.focus();

      return () => {
        if (previouslyFocusedElement && previouslyFocusedElement.focus) {
          previouslyFocusedElement.focus();
        }
      };
    }
  }, [showProducts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  const handleIconChange = (e) => {
    setFormData(prev => ({
      ...prev,
      icon: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('is_active', formData.is_active.toString());
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }
    if (formData.icon) {
      formDataToSend.append('icon', formData.icon);
    }

    try {
      if (editingCategory) {
        await dispatch(updateCategory({ 
          categoryId: editingCategory.id, 
          formData: formDataToSend 
        })).unwrap();
      } else {
        await dispatch(createCategory(formDataToSend)).unwrap();
      }
      
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', image: null, icon: null, is_active: true });
    } catch (err) {
      // Ошибка уже обработана в slice
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: null,
      icon: null,
      is_active: category.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      try {
        await dispatch(deleteCategory(categoryId)).unwrap();
      } catch (err) {
        // Ошибка уже обработана в slice
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', image: null, is_active: true });
    dispatch(clearError());
  };

  const handleViewProducts = (category) => {
    setSelectedCategory(category);
    setShowProducts(true);
    dispatch(fetchProducts({ categoryId: category.id }));
  };

  const handleCloseProducts = () => {
    setShowProducts(false);
    setSelectedCategory(null);
  };

  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setShowProducts(true);
    dispatch(fetchProducts({ categoryId: category.id }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Управление категориями</h2>
        <button
          ref={addButtonRef}
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Добавить категорию
        </button>
      </div>

      {/* Фильтры */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="block text-sm font-medium text-gray-700">
              Фильтр по статусу
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Все категории</option>
              <option value="active">Только активные</option>
              <option value="inactive">Только неактивные</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Найдено: {categories.length} категорий
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Ошибка
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div 
                key={category.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleViewCategory(category)}
              >
                <div className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {category.image_url ? (
                        <img
                          src={getImageUrl(category.image_url)}
                          alt={`${category.name} category`}
                          className="h-16 w-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center"
                        style={{ display: category.image_url ? 'none' : 'flex' }}
                      >
                        <span className="text-gray-400 text-xs">Нет фото</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {category.name}
                      </h3>
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <div className="text-gray-500">Категории не найдены</div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]"
          onClick={handleCloseModal}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCloseModal();
            }
          }}
        >
          <div
            ref={modalRef}
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <h3 id="category-modal-title" className="text-lg font-medium text-gray-900 mb-4">
                {editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
              </h3>
              
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Изображение
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Иконка
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Небольшая иконка для отображения в карточке категории
                  </p>
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Категория активна
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Detail Modal */}
      {showProducts && selectedCategory && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[55]"
          onClick={handleCloseProducts}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCloseProducts();
            }
          }}
        >
          <div
            ref={detailModalRef}
            className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-detail-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {selectedCategory.image_url && (
                      <img
                        src={getImageUrl(selectedCategory.image_url)}
                        alt={`${selectedCategory.name} category`}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 id="category-detail-modal-title" className="text-2xl font-bold text-gray-900">
                      {selectedCategory.name}
                    </h3>
                    <p className="text-gray-600">
                      {selectedCategory.description || 'Нет описания'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(selectedCategory)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(selectedCategory.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Удалить
                  </button>
                  <button
                    onClick={handleCloseProducts}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Продукты категории
                </h4>
                
                {productsLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Загрузка продуктов...</div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Изображение
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Название
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Описание
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Цена
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoryProducts.length > 0 ? (
                        categoryProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              {product.main_image ? (
                                <img
                                  src={getImageUrl(product.main_image)}
                                  alt={`${product.name} product image`}
                                  className="h-12 w-12 rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center"
                                style={{ display: product.main_image ? 'none' : 'flex' }}
                              >
                                <span className="text-gray-400 text-xs">Нет фото</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {product.description || 'Нет описания'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatPrice(product.price)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.is_active ? 'Активен' : 'Неактивен'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            В этой категории пока нет продуктов
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
