import { NavLink } from "react-router-dom";

function Header() {
  return (
    <>
      <h1 className="flex mb-5 text-4xl text-emerald-800">Header</h1>
      <NavLink to={"/"}>Home</NavLink>
      <NavLink to={"/about"}>About</NavLink>
      <NavLink to={"/cart"}>Cart</NavLink>
      <hr />
    </>
  );
}

export default Header;
