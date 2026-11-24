/**
 * ==========================================================
 * MACEVO
 * ==========================================================
 * Fichier : Reports.jsx
 * Description : Gestion professionnelle des rapports MACEVO.
 *
 * Responsabilités :
 * - charger les rapports de l'utilisateur ;
 * - afficher le véritable ID de chaque rapport ;
 * - rechercher et filtrer ;
 * - consulter un rapport ;
 * - modifier un rapport dans le véritable éditeur scientifique ;
 * - télécharger PDF / LaTeX / ZIP ;
 * - confirmer puis supprimer un rapport ;
 * - gérer les vues liste / grille ;
 * - gérer la sélection et la pagination.
 *
 * Version : 3.0.0
 * Statut : Intégration frontend/backend
 * ==========================================================
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  Search,
  PlusCircle,
  LayoutGrid,
  List,
  Eye,
  Edit3,
  Download,
  CheckCircle,
  Clock,
  Archive,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  AlertCircle,
  X,
  Loader2,
  FileArchive,
  FileCode2,
  RefreshCw,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import reportService from "../../services/reportService";
import editorService from "../../services/editorService";

/* ==========================================================
   CONFIGURATION
========================================================== */

const REPORTS_PER_PAGE = 8;

const STATUS_CONFIG = {
  draft: {
    label: "Brouillon",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: FileText,
  },

  progress: {
    label: "En cours",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Clock,
  },

  completed: {
    label: "Terminé",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle,
  },

  archived: {
    label: "Archivé",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: Archive,
  },
};

const TYPE_OPTIONS = [
  {
    value: "",
    label: "Tous les types",
  },
  {
    value: "Mémoire",
    label: "Mémoire",
  },
  {
    value: "Rapport de stage",
    label: "Rapport de stage",
  },
  {
    value: "Analyse",
    label: "Analyse",
  },
  {
    value: "Article scientifique",
    label: "Article scientifique",
  },
];

/* ==========================================================
   OUTILS
========================================================== */

function normalizeStatus(status) {
  return String(status || "draft").trim().toLowerCase();
}

function getStatusConfig(status) {
  const normalized = normalizeStatus(status);

  return (
    STATUS_CONFIG[normalized] || {
      label: status || "Brouillon",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      icon: FileText,
    }
  );
}

function getReportType(report) {
  return (
    report?.report_type ||
    report?.type ||
    "Document académique"
  );
}

