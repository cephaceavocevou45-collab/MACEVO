import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderKanban,
  FileCode2,
  Globe2,
  Star,
  Trash2,
  BarChart3,
  Settings,
  UserRound,
  CircleHelp,
  HardDrive,
  Crown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navigationItems = [
  { to: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { to: "/rapports", label: "Mes rapports", icon: FileText },
  { to: "/rapports/nouveau", label: "Nouveau rapport", icon: PlusCircle },
  { to: "/rapports/templates", label: "Modèles", icon: FolderKanban },
  { to: "/rapports/document-vierge", label: "Document vierge", icon: FileCode2 },
  { to: "/rapports/depot-scientifique", label: "Dépôt scientifique", icon: Globe2 },
  { to: "/word-to-latex", label: "Word vers LaTeX", icon: FileCode2 },
  { to: "/pdf-to-latex", label: "PDF vers LaTeX", icon: FileText },
  { to: "/favoris", label: "Favoris", icon: Star },
  { to: "/corbeille", label: "Corbeille", icon: Trash2 },
  { to: "/statistiques", label: "Statistiques", icon: BarChart3 },
  { to: "/stockage", label: "Stockage", icon: HardDrive },
  { to: "/premium", label: "Offres Premium", icon: Crown },
  { to: "/parametres", label: "Paramètres", icon: Settings },
  { to: "/profil", label: "Profil", icon: UserRound },
  { to: "/support", label: "Aide et support", icon: CircleHelp },
];

export default function Navbar({ searchQuery, setSearchQuery, search, setSearch, title, subtitle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const query = searchQuery ?? search ?? "";
  const updateQuery = setSearchQuery ?? setSearch;

  return (
    <header className="relative z-30 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-[#161b22] sm:px-5 lg:px-8">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={menuOpen}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {title && (
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100 sm:text-[15px]">
            {title}
          </p>
          {subtitle && (
            <p className="mt-1 hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {updateQuery && (
        <label className="relative min-w-0 flex-1 sm:max-w-96">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="search"
            placeholder="Rechercher un rapport…"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            aria-label="Rechercher dans les rapports"
            className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
      )}

      <Link
        to="/profil"
        aria-label="Ouvrir mon profil"
        className="ml-auto flex min-w-0 items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 sm:gap-3 sm:pl-3 sm:border-l sm:border-slate-200 sm:dark:border-slate-800"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          {(user?.firstName || user?.fullName || "U").slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-36 truncate text-xs font-bold text-slate-800 dark:text-white">
            {user?.fullName || "Mon profil"}
          </span>
          <span className="block text-[11px] text-slate-400">Compte personnel</span>
        </span>
      </Link>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-16 z-40 cursor-default bg-slate-950/20 lg:hidden"
          />
          <nav className="absolute left-0 right-0 top-full z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-[#161b22] lg:hidden">
            <div className="grid gap-1 sm:grid-cols-2">
              {navigationItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
