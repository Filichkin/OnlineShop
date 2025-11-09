# 🛒 OnlineShop - E-commerce Platform

A modern full-stack e-commerce platform built with React and FastAPI, featuring comprehensive product management, image handling, and admin panel functionality.

## 🆕 Latest Updates (November 2025)

- **Security Hardening** – Strengthened secret/password validation, added timing-safe password reset flow, secured cookies (HttpOnly, SameSite, Secure), enforced session fixation protection, and enabled MIME sniffing with `python-magic`.
- **Authentication Upgrades** – Users can log in with email or phone, recover access via secure password reset emails, and receive automatic cart/favorites migration after authentication.
- **Logging & Monitoring** – Centralized Loguru-based logging (`backend/app/core/logging_config.py`) with daily file rotation stored in `backend/logs`, plus consistent security/context logging across critical flows.
- **Developer Experience** – New `.env.example` template under `infra/`, expanded documentation set in `docs/`, and updated backend dependencies (`python-magic`, `libmagic`, `loguru`) to support the new safeguards.

## 🚀 Tech Stack

### Frontend
- **React 18** with Hooks and Context API
- **React Router** for navigation
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **Axios** for API communication

### Backend
- **FastAPI** with async/await support
- **SQLAlchemy** with PostgreSQL
- **Pydantic** for data validation
- **Loguru** for structured logging
- **python-magic / libmagic** for MIME validation
- **Uvicorn** as ASGI server
- **JWT** authentication

### Database
- **PostgreSQL** as primary database
- **Alembic** for database migrations

## 📋 Features

### 🛍️ Customer Features
- **Product Catalog** - Browse products by categories
- **Product Details** - Detailed product information with image gallery
- **Category Navigation** - Filter products by categories
- **Responsive Design** - Mobile-first approach
- **Image Gallery** - Multiple product images with main image support
- **Shopping Cart** - Server-synced cart with quantity updates, clear cart, and checkout CTA
- **Favorites System** - Add products to favorites, view and manage favorite items
- **User Authentication** - JWT-based registration with email or phone login plus session fixation protection
- **Password Recovery** - Secure email-based password reset with timing-attack mitigation
- **User Profile** - View and update personal information
- **Seamless Migration** - Automatic cart and favorites merge after successful authentication
- **Order Management** - Place orders, view order history, track order status
- **Order Details** - Detailed order view with cancellation option

### 👨‍💼 Admin Features
- **Product Management** - Full CRUD operations for products
- **Category Management** - Create, update, delete categories
- **Brand Management** - Manage product brands
- **Image Management** - Advanced image handling system
  - Upload multiple images per product
  - Set main image
  - Drag & drop reordering
  - Bulk image operations
- **User Management** - Admin user authentication
- **Order Management** - View all orders, filter by status, update order status
- **Email Notifications** - Automatic order confirmation and status update emails
- **Real-time Updates** - Live data synchronization

### 🖼️ Image Management System
- **Multi-image Support** - Upload multiple images per product
- **Main Image Designation** - Set any image as primary
- **Drag & Drop Reordering** - Intuitive image arrangement
- **Bulk Operations** - Select and delete multiple images
- **Image Validation** - File type and size validation
- **Secure Storage** - Protected file upload system

### 🛒 Shopping Cart Experience
- **Session-Based Cart** - Anonymous carts persist via secure session cookies shared between frontend (`:5173`) and backend (`:8000`).
- **Optimised Rendering** - Cart state lives in Redux; selectors, `useMemo`, and `useCallback` minimise re-renders.
- **Skeleton & Toasts** - `CartSkeleton` handles initial load, while operation errors display contextual toast notifications.
- **Granular Controls** - Users can adjust quantities, remove individual items, or clear the cart entirely with confirmation prompts.
- **Sticky Summary Card** - Desktop layout keeps totals and checkout button visible (sticky sidebar).
- **Checkout Hand-off** - Dedicated handler navigates toward the checkout flow (`/checkout`).

### 📦 Order Management System
- **Order Placement** - Convert cart to order with shipping information
- **Order Numbers** - Unique sequential order numbers (format: OR{YY}{NNNNN})
- **Order Statuses** - Created, Updated, Confirmed, Shipped, Canceled
- **Email Notifications** - Automatic order confirmation and status update emails
- **Order History** - View all past orders with details
- **Order Tracking** - Track order status in real-time
- **Order Cancellation** - Cancel orders with status restrictions
- **Admin Order Management** - Full order management interface for administrators

## 🏗️ Project Structure

```
OnlineShop/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── crud/           # Database operations
│   │   ├── models/         # SQLAlchemy models
│   │   └── schemas/        # Pydantic schemas
│   └── media/              # Uploaded files
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store
│   │   └── utils/          # Utility functions
└── docs/                   # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.12+
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python dependency manager)
- PostgreSQL 13+

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Python dependencies with uv**
   ```bash
   uv sync
   ```
   This command creates and manages the `.venv` folder automatically. You can activate it if needed:
   ```bash
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

