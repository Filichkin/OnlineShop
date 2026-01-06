# Usage Examples: AdminTable and AdminModal

## AdminTable Component

### Basic Usage

```javascript
import AdminTable from './AdminTable';

const MyManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (item) => <div className="text-sm font-medium">{item.name}</div>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className={`px-2 py-1 rounded ${item.active ? 'bg-green-100' : 'bg-red-100'}`}>
          {item.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: (item) => console.log('Edit', item),
      className: 'text-indigo-600 hover:text-indigo-900',
    },
  ];

  return (
    <AdminTable
      columns={columns}
      data={items}
      loading={loading}
      emptyMessage="No items found"
      actions={actions}
    />
  );
};
```

### Advanced Usage with Images

```javascript
const columns = [
  {
    key: 'image',
    label: 'Image',
    className: 'whitespace-nowrap',
    render: (item) => (
      <div className="h-12 w-12">
        {item.image ? (
          <img
            src={getImageUrl(item.image)}
            alt={item.name}
            className="h-12 w-12 rounded-lg object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center"
          style={{ display: item.image ? 'none' : 'flex' }}
        >
          <span className="text-gray-400 text-xs">No photo</span>
        </div>
      </div>
    ),
  },
];
```

### Conditional Actions

```javascript
const actions = [
  {
    label: 'Edit',
    onClick: handleEdit,
    className: 'text-indigo-600 hover:text-indigo-900',
  },
  {
    label: 'Restore',
    onClick: (item) => handleRestore(item.id),
    className: 'text-green-600 hover:text-green-900',
    show: (item) => !item.is_active, // Only show for inactive items
  },
  {
    label: 'Delete',
    onClick: handleDelete,
    className: 'text-red-600 hover:text-red-900',
    disabled: true, // Disabled action
  },
];
```

### Custom Header Styling

```javascript
const columns = [
  {
    key: 'status',
    label: 'Status',
    className: 'text-center',
    headerClassName: 'text-center', // Center align header
    render: (item) => <span>{item.status}</span>,
  },
];
```

---

## AdminModal Component

### Basic Form Modal

```javascript
import AdminModal from './AdminModal';

const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createItem(formData);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>Open Modal</button>

      <AdminModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Item"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        size="medium"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </AdminModal>
    </>
  );
};
```

### Large Modal with Grid Layout

```javascript
<AdminModal
  isOpen={showModal}
  onClose={handleClose}
  title="Edit User"
  onSubmit={handleSubmit}
  loading={loading}
  error={error}
  size="large" // Large modal
>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label>First Name</label>
      <input type="text" name="first_name" />
    </div>

    <div>
      <label>Last Name</label>
      <input type="text" name="last_name" />
    </div>

    <div>
      <label>Email</label>
      <input type="email" name="email" />
    </div>

    <div>
      <label>Phone</label>
      <input type="tel" name="phone" />
    </div>
  </div>
</AdminModal>
```

### Modal with Custom Buttons

```javascript
<AdminModal
  isOpen={showModal}
  onClose={handleClose}
  title="Confirm Action"
  onSubmit={handleConfirm}
  submitLabel="Confirm" // Custom submit button text
  cancelLabel="Cancel" // Custom cancel button text
  loading={loading}
  size="small"
>
  <p>Are you sure you want to perform this action?</p>
</AdminModal>
```

### Modal without Footer

```javascript
<AdminModal
  isOpen={showModal}
  onClose={handleClose}
  title="Information"
  showFooter={false} // Hide footer
>
  <p>This is an information modal without action buttons.</p>
  <button onClick={handleClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">
    Close
  </button>
</AdminModal>
```

### Modal with Backdrop Click Enabled

```javascript
<AdminModal
  isOpen={showModal}
  onClose={handleClose}
  title="Simple Form"
  onSubmit={handleSubmit}
  closeOnBackdropClick={true} // Enable backdrop click (default is false)
>
  <div>Form content...</div>
</AdminModal>
```

---

## Complete Example: BrandManager Refactoring

### Before (390 lines)

```javascript
const BrandManager = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({...});

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await brandsAPI.getBrands();
      setBrands(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await brandsAPI.updateBrand(editingBrand.id, formData);
      } else {
        await brandsAPI.createBrand(formData);
      }
      setShowModal(false);
      loadBrands();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* Custom table with ~100 lines of JSX */}
      <table>...</table>

      {/* Custom modal with ~80 lines of JSX */}
      {showModal && (
        <div className="fixed inset-0...">
          <div className="modal-content...">
            <form onSubmit={handleSubmit}>
              {/* Form fields */}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
```

### After (327 lines)

