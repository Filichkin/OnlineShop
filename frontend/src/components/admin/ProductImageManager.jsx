import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { productsImageAPI } from '../../api';
import { sanitizeText } from '../../utils/sanitize';
import { logger } from '../../utils/logger';
import { handleApiError } from '../../utils/errorHandler';

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

  // Use ref for onClose to avoid memory leaks
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsImageAPI.getImages(productId);
      setImages(data);
    } catch (err) {
      logger.error('Error loading images:', err);

      const handledError = handleApiError(err);
      if (handledError) {
        setError(handledError.message);
      } else {
        setError('Ошибка загрузки изображений');
      }
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

    // Client-side validation
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const invalidFiles = files.filter(file => {
      if (!validFormats.includes(file.type)) {
        return true;
      }
      if (file.size > maxFileSize) {
        return true;
      }
      return false;
    });

    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(f => f.name).join(', ');
      setError(`Неверный формат или размер файлов: ${invalidNames}. Поддерживаются JPEG, PNG, GIF, WebP (макс. 10MB)`);
      e.target.value = '';
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      await productsImageAPI.addImages(productId, formData);
      await loadImages();
      e.target.value = '';
    } catch (err) {
      logger.error('Error adding images:', err);
      const handledError = handleApiError(err);
      if (handledError) {
        setError(handledError.message);
      } else {
        setError(err.message || 'Ошибка добавления изображений');
      }
    } finally {
      setLoading(false);
    }
  };

  // Установить главное изображение
  const handleSetMainImage = async (mediaId) => {
    setLoading(true);
    setError(null);
    try {
      await productsImageAPI.updateMainImage(productId, mediaId);
      await loadImages();
    } catch (err) {
      logger.error('Error setting main image:', err);
      const handledError = handleApiError(err);
      if (handledError) {
        setError(handledError.message);
      } else {
        setError(err.message || 'Ошибка установки главного изображения');
      }
    } finally {
      setLoading(false);
    }
  };

  // Удалить одно изображение
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Удалить это изображение?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await productsImageAPI.deleteImage(productId, imageId);
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
      await loadImages();
    } catch (err) {
      logger.error('Error deleting image:', err);
      const handledError = handleApiError(err);
      if (handledError) {
        setError(handledError.message);
      } else {
        setError(err.message || 'Ошибка удаления изображения');
      }
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
      // Удаляем каждое изображение по отдельности
      const deletePromises = Array.from(selectedImages).map(imageId =>
        productsImageAPI.deleteImage(productId, imageId)
      );

      await Promise.all(deletePromises);
      setSelectedImages(new Set());
      await loadImages();
    } catch (err) {
      logger.error('Error deleting selected images:', err);
      const handledError = handleApiError(err);
      if (handledError) {
        setError(handledError.message);
      } else {
        setError(err.message || 'Ошибка удаления изображений');
      }
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

    // Переставляем элементы локально для немедленного отображения
    newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);

    // Обновляем UI немедленно
    setImages(newImages);
    setDraggedImage(null);

    // Note: Reorder API endpoint might not be available
    // If needed, implement on backend side
    logger.log('Drag and drop reorder completed locally');
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
            onClick={() => onCloseRef.current()}
            className='text-gray-500 hover:text-gray-700'
            aria-label='Закрыть'
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
          <div className='flex flex-col gap-3'>
            <div className='flex gap-2'>
              <label className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors flex items-center gap-2'>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type='file'
                  multiple
                  accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
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
                  className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 transition-colors flex items-center gap-2'
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Удалить выбранные ({selectedImages.size})
                </button>
              )}
            </div>

            <div className='text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2'>
              <p className="font-medium mb-1">Форматы: JPEG, PNG, GIF, WebP</p>
              <p>Максимальный размер: 10 MB на файл</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className='p-4 bg-red-100 text-red-700 border-l-4 border-red-500'>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{sanitizeText(error)}</p>
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
                      aria-label={`Выбрать изображение ${image.order}`}
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
                    src={image.url.startsWith('http') ? image.url : `${import.meta.env.VITE_API_BASE_URL || '/api'}/../${image.url}`}
                    alt={`Product ${image.order}`}
                    className='w-full h-48 object-cover'
                  />

                  {/* Действия */}
                  <div className='p-2 bg-white'>
                    <div className='text-xs text-gray-500 mb-2'>
                      Порядок: {image.order}
                    </div>
                    <div className="flex gap-1">
                      {!image.is_main && (
                        <button
                          onClick={() => handleSetMainImage(image.id)}
                          disabled={loading}
                          className='flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300'
                        >
                          Сделать главным
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={loading}
                        className='px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300'
                        aria-label='Удалить изображение'
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t bg-gray-50 text-sm text-gray-600'>
          <p>
            Перетаскивайте изображения для изменения их порядка
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
