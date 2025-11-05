# Quick Start Guide - Admin Orders Management

## For Administrators

### Accessing Orders
1. Login to admin panel: `/admin/login`
2. Click the "Заказы" tab in the navigation
3. See badge with pending orders count

### Viewing Orders
- All orders displayed in table format
- Each row shows: order number, customer, date, status, items, price

### Filtering Orders
1. **By Status**: Use dropdown to filter (All, Created, Updated, Confirmed, Shipped, Canceled)
2. **By Search**: Type order number, customer name, or email in search box
3. **By Date**: Change sort order (newest first / oldest first)

### View Order Details
1. Click "Подробнее" (Details) button on any order
2. Modal opens showing:
   - Customer information
   - Shipping address
   - All items with images
   - Order total
   - Order history
3. Close modal: Click X, click outside, or press ESC

### Update Order Status
1. Click "Статус" button on any order
2. Select new status from dropdown
3. Click "Обновить статус" (Update Status)
4. Customer receives automatic email notification
5. Order updates in list

### Status Meanings
- **Создан** (Created) - Order placed by customer
- **Обновлен** (Updated) - Order modified
- **Подтвержден** (Confirmed) - Admin confirmed order
- **Отправлен** (Shipped) - Order shipped to customer
- **Отменен** (Canceled) - Order canceled

## For Developers

### Quick Test
```bash
# Navigate to frontend directory
cd frontend

# Build the project (should complete without errors)
npm run build

# Run development server
npm run dev
```

### API Endpoints Required
- `GET /orders/admin/all` - Get all orders
- `PATCH /orders/admin/{order_id}/status` - Update order status

### Key Files
- `/frontend/src/components/admin/OrderManager.jsx` - Main component
- `/frontend/src/components/admin/OrderDetailsModal.jsx` - Details view
- `/frontend/src/api/index.js` - API integration
- `/frontend/src/pages/AdminPanel.jsx` - Tab integration

### Quick Customization

#### Change orders per page:
```javascript
// In OrderManager.jsx
const ordersPerPage = 20; // Change to desired number
```

#### Add new status:
```javascript
// In OrderManager.jsx
const statuses = [
  { value: 'new_status', label: 'New Label', color: 'bg-color-100 text-color-800' },
  // ...existing statuses
];
```

#### Modify search fields:
```javascript
// In OrderManager.jsx, filteredOrders function
const orderNumber = order.order_number.toLowerCase();
const userName = (order.user?.full_name || order.user?.username || '').toLowerCase();
// Add more fields here
```

### Troubleshooting

**Orders not loading?**
- Check browser console for errors
- Verify backend is running
- Confirm authentication token is valid
- Test API endpoint manually

**Status update failing?**
- Verify admin permissions
- Check network tab for error response
- Confirm order ID is correct
- Test backend endpoint

**Build errors?**
- Run `npm install` to ensure dependencies
- Check for typos in imports
- Verify all files are saved
- Clear build cache: `rm -rf dist`

### Testing Checklist
- [ ] Can view orders list
- [ ] Can filter by status
- [ ] Can search orders
- [ ] Can sort by date
- [ ] Can view order details
- [ ] Can update order status
- [ ] Pagination works
- [ ] Error messages display correctly
- [ ] Loading states show
- [ ] Mobile responsive

## Support

See `ORDERS_ADMIN_IMPLEMENTATION.md` for comprehensive documentation.
