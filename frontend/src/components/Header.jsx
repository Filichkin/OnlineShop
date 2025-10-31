import { useSelector } from 'react-redux';
import NavMenuLink from "../UI/NavLinkMenu";
import logo from "../assets/images/logo.svg";
import homeIcon from "../assets/images/home.webp";
import aboutIcon from "../assets/images/about.webp";
import cartIcon from "../assets/images/cart.webp";
import favoriteIcon from "../assets/images/favorite.webp";
import { selectCartTotalItems } from '../store/slices/cartSlice';

/**
 * Header компонент с счетчиком корзины
 *
 * ОПТИМИЗАЦИЯ: Использует useSelector для получения количества товаров из Redux.
 * Компонент ре-рендерится только когда изменяется totalItems.
 */
function Header() {
  // Получаем количество товаров в корзине из Redux
  const totalItems = useSelector(selectCartTotalItems);

  return (
    <header className="flex justify-between px-5 py-4 bg-blue-100 shadow-md">
      <img className="h-6" src={logo} alt="logo" />
      <nav>
        <ul className="flex gap-14">
          <li>
            <NavMenuLink to={"/"}>
              <span className="flex flex-col items-center gap-1">
                <img className="w-10 h-10 object-contain" src={homeIcon} alt="Главная" />
                <span>Главная</span>
              </span>
            </NavMenuLink>
          </li>
          <li>
            <NavMenuLink to={"/about"}>
              <span className="flex flex-col items-center gap-1">
                <img className="w-10 h-10 object-contain" src={aboutIcon} alt="О нас" />
                <span>О нас</span>
              </span>
            </NavMenuLink>
          </li>
          <li>
            <NavMenuLink to={"/cart"}>
              <span className="flex flex-col items-center gap-1">
                <span className="relative flex">
                  <img className="w-10 h-10 object-contain" src={cartIcon} alt="Корзина" />
                  {/* Badge с количеством товаров - привязан к иконке */}
                  {totalItems > 0 && (
                    <span
                      className="absolute -top-2 -right-2 flex items-center justify-center min-w-[1.125rem] h-[1.125rem] text-[10px] font-medium text-white bg-red-600 rounded-full"
                      aria-label={`${totalItems} товаров в корзине`}
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </span>
                <span>Корзина</span>
              </span>
            </NavMenuLink>
          </li>
          <li>
            <NavMenuLink to={"/favorites"}>
              <span className="flex flex-col items-center gap-1">
                <img className="w-10 h-10 object-contain" src={favoriteIcon} alt="Избранное" />
                <span>Избранное</span>
              </span>
            </NavMenuLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
