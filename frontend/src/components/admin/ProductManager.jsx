import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  clearError
} from '../../store/slices/productsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { getImageUrl, formatPrice } from '../../utils';
import { brandsAPI } from '../../api';

const ProductManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [brands, setBrands] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    description: '',
    price: '',
    category_id: '',
    brand_id: '',
    is_active: true,
    images: null,
  });

  const modalRef = useRef(null);
  const addButtonRef = useRef(null);

  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  useEffect(() => {
    // Определяем параметр isActive на основе фильтра статуса
    let isActive = true; // по умолчанию только активные
    if (statusFilter === 'inactive') {
      isActive = false;
    } else if (statusFilter === 'all') {
      isActive = undefined; // все продукты (не передаем параметр)
    }
    
    dispatch(fetchProducts({ isActive }));
    dispatch(fetchCategories());
    
    // Загружаем бренды
    const loadBrands = async () => {
      try {
        const brandsData = await brandsAPI.getBrands(0, 100, true);
        setBrands(brandsData);
      } catch (err) {
        console.error('Failed to load brands:', err);
      }
    };
    loadBrands();
  }, [dispatch, statusFilter]);

  // Focus management for modal
  useEffect(() => {
    if (showModal && modalRef.current) {
      // Save the currently focused element
      const previouslyFocusedElement = document.activeElement;

      // Focus the modal
      modalRef.current.focus();

      // Return focus when modal closes
      return () => {
        if (previouslyFocusedElement && previouslyFocusedElement.focus) {
          previouslyFocusedElement.focus();
        }
      };
    }
  }, [showModal]);

  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Проверяем, что product существует и имеет необходимые свойства
      if (!product || !product.name) {
        return false;
      }
      
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !selectedCategory || (product.category_id && product.category_id.toString() === selectedCategory);
      
      // Фильтрация по статусу уже происходит на уровне API, но можем добавить дополнительную фильтрацию
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = product.is_active === true;
      } else if (statusFilter === 'inactive') {
        matchesStatus = product.is_active === false;
      }
      // Если statusFilter === 'all', то matchesStatus остается true
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, statusFilter]);

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
      images: Array.from(e.target.files)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('part_number', formData.part_number);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('brand_id', formData.brand_id);
    formDataToSend.append('is_active', formData.is_active.toString());
    
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });
    }

    try {
      if (editingProduct) {
        await dispatch(updateProduct({ 
          categoryId: editingProduct.category_id,
          productId: editingProduct.id, 
          formData: formDataToSend 
        })).unwrap();
      } else {
        // Добавляем category_id в FormData для создания продукта
        formDataToSend.append('category_id', formData.category_id);
        await dispatch(createProduct({ 
          categoryId: formData.category_id, 
          formData: formDataToSend 
        })).unwrap();
      }
      
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        part_number: '',
        description: '', 
        price: '', 
        category_id: '',
        brand_id: '',
        images: null 
      });
    } catch (err) {
      // Ошибка уже обработана в slice
    }
  };

  const handleEdit = (product) => {
    dispatch(clearError());
    setEditingProduct(product);
    setFormData({
      name: product.name,
      part_number: product.part_number || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '0',
      category_id: product.category_id ? product.category_id.toString() : '',
      brand_id: product.brand_id ? product.brand_id.toString() : '',
      is_active: product.is_active,
      images: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (product) => {
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        await dispatch(deleteProduct({ 
          categoryId: product.category_id, 
          productId: product.id 
        })).unwrap();
        // Закрываем модальное окно после успешного удаления
        handleCloseModal();
      } catch (err) {
        // Ошибка уже обработана в slice
      }
    }
  };


  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      part_number: '',
      description: '', 
      price: '', 
      category_id: '',
      brand_id: '',
      is_active: true,
      images: null 
    });
    dispatch(clearError());
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Управление продуктами</h2>
        <button
          ref={addButtonRef}
          onClick={() => {
            dispatch(clearError());
            setShowModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Добавить продукт
        </button>
      </div>

      {/* Фильтры */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поиск по названию или описанию
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Введите название или описание..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фильтр по категории
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фильтр по статусу
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Все продукты</option>
              <option value="active">Только активные</option>
              <option value="inactive">Только неактивные</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Найдено: {filteredProducts.length} из {products.length} продуктов
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setStatusFilter('all');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            Сбросить фильтры
          </button>
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
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Изображение
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Артикул
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Бренд
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap w-24">
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
                  <td className="px-6 py-4 w-48">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 w-32">
                    <div className="text-sm text-gray-900 truncate">
                      {product.part_number || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 w-32">
                    <div className="text-sm text-gray-900 truncate">
                      {product.brand?.name || 'Не указан'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-28">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 w-40">
                    <div className="text-sm text-gray-900 truncate">
                      {product.category?.name || 'Не указана'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-28">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 whitespace-nowrap"
                    >
                      Редактировать
                    </button>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Продукты не найдены
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
            aria-labelledby="product-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <h3 id="product-modal-title" className="text-lg font-medium text-gray-900 mb-4">
                {editingProduct ? 'Редактировать продукт' : 'Добавить продукт'}
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
                    Каталожный номер
                  </label>
                  <input
                    type="text"
                    name="part_number"
                    value={formData.part_number}
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
                    Цена
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {!editingProduct && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Категория
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Бренд
                  </label>
                  <select
                    name="brand_id"
                    value={formData.brand_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Выберите бренд</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Изображения
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
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
                      Продукт активен
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingProduct)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Удалить
                    </button>
                  )}
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
    </div>
  );
};

export default ProductManager;
