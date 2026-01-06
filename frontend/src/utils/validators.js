/**
 * Data Validation Utilities
 *
 * Provides validation functions for data received from API
 * to prevent application crashes from unexpected data structures
 */

import { logger } from './logger';

/**
 * Validate a single cart item
 * @param {object} item - Cart item to validate
 * @returns {boolean} True if item is valid
 */
export const validateCartItem = (item) => {
  if (!item || typeof item !== 'object') {
    logger.warn('Invalid cart item: not an object', item);
    return false;
  }

  if (!item.product || typeof item.product !== 'object') {
    logger.warn('Invalid cart item: missing or invalid product', item);
    return false;
  }

  if (typeof item.product.id !== 'number') {
    logger.warn('Invalid cart item: product.id is not a number', item);
    return false;
  }

  if (typeof item.quantity !== 'number' || item.quantity < 0) {
    logger.warn('Invalid cart item: invalid quantity', item);
    return false;
  }

  if (typeof item.price_at_addition !== 'number' || item.price_at_addition < 0) {
    logger.warn('Invalid cart item: invalid price_at_addition', item);
    return false;
  }

  return true;
};

/**
 * Validate cart response from API
 * @param {object} data - Cart response data
 * @returns {object} Validated cart data with filtered items
 * @throws {Error} If data structure is completely invalid
 */
export const validateCartResponse = (data) => {
  if (!data || typeof data !== 'object') {
    logger.error('Invalid cart response: not an object', data);
    throw new Error('Invalid cart response structure');
  }

  if (!Array.isArray(data.items)) {
    logger.error('Invalid cart response: items is not an array', data);
    throw new Error('Invalid cart response structure');
  }

  const validItems = data.items.filter(validateCartItem);

  if (validItems.length !== data.items.length) {
    logger.warn(`Filtered ${data.items.length - validItems.length} invalid cart items`);
  }

  return {
    ...data,
    items: validItems,
  };
};

/**
 * Validate a single favorite item
 * @param {object} item - Favorite item to validate
 * @returns {boolean} True if item is valid
 */
export const validateFavoriteItem = (item) => {
  if (!item || typeof item !== 'object') {
    logger.warn('Invalid favorite item: not an object', item);
    return false;
  }

  if (typeof item.id !== 'number') {
    logger.warn('Invalid favorite item: id is not a number', item);
    return false;
  }

  if (!item.name || typeof item.name !== 'string') {
    logger.warn('Invalid favorite item: missing or invalid name', item);
    return false;
  }

  // Price is optional but should be valid if present
  if (item.price !== undefined && (typeof item.price !== 'number' || item.price < 0)) {
    logger.warn('Invalid favorite item: invalid price', item);
    return false;
  }

  return true;
};

/**
 * Validate favorites response from API
 * @param {object} data - Favorites response data
 * @returns {object} Validated favorites data with filtered items
 * @throws {Error} If data structure is completely invalid
 */
export const validateFavoritesResponse = (data) => {
  if (!data || typeof data !== 'object') {
    logger.error('Invalid favorites response: not an object', data);
    throw new Error('Invalid favorites response structure');
  }

  if (!Array.isArray(data.items)) {
    logger.error('Invalid favorites response: items is not an array', data);
    throw new Error('Invalid favorites response structure');
  }

  // Extract product from each favorite item
  const products = data.items.map(item => item.product).filter(Boolean);
  const validProducts = products.filter(validateFavoriteItem);

  if (validProducts.length !== products.length) {
    logger.warn(`Filtered ${products.length - validProducts.length} invalid favorite items`);
  }

  return {
    ...data,
    items: data.items.filter(item => validateFavoriteItem(item.product)),
  };
};

/**
 * Validate a single product
 * @param {object} product - Product to validate
 * @returns {boolean} True if product is valid
 */
export const validateProduct = (product) => {
  if (!product || typeof product !== 'object') {
    logger.warn('Invalid product: not an object', product);
    return false;
  }

  if (typeof product.id !== 'number') {
    logger.warn('Invalid product: id is not a number', product);
    return false;
  }

  if (!product.name || typeof product.name !== 'string') {
    logger.warn('Invalid product: missing or invalid name', product);
    return false;
  }

  if (typeof product.price !== 'number' || product.price < 0) {
    logger.warn('Invalid product: invalid price', product);
    return false;
  }

  // Slug is required for routing
  if (!product.slug || typeof product.slug !== 'string') {
    logger.warn('Invalid product: missing or invalid slug', product);
    return false;
  }

  return true;
};

