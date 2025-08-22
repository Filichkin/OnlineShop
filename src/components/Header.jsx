import { NavLink } from "react-router-dom";

import styles from "./Header.module.css";

function Header() {
  return (
    <>
      <h1 className={styles.header}>Header</h1>
      {/* <a href="http://localhost:5173/about">about</a> */}
      <NavLink to={"/"}>Home</NavLink>
      <NavLink to={"/about"}>About</NavLink>
      <NavLink to={"/cart"}>Cart</NavLink>
      <hr />
    </>
  );
}

export default Header;
