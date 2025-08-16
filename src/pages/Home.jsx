import { Link } from "react-router-dom"

function Home() {
    return (
        <div>
            Home Page
            <Link to={"/"}>Home</Link>
            <Link to={"about"}>About</Link>
            <Link to={"product"}>Products</Link>
            <Link to={"cart"}>Cart</Link>
        </div>
    )
}

export default Home
