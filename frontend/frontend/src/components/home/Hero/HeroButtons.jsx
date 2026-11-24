import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";

export default function HeroButtons() {
  return (
    <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
      <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
        <Link
          to="/inscription"
          className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-xl transition hover:shadow-blue-300 sm:w-auto sm:px-8 sm:py-4"
        >
          Commencer gratuitement
          <ArrowRight size={20} />
        </Link>
      </motion.div>

      <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
        <Link
          to="/#how-it-works"
          className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-md transition hover:border-blue-500 hover:text-blue-600 hover:shadow-lg sm:w-auto sm:px-8 sm:py-4"
        >
          <PlayCircle size={22} className="transition-transform duration-300 group-hover:rotate-12" />
          Voir les étapes
        </Link>
      </motion.div>
    </div>
  );
}
