import { Link } from "react-router-dom";
import logoi from "../../assets/image/logo.png";

const platformLinks = [
  { to: "/#features", label: "Fonctionnalités" },
  { to: "/#how-it-works", label: "Comment ça marche" },
  { to: "/#about", label: "À propos" },
];

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-3 md:py-16">
        <div className="md:col-span-1">
          <Link to="/" aria-label="MACEVO, accueil">
            <img src={logoi} alt="MACEVO" className="mb-5 h-14 w-auto object-contain" />
          </Link>
          <p className="max-w-md text-sm leading-7 text-slate-400">
            Un espace de rédaction pour créer, organiser et exporter vos rapports scientifiques.
          </p>
        </div>

        <nav aria-label="Découvrir MACEVO">
          <h2 className="mb-4 text-sm font-semibold text-white">Découvrir</h2>
          <ul className="space-y-3 text-sm">
            {platformLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="transition hover:text-blue-300">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Compte">
          <h2 className="mb-4 text-sm font-semibold text-white">Votre espace</h2>
          <ul className="space-y-3 text-sm">
            <li><Link to="/connexion" className="transition hover:text-blue-300">Se connecter</Link></li>
            <li><Link to="/inscription" className="transition hover:text-blue-300">Créer un compte</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-slate-800 px-5 py-5 text-center text-xs text-slate-500 sm:px-8">
        © 2026 MACEVO. Tous droits réservés.
      </div>
    </footer>
  );
}

export default Footer;
