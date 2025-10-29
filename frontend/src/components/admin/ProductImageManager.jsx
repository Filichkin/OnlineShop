import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Компонент для управления изображениями продукта
 *
 * Функции:
 * - Просмотр всех изображений продукта
 * - Добавление новых изображений
 * - Установка главного изображения
 * - Удаление изображений
 * - Изменение порядка изображений (drag & drop)
 */
const ProductImageManager = ({ productId, onClose }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [draggedImage, setDraggedImage] = useState(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/products/${productId}/images`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setImages(data);
    } catch (err) {
      console.error('Error loading images:', err);
      
      // Более детальные сообщения об ошибках
      let errorMessage = 'Ошибка загрузки изображений';
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Не удается подключиться к серверу. Проверьте, что backend запущен на localhost:8000';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'Ошибка CORS. Проверьте настройки сервера';
      } else if (err.message.includes('404')) {
        errorMessage = 'Продукт не найден';
      } else if (err.message.includes('500')) {
        errorMessage = 'Внутренняя ошибка сервера';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Загрузить изображения при монтировании
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Добавить изображения
  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(
        `http://localhost:8000/products/${productId}/images`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка добавления изображений');
      }

      await loadImages();
      e.target.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Установить главное изображение
  const handleSetMainImage = async (mediaId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/products/${productId}/images/main`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ media_id: mediaId }),
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка установки главного изображения');
      }

      await loadImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Удалить выбранные изображения
  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return;

    if (
      !window.confirm(
        `Удалить ${selectedImages.size} изображений?`
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/products/${productId}/images`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            media_ids: Array.from(selectedImages),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка удаления изображений');
      }

      setSelectedImages(new Set());
      await loadImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Переключить выбор изображения
  const toggleImageSelection = (imageId) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  // Drag & Drop для изменения порядка
  const handleDragStart = (e, image) => {
    setDraggedImage(image);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetImage) => {
    e.preventDefault();
    if (!draggedImage || draggedImage.id === targetImage.id) {
      return;
    }

    const newImages = [...images];
    const draggedIndex = newImages.findIndex(
      (img) => img.id === draggedImage.id
    );
    const targetIndex = newImages.findIndex(
      (img) => img.id === targetImage.id
    );

    // Переставляем элементы
    newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);

    // Обновляем порядок
    const orderUpdates = newImages.map((img, index) => ({
      media_id: img.id,
      order: index,
    }));

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/products/${productId}/images/reorder`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order_updates: orderUpdates }),
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка изменения порядка изображений');
      }

      await loadImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDraggedImage(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b'>
          <h2 className='text-xl font-semibold'>
            Управление изображениями продукта
          </h2>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className='p-4 border-b bg-gray-50'>
          <div className='flex gap-2'>
            <label className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer'>
              <input
                type='file'
                multiple
                accept='image/*'
                onChange={handleAddImages}
                className='hidden'
                disabled={loading}
              />
              Добавить изображения
            </label>

            {selectedImages.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={loading}
                className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300'
              >
                Удалить выбранные ({selectedImages.size})
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className='p-4 bg-red-100 text-red-700 border-l-4 border-red-500'>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-1">
                  Проверьте подключение к серверу и попробуйте снова
                </p>
              </div>
              <button
                onClick={loadImages}
                disabled={loading}
                className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                {loading ? 'Загрузка...' : 'Повторить'}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className='p-4 overflow-y-auto max-h-[calc(90vh-200px)]'>
          {loading && images.length === 0 ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
            </div>
          ) : images.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              Нет изображений. Добавьте новые изображения.
            </div>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {images.map((image) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, image)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, image)}
                  onDragEnd={handleDragEnd}
                  className={`relative border rounded-lg overflow-hidden cursor-move hover:shadow-lg transition-shadow ${
                    selectedImages.has(image.id)
                      ? 'ring-2 ring-blue-500'
                      : ''
                  } ${
                    draggedImage?.id === image.id
                      ? 'opacity-50'
                      : ''
                  }`}
                >
                  {/* Checkbox для выбора */}
                  <div className='absolute top-2 left-2 z-10'>
                    <input
                      type='checkbox'
                      checked={selectedImages.has(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      className='w-5 h-5 cursor-pointer'
                    />
                  </div>

                  {/* Бейдж главного изображения */}
                  {image.is_main && (
                    <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded'>
                      Главное
                    </div>
                  )}

                  {/* Изображение */}
                  <img
                    src={`http://localhost:8000/${image.url}`}
                    alt={`Product ${image.order}`}
                    className='w-full h-48 object-cover'
                  />

                  {/* Действия */}
                  <div className='p-2 bg-white'>
                    <div className='text-xs text-gray-500 mb-2'>
                      Порядок: {image.order}
                    </div>
                    {!image.is_main && (
                      <button
                        onClick={() => handleSetMainImage(image.id)}
                        disabled={loading}
                        className='w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300'
                      >
                        Сделать главным
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t bg-gray-50 text-sm text-gray-600'>
          <p>
            💡 Перетаскивайте изображения для изменения их порядка
          </p>
        </div>
      </div>
    </div>
  );
};

ProductImageManager.propTypes = {
  productId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProductImageManager;

