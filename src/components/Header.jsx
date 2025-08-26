import { NavLink } from "react-router-dom";

function Header() {
  return (
    <header className="flex justify-between px-5 py-8 bg-blue-200 shadow-md">
      <img className="h-6" src="/logo.svg" alt="logo" />
      <nav>
        <ul className="flex gap-14">
          <li className="mb-4">
            <NavLink className="font-semibold" to={"/"}>
              Home
            </NavLink>
          </li>
          <li className="">
            <NavLink className="font-semibold" to={"/about"}>
              About
            </NavLink>
          </li>
          <li className="">
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
