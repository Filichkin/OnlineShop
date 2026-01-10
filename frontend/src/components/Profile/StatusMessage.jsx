/**
 * StatusMessage - компонент для отображения сообщений об успехе или ошибке
 */
function StatusMessage({ type, message }) {
  if (!message) return null;

  const styles = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <div className={`mb-4 p-3 rounded-md text-sm ${styles[type]}`}>
      {message}
    </div>
  );
}

export default StatusMessage;
