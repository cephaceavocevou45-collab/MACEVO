import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function CTAButton() {
  return (
    <Link
      to="/inscription"
      className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
    >
      Commencer gratuitement

      <ArrowRight
        size={18}
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </Link>
  );
}

export default CTAButton;