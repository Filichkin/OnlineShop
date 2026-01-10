import { useState, useEffect } from 'react';
import { ordersAPI } from '../../../api';
import { logger } from '../../../utils/logger';

/**
 * Hook для управления заказами
 */
export function useOrders(activeTab, user) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await ordersAPI.getOrders(0, 20);
      setOrders(data);
    } catch (err) {
      logger.error('Error loading orders:', err);
      setOrdersError(err || 'Не удалось загрузить заказы');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Load orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders' && user && orders.length === 0) {
      loadOrders();
    }
  }, [activeTab, user]);

  return { orders, ordersLoading, ordersError, loadOrders };
}