function formatDate(value) {
  if (!value) {
    return "Récemment";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Récemment";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getFileLabel(report) {
  const document = String(report?.document || "").toLowerCase();

  if (document.endsWith(".docx")) {
    return "DOCX";
  }

  if (document.endsWith(".tex")) {
    return "TEX";
  }

  if (document.endsWith(".pdf")) {
    return "PDF";
  }

  return "DOC";
}

function getReportId(report) {
  return report?.id ?? null;
}

/* ==========================================================
   COMPOSANT PRINCIPAL
========================================================== */

export default function Reports() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* ========================================================
     ÉTATS
  ======================================================== */

  const [reports, setReports] = useState([]);

  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [selectedReports, setSelectedReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [viewMode, setViewMode] = useState("list");

  const [downloadReport, setDownloadReport] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ========================================================
     CHARGEMENT
  ======================================================== */

  const loadReports = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await reportService.getReports();

      const normalized = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setReports(normalized);

      setSelectedReports((current) =>
        current.filter((id) =>
          normalized.some((report) => report.id === id)
        )
      );
    } catch (err) {
      console.error(
        "MACEVO : erreur lors du chargement des rapports.",
        err?.response?.data || err
      );

      setError(
        "Impossible de charger les rapports pour le moment."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  /* ========================================================
     FILTRAGE
  ======================================================== */

  const filteredReports = useMemo(() => {
    let result = [...reports];

    const globalQuery = (
      search.trim() || tableSearch.trim()
    ).toLowerCase();

    if (globalQuery) {
      result = result.filter((report) => {
        const title = String(
          report?.title || ""
        ).toLowerCase();

        const summary = String(
          report?.summary || ""
        ).toLowerCase();

        const type = String(
          getReportType(report)
        ).toLowerCase();

        const id = String(
          report?.id || ""
        ).toLowerCase();

        return (
          title.includes(globalQuery) ||
          summary.includes(globalQuery) ||
          type.includes(globalQuery) ||
          id.includes(globalQuery)
        );
      });
    }

    if (statusFilter) {
      result = result.filter(
        (report) =>
          normalizeStatus(report?.status) ===
          statusFilter
      );
    }

    if (typeFilter) {
      result = result.filter(
        (report) =>
          getReportType(report) === typeFilter
      );
    }

    return result;
  }, [
    reports,
    search,
    tableSearch,
    statusFilter,
    typeFilter,
  ]);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const totalPages =
    Math.ceil(
      filteredReports.length / REPORTS_PER_PAGE
    ) || 1;

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const indexOfLastReport =
    safeCurrentPage * REPORTS_PER_PAGE;

  const indexOfFirstReport =
    indexOfLastReport - REPORTS_PER_PAGE;

  const currentReports =
    filteredReports.slice(
      indexOfFirstReport,
      indexOfLastReport
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    tableSearch,
    statusFilter,
    typeFilter,
  ]);

  /* ========================================================
     SÉLECTION
  ======================================================== */

  const allCurrentSelected =
    currentReports.length > 0 &&
    currentReports.every((report) =>
      selectedReports.includes(report.id)
    );

  const toggleSelectAll = () => {
    const currentIds = currentReports
      .map((report) => report.id)
      .filter(Boolean);

    if (allCurrentSelected) {
      setSelectedReports((current) =>
        current.filter(
          (id) => !currentIds.includes(id)
        )
      );

      return;
    }

    setSelectedReports((current) => [
      ...new Set([
        ...current,
        ...currentIds,
      ]),
    ]);
  };

  const toggleSelectReport = (id) => {
    if (!id) {
      return;
    }

    setSelectedReports((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  /* ========================================================
     NAVIGATION
  ======================================================== */

  const openReport = (id) => {
    if (!id) {
      return;
    }

    navigate(`/rapports/${id}`);
  };

  const editReport = (id) => {
    if (!id) {
      return;
    }

    navigate(`/rapports/editeur/${id}`);
  };

  /* ========================================================
     TÉLÉCHARGEMENT
  ======================================================== */

  const handleDownload = async (
    report,
    format
  ) => {
    const id = getReportId(report);

    if (!id) {
      return;
    }

    try {
      setDownloadLoading(format);

      const extension =
        format === "pdf"
          ? "pdf"
          : format === "latex"
            ? "tex"
            : "zip";

      const safeTitle =
        String(
          report?.title ||
            `rapport-${id}`
        )
          .trim()
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
          .replace(/\s+/g, "-")
          .slice(0, 100) ||
        `rapport-${id}`;

      const filename =
        `${safeTitle}.${extension}`;

      await editorService.exportAndDownload(
        id,
        format,
        filename
      );

      setDownloadReport(null);
    } catch (err) {
      console.error(
        `MACEVO : erreur téléchargement ${format}.`,
        err?.response?.data || err
      );

      setError(
        `Impossible de télécharger le rapport en ${format.toUpperCase()}.`
      );
    } finally {
      setDownloadLoading("");
    }
  };

  /* ========================================================
     SUPPRESSION
  ======================================================== */

  const handleDelete = async () => {
    const id = deleteTarget?.id;

    if (!id) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError("");

      await reportService.deleteReport(id);

      setReports((current) =>
        current.filter(
          (report) => report.id !== id
        )
      );

      setSelectedReports((current) =>
        current.filter(
          (selectedId) =>
            selectedId !== id
        )
      );

      setDeleteTarget(null);

      if (
        currentReports.length === 1 &&
        safeCurrentPage > 1
      ) {
        setCurrentPage(
          safeCurrentPage - 1
        );
      }
    } catch (err) {
      console.error(
        "MACEVO : erreur lors de la suppression.",
        err?.response?.data || err
      );

      setError(
        "Impossible de supprimer ce rapport."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ========================================================
     PAGINATION
  ======================================================== */

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === safeCurrentPage
    ) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ========================================================
     RENDU
  ======================================================== */

  return (
    <div className="macevo-premium-canvas flex h-screen overflow-hidden font-sans text-slate-800 dark:text-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          search={search}
          setSearch={setSearch}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">

            {/* ==================================================
                EN-TÊTE
            ================================================== */}

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t(
                    "reports.title",
                    "Mes rapports"
                  )}
                </h1>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Gérez, consultez et organisez
                  tous vos rapports scientifiques.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    loadReports(true)
                  }
                  disabled={refreshing}
                  title="Actualiser"
                  aria-label="Actualiser les rapports"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw
                    size={16}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/rapports/nouveau")
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <PlusCircle size={16} />
                  Nouveau rapport
                </button>
              </div>
            </div>

            {/* ==================================================
                ERREUR
            ================================================== */}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Une opération n'a pas pu être effectuée.
                  </p>

                  <p className="mt-1 text-xs">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Fermer"
                  className="rounded-lg p-1 transition hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* ==================================================
                RECHERCHE / FILTRES
            ================================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div className="relative w-full lg:max-w-md">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={tableSearch}
                    onChange={(event) =>
                      setTableSearch(
                        event.target.value
                      )
                    }
                    placeholder="Rechercher un rapport, un type ou un ID..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <option value="">
                      Tous les statuts
                    </option>

                    <option value="draft">
                      Brouillon
                    </option>

                    <option value="progress">
                      En cours
                    </option>

                    <option value="completed">
                      Terminé
                    </option>

                    <option value="archived">
                      Archivé
                    </option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {TYPE_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>

                  <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        setViewMode("list")
                      }
                      title="Vue liste"
                      aria-label="Vue liste"
                      className={`flex h-10 w-10 items-center justify-center transition ${
                        viewMode === "list"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                          : "bg-white text-slate-400 hover:bg-slate-50 dark:bg-[#161b22] dark:hover:bg-slate-800"
                      }`}
                    >
                      <List size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setViewMode("grid")
                      }
                      title="Vue grille"
                      aria-label="Vue grille"
                      className={`flex h-10 w-10 items-center justify-center border-l border-slate-200 transition dark:border-slate-800 ${
                        viewMode === "grid"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                          : "bg-white text-slate-400 hover:bg-slate-50 dark:bg-[#161b22] dark:hover:bg-slate-800"
                      }`}
                    >
                      <LayoutGrid size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {(search ||
                tableSearch ||
                statusFilter ||
                typeFilter) && (
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">
                    {filteredReports.length} rapport
                    {filteredReports.length !== 1
                      ? "s"
                      : ""}{" "}
                    correspondant
                    {filteredReports.length !== 1
                      ? "s"
                      : ""}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setTableSearch("");
                      setStatusFilter("");
                      setTypeFilter("");
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </section>

            {/* ==================================================
                CHARGEMENT
            ================================================== */}

            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <div className="text-center">
                  <Loader2
                    size={32}
                    className="mx-auto mb-4 animate-spin text-blue-600"
                  />

                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Chargement des rapports...
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Récupération de vos documents scientifiques
                  </p>
                </div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-900">
                  <FileText size={26} />
                </div>

                <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                  Aucun rapport trouvé
                </h2>

                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {search || tableSearch
                    ? "Aucun rapport ne correspond à votre recherche."
                    : "Vous n'avez encore aucun rapport. Créez votre premier document scientifique."}
                </p>

                {!search &&
                  !tableSearch && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/rapports/nouveau"
                        )
                      }
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      <PlusCircle size={15} />
                      Créer un rapport
                    </button>
                  )}
              </div>
            ) : viewMode === "list" ? (
              /* ==================================================
                 VUE LISTE
              ================================================== */

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                        <th className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={
                              allCurrentSelected
                            }
                            onChange={
                              toggleSelectAll
                            }
                            aria-label="Sélectionner tous les rapports de cette page"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>

                        <th className="px-4 py-3">
                          Rapport
                        </th>

                        <th className="px-4 py-3">
                          ID
                        </th>

                        <th className="px-4 py-3">
                          Type
                        </th>

                        <th className="px-4 py-3">
                          Statut
                        </th>

                        <th className="px-4 py-3">
                          Modification
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800/70">
                      {currentReports.map(
                        (report) => {
                          const statusConfig =
                            getStatusConfig(
                              report.status
                            );

                          const StatusIcon =
                            statusConfig.icon;

                          const id =
                            getReportId(
                              report
                            );

                          return (
                            <tr
                              key={id}
                              className="transition hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
                            >
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedReports.includes(
                                    id
                                  )}
                                  onChange={() =>
                                    toggleSelectReport(
                                      id
                                    )
                                  }
                                  aria-label={`Sélectionner ${report.title || `rapport ${id}`}`}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex min-w-[230px] items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[9px] font-extrabold text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                                    {getFileLabel(
                                      report
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-slate-800 dark:text-white">
                                      {report.title ||
                                        "Document sans titre"}
                                    </p>

                                    {report.summary && (
                                      <p className="mt-1 max-w-[280px] truncate text-[10px] text-slate-400">
                                        {
                                          report.summary
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  #{id}
                                </span>
                              </td>

                              <td className="px-4 py-4 font-medium text-slate-500 dark:text-slate-400">
                                {getReportType(
                                  report
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusConfig.className}`}
                                >
                                  <StatusIcon
                                    size={11}
                                  />
                                  {
                                    statusConfig.label
                                  }
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-4 py-4">
                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                  {formatDate(
                                    report.updated_at
                                  )}
                                </p>

                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  Créé le{" "}
                                  {formatDate(
                                    report.created_at
                                  )}
                                </p>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center justify-end gap-1">
                                  <ActionButton
                                    label="Voir"
                                    onClick={() =>
                                      openReport(
                                        id
                                      )
                                    }
                                  >
                                    <Eye
                                      size={15}
                                    />
                                  </ActionButton>

                                  <ActionButton
                                    label="Modifier"
                                    onClick={() =>
                                      editReport(
                                        id
                                      )
                                    }
                                  >
                                    <Edit3
                                      size={15}
                                    />
                                  </ActionButton>

                                  <ActionButton
                                    label="Télécharger"
                                    onClick={() =>
                                      setDownloadReport(
                                        report
                                      )
                                    }
                                  >
                                    <Download
                                      size={15}
                                    />
                                  </ActionButton>

                                  <ActionButton
                                    label="Supprimer"
                                    danger
                                    onClick={() =>
                                      setDeleteTarget(
                                        report
                                      )
                                    }
                                  >
                                    <Trash2
                                      size={15}
                                    />
                                  </ActionButton>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={
                    safeCurrentPage
                  }
                  totalPages={totalPages}
                  firstIndex={
                    indexOfFirstReport
                  }
                  lastIndex={
                    indexOfLastReport
                  }
                  total={
                    filteredReports.length
                  }
                  onPageChange={
                    handlePageChange
                  }
                />
              </div>
            ) : (
              /* ==================================================
                 VUE GRILLE
              ================================================== */

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {currentReports.map(
                    (report) => {
                      const statusConfig =
                        getStatusConfig(
                          report.status
                        );

                      const StatusIcon =
                        statusConfig.icon;

                      const id =
                        getReportId(
                          report
                        );

                      return (
                        <article
                          key={id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-[#161b22]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[10px] font-extrabold text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                              {getFileLabel(
                                report
                              )}
                            </div>

                            <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              #{id}
                            </span>
                          </div>

                          <h2 className="mt-5 line-clamp-2 text-base font-bold text-slate-900 dark:text-white">
                            {report.title ||
                              "Document sans titre"}
                          </h2>

                          <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {report.summary ||
                              "Aucun résumé disponible."}
                          </p>

                          <div className="mt-5 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {getReportType(
                                report
                              )}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusConfig.className}`}
                            >
                              <StatusIcon
                                size={11}
                              />
                              {
                                statusConfig.label
                              }
                            </span>
                          </div>

                          <div className="mt-5 border-t border-slate-100 pt-4 text-[10px] text-slate-400 dark:border-slate-800">
                            Dernière modification :{" "}
                            {formatDate(
                              report.updated_at
                            )}
                          </div>

                          <div className="mt-4 grid grid-cols-4 gap-1.5">
                            <GridAction
                              label="Voir"
                              onClick={() =>
                                openReport(
                                  id
                                )
                              }
                            >
                              <Eye size={14} />
                            </GridAction>

                            <GridAction
                              label="Modifier"
                              onClick={() =>
                                editReport(
                                  id
                                )
                              }
                            >
                              <Edit3 size={14} />
                            </GridAction>

                            <GridAction
                              label="Télécharger"
                              onClick={() =>
                                setDownloadReport(
                                  report
                                )
                              }
                            >
                              <Download
                                size={14}
                              />
                            </GridAction>

                            <GridAction
                              label="Supprimer"
                              danger
                              onClick={() =>
                                setDeleteTarget(
                                  report
                                )
                              }
                            >
                              <Trash2 size={14} />
                            </GridAction>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                  <Pagination
                    currentPage={
                      safeCurrentPage
                    }
                    totalPages={
                      totalPages
                    }
                    firstIndex={
                      indexOfFirstReport
                    }
                    lastIndex={
                      indexOfLastReport
                    }
                    total={
                      filteredReports.length
                    }
                    onPageChange={
                      handlePageChange
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ======================================================
          MODALE TÉLÉCHARGEMENT
      ====================================================== */}

      {downloadReport && (
        <DownloadModal
          report={downloadReport}
          loading={downloadLoading}
          onClose={() =>
            !downloadLoading &&
            setDownloadReport(null)
          }
          onDownload={
            handleDownload
          }
        />
      )}

      {/* ======================================================
          MODALE SUPPRESSION
      ====================================================== */}

      {deleteTarget && (
        <DeleteModal
          report={deleteTarget}
          loading={deleteLoading}
          onClose={() =>
            !deleteLoading &&
            setDeleteTarget(null)
          }
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

/* ==========================================================
   BOUTON ACTION
========================================================== */

function ActionButton({
  children,
  label,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-2 transition ${
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

/* ==========================================================
   ACTION GRILLE
========================================================== */

function GridAction({
  children,
  label,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-9 items-center justify-center rounded-lg transition ${
        danger
          ? "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40"
          : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-900 dark:hover:bg-blue-950/30"
      }`}
    >
      {children}
    </button>
  );
}

/* ==========================================================
   PAGINATION
========================================================== */

function Pagination({
  currentPage,
  totalPages,
  firstIndex,
  lastIndex,
  total,
  onPageChange,
}) {
  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800 sm:flex-row">
      <p>
        Affichage de{" "}
        <strong className="text-slate-700 dark:text-slate-200">
          {firstIndex + 1}
        </strong>{" "}
        à{" "}
        <strong className="text-slate-700 dark:text-slate-200">
          {Math.min(
            lastIndex,
            total
          )}
        </strong>{" "}
        sur{" "}
        <strong className="text-slate-700 dark:text-slate-200">
          {total}
        </strong>{" "}
        rapport
        {total !== 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() =>
            onPageChange(
              currentPage - 1
            )
          }
          aria-label="Page précédente"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={14} />
        </button>

        {Array.from(
          { length: totalPages },
          (_, index) => index + 1
        ).map((page) => (
          <button
            type="button"
            key={page}
            onClick={() =>
              onPageChange(page)
            }
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold transition ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={
            currentPage === totalPages
          }
          onClick={() =>
            onPageChange(
              currentPage + 1
            )
          }
          aria-label="Page suivante"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ==========================================================
   MODALE TÉLÉCHARGEMENT
========================================================== */

function DownloadModal({
  report,
  loading,
  onClose,
  onDownload,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#161b22]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Télécharger le rapport
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {report?.title ||
                `Rapport #${report?.id}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(
              loading
            )}
            aria-label="Fermer"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <DownloadOption
            icon={FileText}
            title="PDF"
            description="Version finale prête à lire ou imprimer."
            loading={
              loading === "pdf"
            }
            onClick={() =>
              onDownload(
                report,
                "pdf"
              )
            }
          />

          <DownloadOption
            icon={FileCode2}
            title="LaTeX"
            description="Code source scientifique .tex du rapport."
            loading={
              loading === "latex"
            }
            onClick={() =>
              onDownload(
                report,
                "latex"
              )
            }
          />

          <DownloadOption
            icon={FileArchive}
            title="ZIP"
            description="Projet complet avec sources et ressources."
            loading={
              loading === "zip"
            }
            onClick={() =>
              onDownload(
                report,
                "zip"
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   OPTION DOWNLOAD
========================================================== */

function DownloadOption({
  icon: Icon,
  title,
  description,
  loading,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
        {loading ? (
          <Loader2
            size={20}
            className="animate-spin"
          />
        ) : (
          <Icon size={20} />
        )}
      </div>

      <div className="min-w-0">
        <p className="font-bold text-slate-800 dark:text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </button>
  );
}

/* ==========================================================
   MODALE SUPPRESSION
========================================================== */

function DeleteModal({
  report,
  loading,
  onClose,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#161b22]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/30">
          <Trash2 size={25} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
          Supprimer ce rapport ?
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Vous êtes sur le point de supprimer :
        </p>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="font-bold text-slate-800 dark:text-white">
            {report?.title ||
              "Document sans titre"}
          </p>

          <p className="mt-1 font-mono text-xs text-slate-400">
            ID #{report?.id}
          </p>
        </div>

        <p className="mt-4 text-xs leading-5 text-red-500">
          Cette opération supprimera le rapport de votre espace.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}

            {loading
              ? "Suppression..."
              : "Supprimer définitivement"}
          </button>
        </div>
      </div>
    </div>
  );
}
