# Order Number & Email - Quick Reference Guide

## Order Number Format

```
OR{YY}{NNNNN}
```

**Examples:**
- `OR2500001` - First order of 2025
- `OR2500002` - Second order of 2025
- `OR2599999` - 99,999th order of 2025
- `OR2600001` - First order of 2026 (resets)

## Key Files

### Utilities
- **`app/utils/order_number.py`** - Order number generation
- **`app/utils/email.py`** - Email sending functionality

### Models & Schemas
- **`app/models/order.py`** - Order model with order_number field
- **`app/schemas/order.py`** - Updated schemas with order_number

### CRUD & API
- **`app/crud/order.py`** - Order creation with auto-generation
- **`app/api/endpoints/order.py`** - API responses include order_number

### Configuration
- **`app/core/config.py`** - Email settings
- **`infra/.env`** - Email credentials

### Migration
- **`alembic/versions/b30a83cab0a7_add_order_number_to_orders.py`**

## Environment Variables

```bash
# Required for email notifications
YANDEX_EMAIL=your_email@yandex.ru
YANDEX_APP_PASS=your_app_password
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
```

## How It Works

### 1. Order Creation Flow

```python
# User creates order via API
POST /orders/

# Backend flow:
1. Generate unique order number (OR2500001)
2. Create order in database
3. Create order items
4. Commit transaction
5. Send email confirmation (non-blocking)
6. Return response with order_number
```

### 2. Order Number Generation

```python
from app.utils import generate_order_number

# In CRUD operation
order_number = await generate_order_number(session)
# Returns: 'OR2500001'

# Order object
order = Order(
    order_number=order_number,
    # ... other fields
)
```

### 3. Email Sending

```python
from app.utils import send_order_confirmation_email

# After order creation
success = send_order_confirmation_email(order)
# Returns: True if sent, False if failed
# Errors are logged, don't raise exceptions
```

## API Response Examples

### Create Order

```bash
POST /orders/
Content-Type: application/json

{
  "first_name": "Иван",
  "last_name": "Иванов",
  "city": "Москва",
  "postal_code": "101000",
  "address": "ул. Ленина, д. 1, кв. 10",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "notes": "Позвоните за 30 минут"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order_id": 1,
  "order_number": "OR2500001",
  "total_price": 15999.50
}
```

### Get Order Details

```bash
GET /orders/1
```

**Response:**
```json
{
  "id": 1,
  "order_number": "OR2500001",
  "user_id": 5,
  "status": "created",
  "first_name": "Иван",
  "last_name": "Иванов",
  "city": "Москва",
  "postal_code": "101000",
  "address": "ул. Ленина, д. 1, кв. 10",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "notes": "Позвоните за 30 минут",
  "total_items": 3,
  "total_price": 15999.50,
  "items": [
    {
      "id": 1,
      "product_id": 10,
      "quantity": 2,
      "price_at_purchase": 5999.00,
      "product_name": "Gaming Laptop",
      "subtotal": 11998.00,
      "product": {
        "id": 10,
        "name": "Gaming Laptop",
        "price": 5999.00,
        "main_image": "/media/products/laptop.jpg",
        "part_number": "LP-001"
      },
      "created_at": "2025-11-05T10:00:00Z",
      "updated_at": "2025-11-05T10:00:00Z"
    }
  ],
  "created_at": "2025-11-05T10:00:00Z",
  "updated_at": "2025-11-05T10:00:00Z"
}
```

## Database Schema

```sql
-- Order table with order_number
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    order_number VARCHAR(9) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    status order_status NOT NULL,
    -- ... other fields
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES user(id) ON DELETE CASCADE
);

-- Unique index for fast lookups
CREATE UNIQUE INDEX ix_order_number ON orders (order_number);
```

## Error Handling

### Order Number Conflicts

```python
# Automatic handling via unique constraint
# If collision occurs, database raises error
# Transaction is rolled back
# User sees: "Failed to create order"
```

### Email Failures

```python
# Email errors are logged but don't fail order creation
# Order is created successfully
# Email failure logged with full traceback
# Admin can check logs and resend if needed
```

## Logging Examples

```python
# Success
logger.info('Generated order number: OR2500001')
logger.info(
    'Order confirmation email sent successfully '
    'for order OR2500001 to ivan@example.com'
)

# Warning
logger.warning(
    'Failed to send order confirmation email '
    'for order OR2500001'
)

# Error
logger.error(
    'SMTP authentication failed for order OR2500001: '
    'Invalid credentials'
)
```

## Testing

### Manual Test via API

1. Start backend server
2. Login to get JWT token
3. Add items to cart
4. Create order:

```bash
curl -X POST http://localhost:8000/orders/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "city": "Moscow",
    "postal_code": "101000",
    "address": "Test Street 1",
    "phone": "+79001234567",
    "email": "test@example.com"
  }'
```

5. Check response for order_number
6. Check email inbox for confirmation

### Check Logs

```bash
# View backend logs
tail -f backend/logs/app.log

# Look for:
# - "Generated order number: OR2500001"
# - "Order confirmation email sent successfully"
```

## Troubleshooting

### Order Number Not Generated

**Symptom**: Order created without order_number

**Solution**:
1. Check migration applied: `alembic current`
2. Verify database schema: column exists and has unique constraint
3. Check logs for generation errors

### Email Not Sent

**Symptom**: Order created but no email received

**Solution**:
1. Check `.env` file has correct email settings
2. Verify Yandex app password is correct
3. Check spam folder
4. Review logs for SMTP errors:
   - Authentication errors → Check credentials
   - Connection errors → Check SMTP host/port
   - Timeout errors → Check network/firewall

### Duplicate Order Numbers

**Symptom**: Database unique constraint error

**Solution**:
- This should never happen due to database transaction
- If it does, indicates race condition
- Check database isolation level
- Consider adding application-level locking for high concurrency

## Performance Considerations

### Current Implementation

- ✅ Fast order number generation (single query)
- ✅ Indexed for quick lookups
- ⚠️ Synchronous email (blocks for 1-2 seconds)

### Optimization for High Traffic

```python
# Move to Celery task (future improvement)
from app.tasks import send_order_email

# In order creation
send_order_email.delay(order.id)  # Background task
```

## Security Notes

1. **Order Numbers**: Sequential but unpredictable at scale (99,999 per year)
2. **Email Content**: User input is properly escaped in HTML
3. **Credentials**: Stored securely in environment variables
4. **App Password**: Using Yandex app password, not main password

## Common Issues

### Issue: "Field required: yandex_email"

**Cause**: Missing environment variable

**Fix**:
```bash
# Add to infra/.env
YANDEX_EMAIL=your_email@yandex.ru
```

### Issue: Email sent but not received

**Possible causes**:
1. Email in spam folder
2. Invalid recipient email
3. SMTP server blocked

**Debug**:
```bash
# Check logs for sending confirmation
grep "email sent successfully" backend/logs/app.log
```

## Migration Commands

```bash
# Apply migration
alembic upgrade head

# Check current version
alembic current

# View history
alembic history

# Rollback
alembic downgrade -1
```

## Summary

✅ **Automatic order numbers** - Format: OR{YY}{NNNNN}
✅ **Email notifications** - HTML emails with order details
✅ **Error handling** - Comprehensive logging, graceful failures
✅ **Database indexed** - Fast lookups by order_number
✅ **API integrated** - All endpoints return order_number
✅ **Production ready** - Following best practices

For detailed implementation, see `ORDER_NUMBER_EMAIL_IMPLEMENTATION.md`
