import { Link, NavLink } from "react-router-dom"

function Home() {
    return (
        <div>
            Home Page
            <NavLink to={"/"}>Home</NavLink>
            <NavLink to={"about"}>About</NavLink>
            <NavLink to={"product"}>Products</NavLink>
            <NavLink to={"cart"}>Cart</NavLink>
        </div>
    )
}

export default Home
