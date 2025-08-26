import { NavLink } from "react-router-dom";

export default function NavMenuLink({ to, children }) {
    return (
        <NavLink className="font-semibold text-gray-600" to={to}>
          {children}
        </NavLink>
    );
}