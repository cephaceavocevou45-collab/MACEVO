import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logoi from "../../assets/image/logoi.png";

const sectionLinks = [
  { href: "#features", label: "Fonctionnalités" },
  { href: "#how-it-works", label: "Comment ça marche" },
  { href: "#about", label: "À propos" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-[96%] items-center justify-between gap-3 px-3 py-2 sm:min-h-20 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
          <img src={logoi} alt="Logo Macevo" className="h-9 w-auto object-contain sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex xl:gap-8">
          <NavLink to="/" className={({ isActive }) => isActive ? "font-semibold text-blue-600" : "text-slate-600 transition hover:text-blue-600"}>
            Accueil
          </NavLink>
          {sectionLinks.map(({ href, label }) => (
            <a key={href} href={href} className="text-slate-600 transition hover:text-blue-600">
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex lg:gap-3">
          <Link to="/connexion" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-blue-600 lg:px-5">
            Se connecter
          </Link>
          <Link to="/inscription" className="rounded-xl bg-blue-600 px-3 py-2.5 text-center text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:text-sm lg:px-5">
            Commencer gratuitement
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="absolute left-0 right-0 top-full border-b border-slate-200 bg-white p-4 shadow-xl sm:hidden">
          <div className="mx-auto grid max-w-xl gap-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Accueil</Link>
            {sectionLinks.map(({ href, label }) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <Link to="/connexion" onClick={() => setMenuOpen(false)} className="rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-semibold text-slate-700">Se connecter</Link>
              <Link to="/inscription" onClick={() => setMenuOpen(false)} className="rounded-xl bg-blue-600 px-3 py-3 text-center text-sm font-semibold text-white">S’inscrire</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
