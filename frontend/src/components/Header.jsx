import { useSelector } from 'react-redux';
import NavMenuLink from "../UI/NavLinkMenu";
import logo from "../assets/images/logo.svg";
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
    <header className="flex justify-between px-5 py-8 bg-blue-100 shadow-md">
      <img className="h-6" src={logo} alt="logo" />
      <nav>
        <ul className="flex gap-14">
          <li>
            <NavMenuLink to={"/"}>
              Главная
            </NavMenuLink>
          </li>
          <li>
            <NavMenuLink to={"/about"}>
              О нас
            </NavMenuLink>
          </li>
          <li>
            <NavMenuLink to={"/cart"}>
              <span className="inline-flex items-center gap-2">
                <span className="relative inline-block">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                    />
                  </svg>
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
        </ul>
      </nav>
    </header>
  );
}

export default Header;
