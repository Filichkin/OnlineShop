import { Link } from "react-router-dom";
import { typography, effects } from "../styles/designSystem";

/**
 * CatalogCard Component
 * Displays a card linking to the main catalog page
 * Features hover effects matching BrandCard styling
 */
function CatalogCard() {
  return (
    <Link
      to="/catalog"
      className="group block h-full"
    >
      <div
        className={`
          h-full w-full
          bg-white ${effects.rounded['3xl']} ${effects.shadow.sm}
          flex items-center justify-center
          hover:shadow-lg hover:shadow-blue-300/60
          hover:-translate-y-0.5
          ${effects.transition.shadow}
          transition-transform duration-300
          cursor-pointer
        `}
      >
        <span className={`${typography.fontSize.xl} ${typography.fontWeight.semibold} ${typography.textColor.primary}`}>
          Каталог
        </span>
      </div>
    </Link>
  );
}

export default CatalogCard;
