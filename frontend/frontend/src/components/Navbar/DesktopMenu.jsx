import { NavLink } from "react-router-dom";
import navLinks from "./navLinks";

function DesktopMenu() {
  return (
    <nav className="hidden items-center gap-8 lg:flex">
      {navLinks.map((link) => {
        // Liens internes de la page (#...)
        if (link.href.startsWith("#")) {
          return (
            <a
              key={link.name}
              href={link.href}
              className="relative font-medium text-gray-700 transition duration-300 hover:text-blue-600 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.name}
            </a>
          );
        }

        // Routes React
        return (
          <NavLink
            key={link.name}
            to={link.href}
            className={({ isActive }) =>
              `relative font-medium transition duration-300
              ${
                isActive
                  ? "text-blue-600 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-blue-600"
                  : "text-gray-700 hover:text-blue-600 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
              }`
            }
          >
            {link.name}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default DesktopMenu;