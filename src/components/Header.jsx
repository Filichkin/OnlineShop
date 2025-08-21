import { NavLink } from "react-router-dom"

function Header() {
    return (
        <>
        <h1>Header</h1>
					<NavLink to={"/"}>Home</NavLink>
					<NavLink to={"/about"}>About</NavLink>
					<NavLink to={"/cart"}>Cart</NavLink>
					<hr />
        </>
    )
}

export default Header
