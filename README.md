# 🛒 OnlineShop - E-commerce Platform

A modern full-stack e-commerce platform built with React and FastAPI, featuring comprehensive product management, image handling, and admin panel functionality.

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
- **Real-time Updates** - Live data synchronization

### 🖼️ Image Management System
- **Multi-image Support** - Upload multiple images per product
- **Main Image Designation** - Set any image as primary
- **Drag & Drop Reordering** - Intuitive image arrangement
- **Bulk Operations** - Select and delete multiple images
- **Image Validation** - File type and size validation
- **Secure Storage** - Protected file upload system

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
- Python 3.11+
- PostgreSQL 13+

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

6. **Start the server**
   ```bash
   uvicorn app.main:app --reload
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
   ```
   http://localhost:5173
   ```

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

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/onlineshop
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
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

- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Pydantic schema validation
- **File Upload Security** - Type and size validation
- **CORS Configuration** - Cross-origin request handling
- **SQL Injection Protection** - SQLAlchemy ORM protection

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
**Version**: 1.0.0  
**Last Updated**: October 2025
