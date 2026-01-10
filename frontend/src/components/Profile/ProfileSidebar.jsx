import { useNavigate } from 'react-router-dom';

/**
 * ProfileSidebar - боковое меню с вкладками профиля
 */
function ProfileSidebar({ tabs, activeTab, onTabChange }) {
  const navigate = useNavigate();

  const handleTabClick = (tabId) => {
    if (tabId === 'favorites') {
      navigate('/favorites');
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div className="lg:w-64 flex-shrink-0">
      <nav className="bg-white rounded-lg shadow-md p-2 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-100 text-gray-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <img
              src={tab.icon}
              alt={tab.label}
              className="w-6 h-6 object-contain"
            />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default ProfileSidebar;
