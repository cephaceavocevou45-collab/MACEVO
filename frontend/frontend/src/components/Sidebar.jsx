import { useNavigate, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderKanban,
  Star,
  Trash2,
  FileCode2,
  Settings,
  User,
  HelpCircle,
  HardDrive,
  Crown,
  FileEdit,
  BarChart3,
  Globe2,
} from "lucide-react";

export default function Sidebar({
  storageUsed = "24.6 GB",
  storageTotal = "100 GB",
  storagePercent = 24.6,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  /**
   * Détermine si une entrée du Sidebar est active.
   *
   * Les routes particulières sont traitées explicitement afin
   * d'éviter qu'une route générale ne reste active sur une
   * sous-page qui ne lui appartient pas.
   */
  const isActive = (path) => {
    const current = currentPath;

    // ------------------------------------------------------------
    // ACCUEIL
    // ------------------------------------------------------------

    if (path === "/dashboard") {
      return current === "/dashboard";
    }

    // ------------------------------------------------------------
    // MES RAPPORTS
    // ------------------------------------------------------------

    if (path === "/rapports") {
      return (
        current === "/rapports" ||
        (
          current.startsWith("/rapports/") &&
          !current.startsWith("/rapports/demarrer") &&
          !current.startsWith("/rapports/nouveau") &&
          !current.startsWith("/rapports/creer") &&
          !current.startsWith("/rapports/templates") &&
          !current.startsWith("/rapports/modeles-latex") &&
          !current.startsWith("/rapports/import-word") &&
          !current.startsWith("/rapports/document-vierge") &&
          !current.startsWith("/rapports/generateur-scientifique") &&
          !current.startsWith("/rapports/editeur") &&
          !current.startsWith("/rapports/depot-scientifique")
        )
      );
    }

    // ------------------------------------------------------------
    // ÉDITEUR
    // ------------------------------------------------------------

    if (path === "/rapports/editeur") {
      return (
        current === "/rapports/editeur" ||
        current.startsWith("/rapports/editeur/")
      );
    }

    // ------------------------------------------------------------
    // NOUVEAU RAPPORT
    // ------------------------------------------------------------

    if (path === "/rapports/demarrer") {
      return (
        current === "/rapports/demarrer" ||
        current === "/rapports/import-word" ||
        current.startsWith("/rapports/import-word")
      );
    }

    // ------------------------------------------------------------
    // MODÈLES
    // ------------------------------------------------------------

    if (path === "/rapports/templates") {
      return (
        current === "/rapports/templates" ||
        current.startsWith("/rapports/templates") ||
        current === "/modeles"
      );
    }

    // ------------------------------------------------------------
    // DOCUMENT VIERGE
    // ------------------------------------------------------------

    if (path === "/rapports/document-vierge") {
      return (
        current === "/rapports/document-vierge" ||
        current.startsWith("/rapports/document-vierge")
      );
    }

    // ------------------------------------------------------------
    // DÉPÔT SCIENTIFIQUE
    // ------------------------------------------------------------

    if (path === "/rapports/depot-scientifique") {
      return (
        current === "/rapports/depot-scientifique" ||
        current.startsWith("/rapports/depot-scientifique/")
      );
    }

    // ------------------------------------------------------------
    // CONVERSION WORD → LATEX
    // ------------------------------------------------------------

    if (path === "/word-to-latex") {
      return (
        current === "/word-to-latex" ||
        current === "/fonctionnalites/word-latex" ||
        current.startsWith("/fonctionnalites/word-latex/")
      );
    }

    if (path === "/pdf-to-latex") {
      return current === "/pdf-to-latex";
    }

    // ------------------------------------------------------------
    // STATISTIQUES
    // ------------------------------------------------------------

    if (path === "/statistiques") {
      return (
        current === "/statistiques" ||
        current.startsWith("/statistiques/")
      );
    }

    // ------------------------------------------------------------
    // AUTRES ROUTES
    // ------------------------------------------------------------

    return (
      current === path ||
      (
        path !== "/" &&
        current.startsWith(`${path}/`)
      )
    );
  };

  /**
   * Classe visuelle commune aux boutons.
   */
  const getButtonClass = (path) => `
    w-full
    flex
    items-center
    gap-3
    px-3.5
    py-2.5
    rounded-xl
    font-medium
    text-xs
    transition-all
    duration-200
    ${
      isActive(path)
        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/20 font-semibold ring-1 ring-blue-500/20"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100"
    }
  `;

  /**
   * Navigation principale.
   */
  const mainNav = [
    {
      path: "/dashboard",
      label: "Accueil",
      icon: LayoutDashboard,
    },
    {
      path: "/rapports",
      label: "Mes rapports",
      icon: FileText,
    },
    {
      path: "/rapports/editeur",
      label: "Éditeur",
      icon: FileEdit,
    },
    {
      path: "/rapports/nouveau",
      label: "Nouveau rapport",
      icon: PlusCircle,
    },
    {
      path: "/rapports/templates",
      label: "Modèles",
      icon: FolderKanban,
    },
    {
      path: "/rapports/document-vierge",
      label: "Document vierge",
      icon: FileCode2,
    },
    {
      path: "/rapports/depot-scientifique",
      label: "Dépôt scientifique",
      icon: Globe2,
    },
    {
      path: "/favoris",
      label: "Favoris",
      icon: Star,
    },
    {
      path: "/corbeille",
      label: "Corbeille",
      icon: Trash2,
    },
  ];

  /**
   * Outils de la plateforme.
   */
  const toolsNav = [
    {
      path: "/word-to-latex",
      label: "Conversion Word → LaTeX",
      icon: FileCode2,
    },
    {
      path: "/pdf-to-latex",
      label: "PDF → LaTeX",
      icon: FileText,
    },
    {
      path: "/statistiques",
      label: "Statistiques",
      icon: BarChart3,
    },
  ];

  /**
   * Paramètres et assistance.
   */
  const settingsNav = [
    {
      path: "/parametres",
      label: "Paramètres",
      icon: Settings,
    },
    {
      path: "/profil",
      label: "Profil",
      icon: User,
    },
    {
      path: "/support",
      label: "Aide & Support",
      icon: HelpCircle,
    },
  ];

  /**
   * Navigation sécurisée.
   */
  const handleNavigate = (path) => {
    if (currentPath !== path) {
      navigate(path);
    }
  };

  return (
    <aside
      className="
        w-[17rem]
        bg-gradient-to-b from-white via-white to-slate-50/80
        dark:bg-[#161b22]
        border-r
        border-slate-200
        dark:border-slate-800
        flex
        flex-col
        justify-between
        hidden
        lg:flex
        select-none
        shrink-0
        h-screen
        sticky
        top-0
      "
    >
      {/* =========================================================
          PARTIE SUPÉRIEURE
      ========================================================== */}

      <div className="overflow-y-auto flex-1 px-4 py-6 space-y-6">

        {/* -------------------------------------------------------
            LOGO / IDENTITÉ
        -------------------------------------------------------- */}

        <div className="flex items-center gap-3 px-2">
          <div
            className="
              w-9
              h-9
              bg-blue-600
              rounded-xl
              flex
              items-center
              justify-center
              text-white
              font-bold
              text-lg
              shadow-md
              shadow-blue-500/20
            "
          >
              M
          </div>

          <div>
            <h1
              className="
                font-extrabold
                text-slate-900
                dark:text-white
                tracking-wide
                text-base
              "
            >
              MACEVO
            </h1>

            <p className="text-[13px] text-slate-400 font-medium">
              Plateforme intelligente
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------
            NAVIGATION PRINCIPALE
        -------------------------------------------------------- */}

        <nav className="space-y-1">
          {mainNav.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              type="button"
              onClick={() => handleNavigate(path)}
              className={getButtonClass(path)}
              aria-current={isActive(path) ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* -------------------------------------------------------
            OUTILS
        -------------------------------------------------------- */}

        <div
          className="
            space-y-1
            pt-2
            border-t
            border-slate-100
            dark:border-slate-800/80
          "
        >
          <p
            className="
              px-3
              text-[10px]
              font-bold
              tracking-wider
              text-slate-400
              uppercase
              mb-2
            "
          >
            Outils
          </p>

          {toolsNav.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              type="button"
              onClick={() => handleNavigate(path)}
              className={getButtonClass(path)}
              aria-current={isActive(path) ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* -------------------------------------------------------
            PARAMÈTRES
        -------------------------------------------------------- */}

        <div
          className="
            space-y-1
            pt-2
            border-t
            border-slate-100
            dark:border-slate-800/80
          "
        >
          <p
            className="
              px-3
              text-[10px]
              font-bold
              tracking-wider
              text-slate-400
              uppercase
              mb-2
            "
          >
            Paramètres
          </p>

          {settingsNav.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              type="button"
              onClick={() => handleNavigate(path)}
              className={getButtonClass(path)}
              aria-current={isActive(path) ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          PARTIE INFÉRIEURE
      ========================================================== */}

      <div
        className="
          p-4
          border-t
          border-slate-200
          dark:border-slate-800
          space-y-4
        "
      >

        {/* -------------------------------------------------------
            STOCKAGE
        -------------------------------------------------------- */}

        <div
          className="
            bg-slate-50
            dark:bg-slate-900/60
            p-3.5
            rounded-2xl
            border
            border-slate-200
            dark:border-slate-800/80
            space-y-2
          "
        >
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500">
              Stockage utilisé
            </span>

            <span className="text-slate-800 dark:text-slate-200">
              {storageUsed} / {storageTotal}
            </span>
          </div>

          <div
            className="
              w-full
              bg-slate-200
              dark:bg-slate-800
              h-1.5
              rounded-full
              overflow-hidden
            "
          >
            <div
              className="
                bg-blue-600
                h-full
                rounded-full
                transition-all
                duration-500
              "
              style={{
                width: `${Math.min(
                  Math.max(storagePercent, 0),
                  100
                )}%`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => handleNavigate("/stockage")}
            className="
              w-full
              mt-1
              flex
              items-center
              justify-center
              gap-1.5
              text-xs
              font-semibold
              text-blue-600
              hover:text-blue-700
              dark:hover:text-blue-400
              hover:underline
              pt-1
            "
          >
            <HardDrive size={13} />
            <span>Gérer mon stockage</span>
          </button>
        </div>

        {/* -------------------------------------------------------
            PREMIUM
        -------------------------------------------------------- */}

        <div
          className="
            bg-gradient-to-br
            from-amber-500/10
            via-amber-500/5
            to-transparent
            border
            border-amber-500/20
            p-3.5
            rounded-2xl
            space-y-2.5
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              text-amber-600
              font-bold
              text-xs
            "
          >
            <Crown size={15} />
            <span>Passer à Premium</span>
          </div>

          <p
            className="
              text-[11px]
              text-slate-500
              dark:text-slate-400
              leading-relaxed
            "
          >
            Profitez de plus d'espace et d'outils pour vos travaux.
          </p>

          <button
            type="button"
            onClick={() => handleNavigate("/premium")}
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              text-white
              font-semibold
              py-2
              rounded-xl
              text-xs
              transition
              shadow-sm
            "
          >
            Découvrir les offres
          </button>
        </div>
      </div>
    </aside>
  );
}