/**
 * Validate products array
 * @param {Array} products - Array of products to validate
 * @returns {Array} Filtered array of valid products
 */
export const validateProducts = (products) => {
  if (!Array.isArray(products)) {
    logger.error('Invalid products: not an array', products);
    return [];
  }

  const validProducts = products.filter(validateProduct);

  if (validProducts.length !== products.length) {
    logger.warn(`Filtered ${products.length - validProducts.length} invalid products`);
  }

  return validProducts;
};

/**
 * Validate a category object
 * @param {object} category - Category to validate
 * @returns {boolean} True if category is valid
 */
export const validateCategory = (category) => {
  if (!category || typeof category !== 'object') {
    logger.warn('Invalid category: not an object', category);
    return false;
  }

  if (typeof category.id !== 'number') {
    logger.warn('Invalid category: id is not a number', category);
    return false;
  }

  if (!category.name || typeof category.name !== 'string') {
    logger.warn('Invalid category: missing or invalid name', category);
    return false;
  }

  if (!category.slug || typeof category.slug !== 'string') {
    logger.warn('Invalid category: missing or invalid slug', category);
    return false;
  }

  return true;
};

/**
 * Validate categories array
 * @param {Array} categories - Array of categories to validate
 * @returns {Array} Filtered array of valid categories
 */
export const validateCategories = (categories) => {
  if (!Array.isArray(categories)) {
    logger.error('Invalid categories: not an array', categories);
    return [];
  }

  const validCategories = categories.filter(validateCategory);

  if (validCategories.length !== categories.length) {
    logger.warn(`Filtered ${categories.length - validCategories.length} invalid categories`);
  }

  return validCategories;
};

/**
 * Validate a brand object
 * @param {object} brand - Brand to validate
 * @returns {boolean} True if brand is valid
 */
export const validateBrand = (brand) => {
  if (!brand || typeof brand !== 'object') {
    logger.warn('Invalid brand: not an object', brand);
    return false;
  }

  if (typeof brand.id !== 'number') {
    logger.warn('Invalid brand: id is not a number', brand);
    return false;
  }

  if (!brand.name || typeof brand.name !== 'string') {
    logger.warn('Invalid brand: missing or invalid name', brand);
    return false;
  }

  if (!brand.slug || typeof brand.slug !== 'string') {
    logger.warn('Invalid brand: missing or invalid slug', brand);
    return false;
  }

  return true;
};

/**
 * Validate brands array
 * @param {Array} brands - Array of brands to validate
 * @returns {Array} Filtered array of valid brands
 */
export const validateBrands = (brands) => {
  if (!Array.isArray(brands)) {
    logger.error('Invalid brands: not an array', brands);
    return [];
  }

  const validBrands = brands.filter(validateBrand);

  if (validBrands.length !== brands.length) {
    logger.warn(`Filtered ${brands.length - validBrands.length} invalid brands`);
  }

  return validBrands;
};

/**
 * Validate order object
 * @param {object} order - Order to validate
 * @returns {boolean} True if order is valid
 */
export const validateOrder = (order) => {
  if (!order || typeof order !== 'object') {
    logger.warn('Invalid order: not an object', order);
    return false;
  }

  if (typeof order.id !== 'number') {
    logger.warn('Invalid order: id is not a number', order);
    return false;
  }

  if (!order.status || typeof order.status !== 'string') {
    logger.warn('Invalid order: missing or invalid status', order);
    return false;
  }

  if (typeof order.total_amount !== 'number' || order.total_amount < 0) {
    logger.warn('Invalid order: invalid total_amount', order);
    return false;
  }

  return true;
};

/**
 * Validate orders array
 * @param {Array} orders - Array of orders to validate
 * @returns {Array} Filtered array of valid orders
 */
export const validateOrders = (orders) => {
  if (!Array.isArray(orders)) {
    logger.error('Invalid orders: not an array', orders);
    return [];
  }

  const validOrders = orders.filter(validateOrder);

  if (validOrders.length !== orders.length) {
    logger.warn(`Filtered ${orders.length - validOrders.length} invalid orders`);
  }

  return validOrders;
};
