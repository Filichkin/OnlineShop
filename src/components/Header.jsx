import { NavLink } from "react-router-dom";

function Header() {
  return (
    <header className="px-5 py-8 bg-blue-200">
      <img className="h-6" src="/logo.svg" alt="logo" />
      <nav>
        <ul className="space-x-8">
          <li className="inline mb-4">
            <NavLink className="font-semibold" to={"/"}>
              Home
            </NavLink>
          </li>
          <li className="inline">
            <NavLink className="font-semibold" to={"/about"}>
              About
            </NavLink>
          </li>
          <li className="inline">
            <NavLink className="font-semibold" to={"/cart"}>
              Cart
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
