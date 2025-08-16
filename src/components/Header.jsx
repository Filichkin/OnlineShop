import { NavLink } from "react-router-dom"

function Header() {
    return (
        <>
            <NavLink to={"/"}>Home</NavLink>
            <NavLink to={"/about"}>About</NavLink>
            <NavLink to={"/product"}>Products</NavLink>
            <NavLink to={"/cart"}>Cart</NavLink>
        </>
    )
}

export default Header
