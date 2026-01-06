/**
 * useAdminResource Hook
 *
 * A reusable hook for managing admin panel resources (CRUD operations)
 * Reduces code duplication across BrandManager, CategoryManager, ProductManager, etc.
 */

import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';
import { getUserFriendlyError } from '../utils/errorMessages';

/**
 * Custom hook for managing admin resources with CRUD operations
 *
 * @param {Object} config - Configuration object
 * @param {Function} config.fetchFn - Function to fetch items (optional filters parameter)
 * @param {Function} config.createFn - Function to create an item
 * @param {Function} config.updateFn - Function to update an item (id, formData)
 * @param {Function} config.deleteFn - Function to delete an item (id)
 * @param {Function} config.restoreFn - Function to restore a soft-deleted item (id, optional)
 * @param {string} config.resourceName - Name of resource for error messages (e.g., 'бренд', 'категорию')
 *
 * @returns {Object} Hook state and methods
 *
 * @example
 * const {
 *   items,
 *   loading,
 *   error,
 *   editingItem,
 *   setEditingItem,
 *   loadItems,
 *   handleCreate,
 *   handleUpdate,
 *   handleDelete,
 *   handleRestore,
 * } = useAdminResource({
 *   fetchFn: brandsAPI.getBrands,
 *   createFn: brandsAPI.createBrand,
 *   updateFn: brandsAPI.updateBrand,
 *   deleteFn: brandsAPI.deleteBrand,
 *   restoreFn: brandsAPI.restoreBrand,
 *   resourceName: 'бренд',
 * });
 */
export const useAdminResource = ({
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  restoreFn,
  resourceName = 'ресурс',
}) => {
  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  /**
   * Load items from API
   * @param {Object} filters - Optional filters for fetching items
   */
  const loadItems = useCallback(
    async (filters = {}) => {
      if (!fetchFn) {
        logger.error('fetchFn is not provided to useAdminResource');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchFn(filters);
        setItems(data);
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        logger.error(`Error loading ${resourceName}:`, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, resourceName]
  );

  /**
   * Create a new item
   * @param {Object|FormData} formData - Data for creating the item
   * @returns {Object} Result object with success status and optional error message
   */
  const handleCreate = useCallback(
    async (formData) => {
      if (!createFn) {
        const error = `createFn is not provided to useAdminResource`;
        logger.error(error);
        return { success: false, error };
      }

      setLoading(true);
      setError(null);

      try {
        await createFn(formData);
        await loadItems();
        return { success: true };
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        logger.error(`Error creating ${resourceName}:`, err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [createFn, loadItems, resourceName]
  );

  /**
   * Update an existing item
   * @param {number} id - ID of the item to update
   * @param {Object|FormData} formData - Updated data
   * @returns {Object} Result object with success status and optional error message
   */
  const handleUpdate = useCallback(
    async (id, formData) => {
      if (!updateFn) {
        const error = `updateFn is not provided to useAdminResource`;
        logger.error(error);
        return { success: false, error };
      }

      setLoading(true);
      setError(null);

      try {
        await updateFn(id, formData);
        await loadItems();
        setEditingItem(null);
        return { success: true };
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        logger.error(`Error updating ${resourceName}:`, err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [updateFn, loadItems, resourceName]
  );

  /**
   * Delete an item
   * @param {number} id - ID of the item to delete
   * @returns {Object} Result object with success status and optional error message
   */
  const handleDelete = useCallback(
    async (id) => {
      if (!deleteFn) {
        const error = `deleteFn is not provided to useAdminResource`;
        logger.error(error);
        return { success: false, error };
      }

      setLoading(true);
      setError(null);

      try {
        await deleteFn(id);
        await loadItems();
        return { success: true };
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        logger.error(`Error deleting ${resourceName}:`, err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [deleteFn, loadItems, resourceName]
  );

  /**
   * Restore a soft-deleted item
   * @param {number} id - ID of the item to restore
   * @returns {Object} Result object with success status and optional error message
   */
  const handleRestore = useCallback(
    async (id) => {
      if (!restoreFn) {
        const error = `restoreFn is not provided or not supported`;
        logger.warn(error);
        return { success: false, error };
      }

      setLoading(true);
      setError(null);

      try {
        await restoreFn(id);
        await loadItems();
        return { success: true };
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        logger.error(`Error restoring ${resourceName}:`, err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [restoreFn, loadItems, resourceName]
  );

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Start editing an item
   * @param {Object} item - Item to edit
   */
  const startEdit = useCallback((item) => {
    setEditingItem(item);
  }, []);

  /**
   * Cancel editing
   */
  const cancelEdit = useCallback(() => {
    setEditingItem(null);
    setError(null);
  }, []);

  return {
    // State
    items,
    loading,
    error,
    editingItem,

    // Setters
    setEditingItem,
    setItems,
    setError,

    // Operations
    loadItems,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleRestore,

    // Helpers
    clearError,
    startEdit,
    cancelEdit,
  };
};

export default useAdminResource;
