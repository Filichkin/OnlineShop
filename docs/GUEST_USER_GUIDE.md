# Guest User Support - Implementation Guide

## Overview

The cart and favorites slices now support guest users through localStorage with automatic synchronization after login. This allows users to add items to their cart and favorites WITHOUT being logged in.

## Key Features

1. **Guest User Support**: Users can add items to cart/favorites while not logged in
2. **LocalStorage Persistence**: Guest data is stored in browser localStorage
3. **Automatic Sync**: Guest data automatically syncs with server after login
4. **Seamless UX**: No data loss when transitioning from guest to authenticated user

## Implementation Details

### CartSlice Changes

#### New State Properties
- `isGuest`: Boolean flag indicating if user is in guest mode
- `isSyncing`: Boolean flag indicating sync operation in progress

#### New Actions
- `setGuestMode()`: Manually switch to guest mode and load from localStorage
- `syncGuestCart()`: Sync guest cart with server (auto-called after login)

#### New Selectors
- `selectCartIsGuest(state)`: Returns guest mode status
- `selectCartIsSyncing(state)`: Returns sync status

#### Updated Thunks
All cart operations now support guest mode:
- `addToCart({ productId, quantity, productData })` - productData optional for guest users
- `updateQuantity({ productId, quantity })`
- `removeFromCart(productId)`
- `clearCart()`

### FavoritesSlice Changes

#### New State Properties
- `isGuest`: Boolean flag indicating if user is in guest mode
- `isSyncing`: Boolean flag indicating sync operation in progress

#### New Actions
- `setGuestMode()`: Manually switch to guest mode and load from localStorage
- `syncGuestFavorites()`: Sync guest favorites with server (auto-called after login)

#### New Selectors
- `selectFavoritesIsGuest(state)`: Returns guest mode status
- `selectFavoritesIsSyncing(state)`: Returns sync status

#### Updated Thunks
All favorites operations now support guest mode:
- `addToFavorites(productId)` or `addToFavorites({ productId, productData })`
- `removeFromFavorites(productId)`
- `toggleFavorite(productId)` or `toggleFavorite({ productId, productData })`

## Usage Examples

### Adding to Cart (Guest User)

```javascript
import { useDispatch } from 'react-redux';
import { addToCart } from './store/slices/cartSlice';

// In your component
const dispatch = useDispatch();

// Add to cart with full product data (recommended for guest users)
dispatch(addToCart({
  productId: 123,
  quantity: 1,
  productData: {
    id: 123,
    name: 'Product Name',
    price: 99.99,
    image_url: '/path/to/image.jpg',
    // ... other product fields
  }
}));

// Or just with productId (works but won't have full product details until sync)
dispatch(addToCart({ productId: 123, quantity: 1 }));
```

### Adding to Favorites (Guest User)

```javascript
import { useDispatch } from 'react-redux';
import { toggleFavorite } from './store/slices/favoritesSlice';

// In your component
const dispatch = useDispatch();

// Toggle favorite with product data (recommended for guest users)
dispatch(toggleFavorite({
  productId: 123,
  productData: {
    id: 123,
    name: 'Product Name',
    price: 99.99,
    image_url: '/path/to/image.jpg',
    // ... other product fields
  }
}));

// Or just with productId
dispatch(toggleFavorite(123));
```

### Syncing After Login

```javascript
import { useDispatch } from 'react-redux';
import { syncGuestCart } from './store/slices/cartSlice';
import { syncGuestFavorites } from './store/slices/favoritesSlice';

// After successful login, sync guest data
const handleLoginSuccess = async () => {
  const dispatch = useDispatch();

  try {
    // Sync both cart and favorites
    await Promise.all([
      dispatch(syncGuestCart()).unwrap(),
      dispatch(syncGuestFavorites()).unwrap()
    ]);

    console.log('Guest data synced successfully');
  } catch (error) {
    console.error('Sync failed:', error);
    // Guest data is preserved in localStorage on error
  }
};
```

### Checking Guest Status

```javascript
import { useSelector } from 'react-redux';
import { selectCartIsGuest, selectCartIsSyncing } from './store/slices/cartSlice';

function CartComponent() {
  const isGuest = useSelector(selectCartIsGuest);
  const isSyncing = useSelector(selectCartIsSyncing);

  return (
    <div>
      {isGuest && (
        <div className="alert">
          You're shopping as a guest. Login to save your cart.
        </div>
      )}

      {isSyncing && (
        <div className="loading">
          Syncing your cart...
        </div>
      )}
    </div>
  );
}
```

## LocalStorage Keys

- `guest_cart`: Stores guest cart data
- `guest_favorites`: Stores guest favorites data

## Data Structure

### Guest Cart (localStorage)
```json
{
  "items": [
    {
      "product": {
        "id": 123,
        "name": "Product Name",
        "price": 99.99,
        // ... other product fields
      },
      "quantity": 2,
      "price_at_addition": 99.99
    }
  ],
  "totalItems": 2,
  "totalPrice": 199.98
}
```

### Guest Favorites (localStorage)
```json
{
  "items": [
    {
      "id": 123,
      "name": "Product Name",
      "price": 99.99,
      // ... other product fields
    }
  ],
  "favoriteIds": [123],
  "totalItems": 1
}
```

## Integration Points

### Where to Call Sync Functions

You should call `syncGuestCart()` and `syncGuestFavorites()` in the following places:

1. **After successful login** - In your login success handler
2. **After successful registration** - In your registration success handler
3. **On app initialization** - If user session is restored from token

Example integration in auth flow:

```javascript
// In your login component or auth slice
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch }) => {
    const response = await authAPI.login(credentials);

    // After successful login, sync guest data
    await dispatch(syncGuestCart());
    await dispatch(syncGuestFavorites());

    return response;
  }
);
```

### Where to Call setGuestMode

Call `setGuestMode()` when user logs out:

```javascript
// In your logout handler
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    await authAPI.logout();

    // Switch cart and favorites to guest mode
    dispatch(setGuestMode()); // from cartSlice
    dispatch(setGuestMode()); // from favoritesSlice
  }
);
```

## Error Handling

- If sync fails, guest data remains in localStorage
- Users can retry sync manually
- Original server data is not overwritten on sync failure
- All localStorage operations have try-catch error handling

## Best Practices

1. **Always provide productData for guest users** when adding to cart/favorites
2. **Show guest indicators** in UI to encourage users to login
3. **Handle sync errors gracefully** and allow retry
4. **Clear localStorage** on successful sync (done automatically)
5. **Test localStorage limits** - browsers typically allow 5-10MB
6. **Consider data expiration** for old guest data (future enhancement)

## Migration Notes

### Existing Component Updates Required

Components that dispatch `addToCart` or `addToFavorites` should be updated to pass product data:

**Before:**
```javascript
dispatch(addToCart({ productId: product.id, quantity: 1 }));
```

**After:**
```javascript
dispatch(addToCart({
  productId: product.id,
  quantity: 1,
  productData: product // Pass full product object
}));
```

This ensures guest users see full product details without needing to fetch from API.

## Testing Checklist

- [ ] Add items to cart as guest
- [ ] Add items to favorites as guest
- [ ] Refresh page and verify data persists
- [ ] Login and verify sync works
- [ ] Verify merged cart has both guest and server items
- [ ] Logout and verify guest mode is restored
- [ ] Test with empty cart/favorites
- [ ] Test sync error handling
- [ ] Test localStorage quota limits
- [ ] Verify localStorage is cleared after successful sync
