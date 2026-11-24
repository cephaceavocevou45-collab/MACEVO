import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logoi from "../../assets/image/logoi.png";

function Logo() {
  return (
    <Link to="/" aria-label="Accueil Macevo">
      <motion.img
        src={logoi}
        alt="Logo Macevo"
        className="h-14 w-auto lg:h-16"
        whileHover={{
          scale: 1.08,
          rotate: 2,
        }}
        transition={{
          duration: 0.3,
        }}
      />
    </Link>
  );
}

export default Logo;