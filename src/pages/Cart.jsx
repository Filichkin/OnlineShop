import { Link, useNavigate } from "react-router-dom"

function Cart() {
    const navigate = useNavigate();

    return (
        <div>
          {/* <Link to={"/thanks"}>
            <button>Order</button>
          </Link> */}
          <button onClick={() => navigate("/thanks")}>Order</button>
        </div>
    )
}

export default Cart
