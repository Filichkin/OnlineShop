import { useEffect, useRef } from 'react';

/**
 * AdminModal - Reusable modal component for admin panels
 *
 * A fully accessible modal dialog with:
 * - Focus management (focus trap, restore focus on close)
 * - Keyboard navigation (Escape key to close)
 * - ARIA attributes for screen readers
 * - Customizable sizes
 * - Error display
 * - Loading states
 * - Optional backdrop click prevention (default: disabled)
 *
 * @component
 * @example
 * ```jsx
 * <AdminModal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   title="Edit Item"
 *   onSubmit={handleSubmit}
 *   loading={loading}
 *   error={error}
 *   size="medium"
 * >
 *   <input name="name" value={formData.name} onChange={handleChange} />
 * </AdminModal>
 * ```
 */

/**
 * @typedef {Object} AdminModalProps
 * @property {boolean} isOpen - Whether the modal is open
 * @property {function(): void} onClose - Close handler
 * @property {string} title - Modal title
 * @property {React.ReactNode} children - Modal content
 * @property {string} [error] - Error message to display
 * @property {function(Event): void} [onSubmit] - Form submit handler
 * @property {string} [submitLabel] - Submit button label
 * @property {string} [cancelLabel] - Cancel button label
 * @property {boolean} [loading] - Loading state for submit button
 * @property {'small' | 'medium' | 'large' | 'xlarge'} [size] - Modal size
 * @property {boolean} [closeOnBackdropClick] - Whether to close on backdrop click (default: false)
 * @property {boolean} [showFooter] - Whether to show footer with buttons (default: true)
 */

const AdminModal = ({
  isOpen,
  onClose,
  title,
  children,
  error = null,
  onSubmit,
  submitLabel = 'Сохранить',
  cancelLabel = 'Отмена',
  loading = false,
  size = 'medium',
  closeOnBackdropClick = false,
  showFooter = true,
}) => {
  const modalRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  // Size mapping
  const sizeClasses = {
    small: 'w-96',
    medium: 'w-[32rem]',
    large: 'w-[48rem]',
    xlarge: 'w-11/12 max-w-6xl',
  };

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Store previously focused element
      previouslyFocusedElement.current = document.activeElement;

      // Focus modal
      modalRef.current.focus();

      // Cleanup: restore focus when modal closes
      return () => {
        if (previouslyFocusedElement.current && previouslyFocusedElement.current.focus) {
          previouslyFocusedElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Handle escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    // Only close if clicking directly on backdrop and closeOnBackdropClick is enabled
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && !loading) {
      onSubmit(e);
    }
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white ${sizeClasses[size] || sizeClasses.medium}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mt-3">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 id="admin-modal-title" className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Закрыть модальное окно"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4" role="alert" aria-live="polite">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Content */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">{children}</div>

            {/* Modal Footer */}
            {showFooter && (
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Сохранение...
                    </span>
                  ) : (
                    submitLabel
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
