import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="px-5 py-8 text-xs bg-blue-100">
      <div className="grid grid-cols-3">
        {/* Customer Support */}
        <div>
          <h3 className="mb-3 text-sm font-bold">
            Помощь
          </h3>
          <ul className="space-y-1">
            <li>
              <Link className="hover:underline" to="#">FAQs</Link>
            </li>
            <li>
              <Link className="hover:underline" to="#">Обмен и возврат</Link>
            </li>
            <li>
              <Link className="hover:underline" to="#">Где мой заказ?</Link>
            </li>
            <li>
              <Link className="hover:underline" to="#">Контакты</Link>
            </li>
          </ul>
        </div>

        {/* About and Information */}
        <div>
          <h3 className="mb-3 text-sm font-bold">О нас</h3>
          <ul className="space-y-1">
            <li>
              <Link className="hover:underline" to="/about">О компании</Link>
            </li>
            <li>
              <Link className="hover:underline" to="/information">Информация</Link>
            </li>
            <li>
              <Link className="hover:underline" to="#">Наша команда</Link>
            </li>
            <li>
              <Link className="hover:underline" to="#">Карьера</Link>
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="mb-3 text-sm font-bold">Контакты</h3>
          <p>Email: support@yourstore.com</p>
          <p>Телефон: +7 495 001-01-00</p>
          <p>Адрес: г. Москва, Валовая 26</p>
        </div>
      </div>

      <div className="text-center text-gray-500 mt-7">
        <p>&copy; 2025 YourStore. Все права защищены.</p>
      </div>
    </footer>
  );
}

export default Footer;
