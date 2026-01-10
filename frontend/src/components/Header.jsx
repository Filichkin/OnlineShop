import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavMenuLink from "../UI/NavLinkMenu";
import logo from "../assets/images/vector_logo.svg";
import cartIcon from "../assets/images/cart.webp";
import favoriteIcon from "../assets/images/favorite_heart.webp";
import profileIcon from "../assets/images/profile.webp";
import adminIcon from "../assets/images/admin.webp";
import { selectCartTotalItems } from '../store/slices/cartSlice';
import { selectFavoritesTotalItems } from '../store/slices/favoritesSlice';
import { getCurrentUser } from '../store/slices/authSlice';
import LoginModal from './LoginModal';

/**
 * Header компонент с счетчиками корзины и избранного
 *
 * ОПТИМИЗАЦИЯ: Использует useSelector для получения количества товаров из Redux.
 * Компонент ре-рендерится только когда изменяется totalItems или totalFavorites.
 */
function Header({ onOpenLoginModal }) {
  // Получаем количество товаров в корзине и избранном из Redux
  const totalItems = useSelector(selectCartTotalItems);
  const totalFavorites = useSelector(selectFavoritesTotalItems);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  
  // Debug: log when Header re-renders with new values
  console.log('[Header] Re-render - totalItems:', totalItems, 'totalFavorites:', totalFavorites, 'isAuthenticated:', isAuthenticated);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleProfileClick = async () => {
    if (isAuthenticated) {
      // Proactively check token validity before navigation
      try {
        await dispatch(getCurrentUser()).unwrap();
        // Token is valid, proceed to profile
        navigate('/profile');
      } catch (error) {
        // Token is invalid or expired - do not navigate, open login modal instead
        if (onOpenLoginModal) {
          onOpenLoginModal();
        } else {
          setIsLoginModalOpen(true);
        }
      }
    } else {
      // User not authenticated, show login modal
      if (onOpenLoginModal) {
        onOpenLoginModal();
      } else {
        setIsLoginModalOpen(true);
      }
    }
  };

  // Get display name for profile button
  const getDisplayName = () => {
    return isAuthenticated ? 'Профиль' : 'Вход';
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-5 h-18 sm:h-24 bg-white shadow-sm">
        <NavMenuLink to="/">
          <div className="h-18 sm:h-24 overflow-hidden flex items-center cursor-pointer">
            <img
              src={logo}
              alt="logo"
              className="h-[100%] object-contain"
            />
          </div>
        </NavMenuLink>
        <nav>
          <ul className="flex gap-4 sm:gap-8 lg:gap-14">
            {/* <li>
              <NavMenuLink to={"/"}>
                <span className="flex flex-col items-center gap-1">
                  <img className="w-8 h-8 sm:w-10 sm:h-10 object-contain" src={homeIcon} alt="Главная" />
                  <span className="hidden sm:inline">Главная</span>
                </span>
              </NavMenuLink>
            </li> */}
            <li>
              <NavMenuLink to={"/cart"}>
                <span className="flex flex-col items-center gap-1">
                  <span className="relative flex">
                    <img className="w-8 h-8 sm:w-10 sm:h-10 object-contain" src={cartIcon} alt="Корзина" />
                    {/* Badge с количеством товаров - привязан к иконке */}
                    {totalItems > 0 && (
                      <span
                        className="absolute -top-2 -right-2 flex items-center justify-center min-w-[1.125rem] h-[1.125rem] text-[10px] font-medium text-white bg-gray-700 rounded-full"
                        aria-label={`${totalItems} товаров в корзине`}
                      >
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:inline">Корзина</span>
                </span>
              </NavMenuLink>
            </li>
            <li>
              <NavMenuLink to={"/favorites"}>
                <span className="flex flex-col items-center gap-1">
                  <span className="relative flex">
                    <img className="w-8 h-8 sm:w-10 sm:h-10 object-contain" src={favoriteIcon} alt="Избранное" />
                    {/* Badge с количеством избранных товаров - привязан к иконке */}
                    {totalFavorites > 0 && (
                      <span
                        className="absolute -top-2 -right-2 flex items-center justify-center min-w-[1.125rem] h-[1.125rem] text-[10px] font-medium text-white bg-gray-700 rounded-full"
                        aria-label={`${totalFavorites} товаров в избранном`}
                      >
                        {totalFavorites > 99 ? '99+' : totalFavorites}
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:inline">Избранное</span>
                </span>
              </NavMenuLink>
            </li>
            <li>
              <button
                onClick={handleProfileClick}
                className={`flex flex-col items-center gap-1 text-sm transition-colors ${
                  location.pathname === '/profile' ? 'text-gray-900 font-semibold' : 'text-gray-600'
                }`}
                aria-label={isAuthenticated ? "Профиль" : "Вход"}
              >
                <img className="w-8 h-8 sm:w-10 sm:h-10 object-contain" src={profileIcon} alt={isAuthenticated ? "Профиль" : "Вход"} />
                <span className="hidden sm:inline max-w-[80px] truncate" title={getDisplayName()}>
                  {getDisplayName()}
                </span>
              </button>
            </li>
            {/* Admin icon - only visible for superusers */}
            {isAuthenticated && user?.is_superuser && (
              <li>
                <NavMenuLink to={"/admin"}>
                  <span className="flex flex-col items-center gap-1">
                    <img className="w-8 h-8 sm:w-10 sm:h-10 object-contain" src={adminIcon} alt="Админ-панель" />
                    <span className="hidden sm:inline">Админ</span>
                  </span>
                </NavMenuLink>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}

export default Header;
