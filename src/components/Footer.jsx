import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer>
      <div>
        {/* Customer Support */}
        <div>
          <h3>
            Customer <br /> Support
          </h3>
          <ul>
            <li>
              <Link to="#">FAQs</Link>
            </li>
            <li>
              <Link to="#">Shipping & Returns</Link>
            </li>
            <li>
              <Link to="#">Order Tracking</Link>
            </li>
            <li>
              <Link to="#">Contact Us</Link>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3>Follow Us</h3>
          <ul>
            <li>
              <Link to="#">Facebook</Link>
            </li>
            <li>
              <Link to="#">Instagram</Link>
            </li>
            <li>
              <Link to="#">Twitter</Link>
            </li>
            <li>
              <Link to="#">LinkedIn</Link>
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div>
          <h3>Contact Us</h3>
          <p>Email: support@yourstore.com</p>
          <p>Phone: +1 234 567 890</p>
          <p>Address: 123 Market Street, City, Country</p>
        </div>
      </div>

      <div>
        <p>&copy; 2025 YourStore. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