```javascript
import { useAdminResource } from '../../hooks/useAdminResource';
import AdminTable from './AdminTable';
import AdminModal from './AdminModal';

const BrandManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({...});

  // All CRUD logic handled by hook
  const {
    items: brands,
    loading,
    error,
    editingItem: editingBrand,
    loadItems,
    handleCreate,
    handleUpdate,
    handleRestore,
    startEdit,
  } = useAdminResource({
    fetchFn: brandsAPI.getBrands,
    createFn: brandsAPI.createBrand,
    updateFn: brandsAPI.updateBrand,
    deleteFn: brandsAPI.deleteBrand,
    restoreFn: brandsAPI.restoreBrand,
    resourceName: 'бренд',
  });

  // Declarative column configuration
  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (brand) => <img src={getImageUrl(brand.image)} />,
    },
    {
      key: 'name',
      label: 'Name',
      render: (brand) => <div>{brand.name}</div>,
    },
    // ...
  ];

  const actions = [
    { label: 'Edit', onClick: handleEdit, className: 'text-indigo-600' },
    { label: 'Restore', onClick: handleRestore, show: (b) => !b.is_active },
  ];

  return (
    <div>
      {/* Simple table component */}
      <AdminTable
        columns={columns}
        data={brands}
        loading={loading}
        actions={actions}
      />

      {/* Simple modal component */}
      <AdminModal
        isOpen={showModal}
        onClose={handleClose}
        title={editingBrand ? 'Edit Brand' : 'Create Brand'}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {/* Form fields */}
      </AdminModal>
    </div>
  );
};
```

---

## Integration with useAdminResource Hook

### Complete Example

```javascript
import { useAdminResource } from '../../hooks/useAdminResource';
import AdminTable from './AdminTable';
import AdminModal from './AdminModal';

const ItemManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Initialize hook
  const {
    items,
    loading,
    error,
    editingItem,
    loadItems,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleRestore,
    startEdit,
    cancelEdit,
  } = useAdminResource({
    fetchFn: itemsAPI.getItems,
    createFn: itemsAPI.createItem,
    updateFn: itemsAPI.updateItem,
    deleteFn: itemsAPI.deleteItem,
    restoreFn: itemsAPI.restoreItem,
    resourceName: 'item',
  });

  // Load items with filters
  useEffect(() => {
    const isActive = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
    loadItems({ isActive });
  }, [statusFilter, loadItems]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = editingItem
      ? await handleUpdate(editingItem.id, formData)
      : await handleCreate(formData);

    if (result.success) {
      setShowModal(false);
      setFormData({ name: '', description: '' });
      cancelEdit();
    }
  };

  // Handle edit button click
  const handleEdit = (item) => {
    startEdit(item);
    setFormData({ name: item.name, description: item.description });
    setShowModal(true);
  };

  // Define columns
  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (item) => <div className="font-medium">{item.name}</div>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (item) => <div className="text-gray-600">{item.description}</div>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className={item.is_active ? 'text-green-600' : 'text-red-600'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  // Define actions
  const actions = [
    {
      label: 'Edit',
      onClick: handleEdit,
      className: 'text-indigo-600 hover:text-indigo-900',
    },
    {
      label: 'Delete',
      onClick: (item) => handleDelete(item.id),
      className: 'text-red-600 hover:text-red-900',
      show: (item) => item.is_active,
    },
    {
      label: 'Restore',
      onClick: (item) => handleRestore(item.id),
      className: 'text-green-600 hover:text-green-900',
      show: (item) => !item.is_active,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Item Manager</h2>
        <button onClick={() => setShowModal(true)}>Add Item</button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Items</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Error Display */}
      {error && <div className="error">{error}</div>}

      {/* Table */}
      <AdminTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No items found"
        actions={actions}
      />

      {/* Modal */}
      <AdminModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          cancelEdit();
          setFormData({ name: '', description: '' });
        }}
        title={editingItem ? 'Edit Item' : 'Create Item'}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        size="medium"
      >
        <div className="mb-4">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="mb-4">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
      </AdminModal>
    </div>
  );
};

export default ItemManager;
```

---

## Tips and Best Practices

### 1. Column Configuration

- Use `render` function for custom cell content
- Add `className` for column-specific styling
- Use `headerClassName` for header-specific styling
- Keep render functions simple and focused

### 2. Action Buttons

- Use `show` function for conditional actions
- Keep action handlers simple
- Use consistent color coding (blue for edit, red for delete, green for restore)
- Add `disabled` prop when needed

### 3. Modal Management

- Clear form data on close
- Handle errors gracefully
- Use appropriate modal sizes
- Set `closeOnBackdropClick` to `false` for important forms

### 4. Performance

- Memoize column and action definitions with `useMemo` if they depend on state
- Use `useCallback` for action handlers
- Keep table data in reasonable limits (use pagination)

### 5. Accessibility

- AdminModal handles focus management automatically
- Ensure form fields have proper labels
- Use semantic HTML
- Test keyboard navigation