3. **Configure environment variables**

   Copy the provided template and adjust values to match your environment:
   ```bash
   cp infra/.env.example infra/.env
   ```
   Then update `infra/.env` (project root, one level above `backend`) with strong secrets and local credentials. Use the template below as a starting point:
   ```env
   SECRET=replace-with-strong-secret
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=onlineshop
   POSTGRES_USER=onlineshop
   POSTGRES_PASSWORD=replace-with-strong-password
   FIRST_SUPERUSER_EMAIL=admin@example.com
   FIRST_SUPERUSER_PASSWORD=replace-with-strong-password
   ```

4. **Run database migrations**
   ```bash
   uv run alembic upgrade head
   ```

5. **Start the API**
   ```bash
   uv run uvicorn app.main:app --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Default URL: `http://localhost:5173`

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Products
- `GET /products/` - List all products
- `GET /products/{id}` - Get product details
- `GET /products/{id}/images` - Get product images
- `POST /products/{id}/images` - Upload images
- `PUT /products/{id}/images/main` - Set main image
- `DELETE /products/{id}/images` - Delete images

#### Categories
- `GET /categories/` - List categories
- `GET /categories/{id}/products/` - Get category products
- `POST /categories/` - Create category (admin)
- `PATCH /categories/{id}` - Update category (admin)

#### Cart
- `GET /cart/` - Retrieve the current session cart with item breakdown
- `GET /cart/summary` - Lightweight totals for cart icon badge
- `POST /cart/items` - Add product or increment quantity in cart
- `PATCH /cart/items/{product_id}` - Update quantity for a specific product
- `DELETE /cart/items/{product_id}` - Remove product from cart
- `DELETE /cart/` - Clear all items from cart

#### Favorites
- `GET /favorites/` - Get user's favorite items
- `POST /favorites/{product_id}` - Add product to favorites
- `DELETE /favorites/{product_id}` - Remove product from favorites

#### Orders
- `POST /orders/` - Create order from cart
- `GET /orders/` - Get user's orders
- `GET /orders/{id}` - Get order details
- `DELETE /orders/{id}` - Cancel order
- `GET /orders/admin/all` - Get all orders (admin only)
- `PATCH /orders/admin/{id}/status` - Update order status (admin only)

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info
- `PATCH /auth/me` - Update user profile

## 🔧 Configuration

### Environment Variables

#### Backend (`infra/.env`)
```env
SECRET=replace-with-strong-secret
ENVIRONMENT=development  # Set to production in live deployments
COOKIE_SECURE=false      # true when served via HTTPS
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=lax
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=onlineshop
POSTGRES_USER=onlineshop
POSTGRES_PASSWORD=replace-with-strong-password
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=replace-with-strong-password

# Email settings (for order notifications)
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
YANDEX_EMAIL=your-email@yandex.ru
YANDEX_APP_PASS=your-app-password
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🎨 UI Components

### Customer Interface
- **Product Cards** - Clean, responsive product display
- **Image Gallery** - Interactive product image viewer
- **Category Filters** - Easy product filtering
- **Search Functionality** - Find products quickly

### Admin Interface
- **Dashboard** - Overview of all entities
- **Data Tables** - Sortable, filterable data display
- **Image Manager** - Advanced image handling interface
- **Form Validation** - Real-time input validation

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based auth with fastapi-users
- **Password Hashing** - Bcrypt password hashing
- **Session Fixation Protection** - Session cookies cleared on auth to prevent hijacking
- **Secure Cookies** - Environment-driven HttpOnly, SameSite, and Secure flags
- **Input Validation** - Pydantic schema validation
- **File Upload Security** - Type/size validation and magic-number MIME checks
- **CORS Configuration** - Cross-origin request handling
- **SQL Injection Protection** - SQLAlchemy ORM protection
- **Session Management** - Secure session cookies for anonymous carts
- **Timing-Safe Password Reset** - Dummy operations equalize response times
- **Email Security** - SMTP with TLS for email notifications

## 📱 Responsive Design

- **Mobile-First** - Optimized for mobile devices
- **Tablet Support** - Responsive tablet layouts
- **Desktop Enhanced** - Full desktop functionality
- **Touch-Friendly** - Touch-optimized interactions

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🗂️ Logging & Monitoring

- **Centralized Setup** – Logging configured via `backend/app/core/logging_config.py` (Loguru) and initialized on app startup.
- **File & Console Output** – Development prints to console; persistent logs rotate daily under `backend/logs/`.
- **Security Context** – Authentication, password reset, and cart operations emit structured security logs for auditing.
- **Customization** – Adjust log level/handlers in `logging_config.py` or via environment-specific overrides.

## 📈 Performance Features

- **Lazy Loading** - Images and components loaded on demand
- **Pagination** - Efficient data loading
- **Caching** - API response caching
- **Optimized Images** - Compressed and resized images
- **Bundle Splitting** - Code splitting for faster loads

## 🔄 State Management

- **Redux Toolkit** - Predictable state container
- **RTK Query** - Data fetching and caching
- **Context API** - Component-level state
- **Local Storage** - Persistent user preferences

## 📦 Deployment

### Docker Support
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Production Build
```bash
# Frontend
npm run build

# Backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Alexey Filichkin** - *Initial work* - [Filichkin](https://github.com/Filichkin)

## 🙏 Acknowledgments

- React team for the amazing framework
- FastAPI team for the high-performance API framework
- Tailwind CSS for the utility-first CSS framework
- All open-source contributors

---

**Status**: 🚀 Active Development
**Version**: 1.1.0
**Last Updated**: November 2025
