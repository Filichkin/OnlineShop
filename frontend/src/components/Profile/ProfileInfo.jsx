import StatusMessage from './StatusMessage';
import ProfileForm from './ProfileForm';
import ProfileDisplay from './ProfileDisplay';

/**
 * ProfileInfo - секция профиля с возможностью редактирования
 */
function ProfileInfo({
  isEditing,
  profileData,
  validationErrors,
  loading,
  error,
  successMessage,
  onEditStart,
  onInputChange,
  onSubmit,
  onCancel
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Профайл</h2>
        {!isEditing && (
          <button
            onClick={onEditStart}
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
          >
            Редактировать
          </button>
        )}
      </div>

      <StatusMessage type="success" message={successMessage} />
      <StatusMessage type="error" message={error} />

      {isEditing ? (
        <ProfileForm
          profileData={profileData}
          validationErrors={validationErrors}
          loading={loading}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      ) : (
        <ProfileDisplay profileData={profileData} />
      )}
    </div>
  );
}

export default ProfileInfo;
