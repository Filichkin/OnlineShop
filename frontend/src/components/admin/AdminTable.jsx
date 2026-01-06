/**
 * AdminTable - Reusable table component for admin panels
 *
 * A configurable table component that supports:
 * - Custom column definitions with render functions
 * - Loading state with spinner
 * - Empty state with customizable message
 * - Row hover effects
 * - Flexible action buttons per row
 * - Responsive design
 *
 * @component
 * @example
 * ```jsx
 * <AdminTable
 *   columns={[
 *     { key: 'name', label: 'Name', render: (item) => item.name },
 *     { key: 'status', label: 'Status', render: (item) => <Badge>{item.status}</Badge> }
 *   ]}
 *   data={items}
 *   loading={loading}
 *   emptyMessage="No items found"
 *   actions={[
 *     { label: 'Edit', onClick: handleEdit, className: 'text-indigo-600' },
 *     { label: 'Delete', onClick: handleDelete, className: 'text-red-600', show: (item) => !item.is_active }
 *   ]}
 * />
 * ```
 */

/**
 * @typedef {Object} Column
 * @property {string} key - Unique identifier for the column
 * @property {string} label - Column header label
 * @property {function(Object): React.ReactNode} render - Function to render cell content
 * @property {string} [className] - Optional CSS classes for the column
 * @property {string} [headerClassName] - Optional CSS classes for the header cell
 */

/**
 * @typedef {Object} Action
 * @property {string} label - Action button label
 * @property {function(Object): void} onClick - Click handler receiving the row item
 * @property {string} className - CSS classes for the button
 * @property {function(Object): boolean} [show] - Optional function to conditionally show action
 * @property {boolean} [disabled] - Whether the action is disabled
 */

/**
 * @typedef {Object} AdminTableProps
 * @property {Column[]} columns - Column configuration array
 * @property {Object[]} data - Array of data objects to display
 * @property {boolean} loading - Loading state
 * @property {string} [emptyMessage] - Message to show when no data
 * @property {Action[]} [actions] - Array of action button configurations
 * @property {string} [className] - Additional CSS classes for the table container
 */

const AdminTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'Данные не найдены',
  actions = [],
  className = '',
}) => {
  // Validate columns
  if (!Array.isArray(columns) || columns.length === 0) {
    console.warn('AdminTable: columns prop must be a non-empty array');
    return null;
  }

  // Validate data
  if (!Array.isArray(data)) {
    console.warn('AdminTable: data prop must be an array');
    return null;
  }

  // Render loading state
  if (loading) {
    return (
      <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.headerClassName || ''
                  }`}
                >
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Действия
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr key={item.id || rowIndex} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td
                    key={`${item.id || rowIndex}-${column.key}`}
                    className={`px-6 py-4 ${column.className || ''}`}
                  >
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-4">
                      {actions.map((action, actionIndex) => {
                        // Check if action should be shown
                        const shouldShow = action.show ? action.show(item) : true;

                        if (!shouldShow) return null;

                        return (
                          <button
                            key={`action-${actionIndex}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(item);
                            }}
                            disabled={action.disabled}
                            className={`hover:underline disabled:opacity-50 disabled:cursor-not-allowed ${action.className}`}
                            aria-label={`${action.label} ${item.name || item.id || ''}`}
                          >
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTable;
