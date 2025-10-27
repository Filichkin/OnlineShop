function Cart() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Form submitted!");
  };

  return (
    <div className="max-w-md p-5 py-16 mx-auto">
      <h1 className="mb-6 text-2xl font-bold text-center">Shopping Cart</h1>

      {/* Список товаров */}
      <section className="mb-8" aria-labelledby="cart-items-heading">
        <h2 id="cart-items-heading" className="mb-4 text-lg font-semibold">Your Items:</h2>
        <ul className="space-y-2">
          <li className="flex items-center justify-between pb-2 border-b">
            <span>Product 1</span>
            <span>$25</span>
          </li>
          <li className="flex items-center justify-between pb-2 border-b">
            <span>Product 2</span>
            <span>$45</span>
          </li>
        </ul>
        <p className="mt-4 font-medium text-md">Total: $70</p>
      </section>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="checkout-form-heading">
        <h2 id="checkout-form-heading" className="text-lg font-semibold">Enter Your Details:</h2>

        {/* Personal Information Fieldset */}
        <fieldset className="space-y-5 border-none p-0">
          <legend className="sr-only">Personal Information</legend>

          {/* Поле Name */}
          <div className="flex flex-col">
            <input
              className="p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 peer"
              id="name"
              type="text"
              placeholder="Enter your full name"
              required
            />
            <label
              className="text-sm text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-blue-500"
              htmlFor="name">
              Name
            </label>
          </div>

          {/* Поле Email */}
          <div className="flex flex-col">
            <input
              className="p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 peer"
              id="email"
              type="email"
              placeholder="Enter your email address"
              required
            />
            <label
              className="text-sm text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-blue-500"
              htmlFor="email">
              Email
            </label>
          </div>
        </fieldset>

        {/* Delivery Information Fieldset */}
        <fieldset className="space-y-5 border-none p-0">
          <legend className="sr-only">Delivery Information</legend>

          {/* Поле Address */}
          <div className="flex flex-col">
            <textarea
              className="p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 peer"
              id="address"
              placeholder="Enter your delivery address"
              rows="3"
              required
            ></textarea>
            <label
              className="text-sm text-gray-500 peer-placeholder-shown:text-gray-400 peer-focus:text-blue-500"
              htmlFor="address">
              Address
            </label>
          </div>
        </fieldset>

        {/* Payment Information Fieldset */}
        <fieldset className="space-y-5 border-none p-0">
          <legend className="sr-only">Payment Information</legend>

          {/* Поле Payment */}
          <div className="flex flex-col">
            <select
              className="p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 peer"
              id="payment"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Select payment method
              </option>
              <option value="creditCard">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Cash on Delivery</option>
            </select>
            <label
              className="text-sm text-gray-500 peer-focus:text-blue-500"
              htmlFor="payment">
              Payment Method
            </label>
          </div>
        </fieldset>

        {/* Кнопка Submit */}
        <button
          className="w-full px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          type="submit">
          Place Order
        </button>
      </form>
    </div>
  );
}

export default Cart;
