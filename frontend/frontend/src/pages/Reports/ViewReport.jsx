/**
 * ==========================================================
 * MACEVO
 * ==========================================================
 * Fichier : ViewReport.jsx
 * Description : Lecteur scientifique complet d'un rapport MACEVO.
 *
 * Responsabilités :
 * - charger le rapport par son ID réel ;
 * - afficher les métadonnées académiques ;
 * - afficher le document scientifique complet ;
 * - afficher les statistiques ;
 * - afficher les références disponibles dans la structure ;
 * - afficher les ressources associées ;
 * - ouvrir le véritable éditeur scientifique ;
 * - ouvrir l'interface de téléchargement ;
 * - rester entièrement en lecture seule.
 *
 * Version : 3.0.0
 * Statut : Intégration frontend/backend
 * ==========================================================
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Pencil,
  Download,
  FileText,
  BookOpen,
  FolderOpen,
  GraduationCap,
  Building2,
  User,
  Calendar,
  Layers,
  BarChart3,
  Clock3,
  Hash,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Table2,
  Sigma,
  RefreshCw,
  X,
  FileCode2,
  FileArchive,
  Loader2,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import reportService from "../../services/reportService";
import editorService from "../../services/editorService";

/* ==========================================================
   STATUTS
========================================================== */

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
    icon: Clock3,
  },

  completed: {
    label: "Terminé",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },

  archived: {
    label: "Archivé",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: FolderOpen,
  },
};

function getStatusConfig(status) {
  const normalized = String(
    status || "draft"
  )
    .trim()
    .toLowerCase();

  return (
    STATUS_CONFIG[normalized] || {
      label: status || "Brouillon",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      icon: FileText,
    }
  );
}

/* ==========================================================
   OUTILS
========================================================== */

function formatDate(
  value,
  withTime = false
) {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non renseignée";
  }

  return date.toLocaleString(
    "fr-FR",
    withTime
      ? {
          dateStyle: "medium",
          timeStyle: "short",
        }
      : {
          dateStyle: "medium",
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

function getReportLevel(report) {
  return (
    report?.academic_level ||
    "Non renseigné"
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isHtmlContent(content) {
  return /<(p|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|figure|img|blockquote|strong|em|u|div|section|span)\b/i.test(
    String(content || "")
  );
}

function textToHtml(content) {
  return String(content || "")
    .split(/\r?\n\r?\n/)
    .map(
      (paragraph) =>
        `<p>${escapeHtml(
          paragraph
        ).replace(
          /\r?\n/g,
          "<br />"
        )}</p>`
    )
    .join("");
}

function getContentHtml(
  report,
  structure
) {
  const structuredHtml =
    structure?.content_html;

  if (
    typeof structuredHtml === "string" &&
    structuredHtml.trim()
  ) {
    return structuredHtml;
  }

  const reportContent =
    report?.content || "";

  if (!reportContent.trim()) {
    return "";
  }

  if (
    isHtmlContent(reportContent)
  ) {
    return reportContent;
  }

  return textToHtml(
    reportContent
  );
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

/* ==========================================================
   COMPOSANT PRINCIPAL
========================================================== */

export default function ViewReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] =
    useState(null);

  const [bootstrap, setBootstrap] =
    useState(null);

  const [structure, setStructure] =
    useState(null);

  const [statistics, setStatistics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    downloadOpen,
    setDownloadOpen,
  ] = useState(false);

  const [
    downloadLoading,
    setDownloadLoading,
  ] = useState("");

  /* ========================================================
     CHARGEMENT
  ======================================================== */

  const loadReport =
    useCallback(
      async (silent = false) => {
        if (!id) {
          setError(
            "Identifiant du rapport manquant."
          );

          setLoading(false);

          return;
        }

        try {
          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          /* -----------------------------------------------
             RAPPORT CANONIQUE
          ------------------------------------------------ */

          const reportData =
            await reportService.getReportById(
              id
            );

          setReport(reportData);

          /* -----------------------------------------------
             BOOTSTRAP
          ------------------------------------------------ */

          try {
            const bootstrapData =
              await editorService.getBootstrap(
                id
              );

            setBootstrap(
              bootstrapData
            );
          } catch (bootstrapError) {
            console.warn(
              "MACEVO : bootstrap indisponible.",
              bootstrapError?.response
                ?.data ||
                bootstrapError
            );

            setBootstrap(null);
          }

          /* -----------------------------------------------
             STRUCTURE SCIENTIFIQUE
          ------------------------------------------------ */

          try {
            const structureData =
              await editorService.getStructure(
                id
              );

            setStructure(
              structureData
            );
          } catch (structureError) {
            console.warn(
              "MACEVO : structure scientifique indisponible.",
              structureError?.response
                ?.data ||
                structureError
            );

            setStructure(null);
          }

          /* -----------------------------------------------
             STATISTIQUES
          ------------------------------------------------ */

          try {
            const statisticsData =
              await editorService.getStatistics(
                id
              );

            setStatistics(
              statisticsData
            );
          } catch (statisticsError) {
            console.warn(
              "MACEVO : statistiques indisponibles.",
              statisticsError?.response
                ?.data ||
                statisticsError
            );

            setStatistics(null);
          }
        } catch (err) {
          console.error(
            "MACEVO : erreur de lecture du rapport.",
            err?.response?.data ||
              err
          );

          setReport(null);

          if (
            err?.response?.status ===
            404
          ) {
            setError(
              "Ce rapport n'existe pas ou n'est plus disponible."
            );
          } else if (
            err?.response?.status ===
            403
          ) {
            setError(
              "Vous n'êtes pas autorisé à consulter ce rapport."
            );
          } else {
            setError(
              "Impossible de charger ce rapport pour le moment."
            );
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [id]
    );

  useEffect(() => {
    loadReport(false);
  }, [loadReport]);

  /* ========================================================
     DONNÉES CALCULÉES
  ======================================================== */

  const statusConfig =
    useMemo(
      () =>
        getStatusConfig(
          report?.status
        ),
      [report?.status]
    );

  const StatusIcon =
    statusConfig.icon;

  const contentHtml =
    useMemo(
      () =>
        getContentHtml(
          report,
          structure
        ),
      [report, structure]
    );

  const assets =
    useMemo(
      () =>
        normalizeArray(
          bootstrap?.assets
        ),
      [bootstrap]
    );

  const figures =
    useMemo(
      () =>
        normalizeArray(
          structure?.figures
        ),
      [structure]
    );

  const images =
    useMemo(
      () =>
        normalizeArray(
          structure?.images
        ),
      [structure]
    );

  const tables =
    useMemo(
      () =>
        normalizeArray(
          structure?.tables
        ),
      [structure]
    );

  const math =
    useMemo(
      () =>
        normalizeArray(
          structure?.math
        ),
      [structure]
    );

  const lists =
    useMemo(
      () =>
        normalizeArray(
          structure?.lists
        ),
      [structure]
    );

  const headings =
    useMemo(
      () =>
        normalizeArray(
          structure?.headings
        ),
      [structure]
    );

  const references =
    useMemo(
      () =>
        normalizeArray(
          structure?.references
        ),
      [structure]
    );

  const words =
    statistics?.words ??
    statistics?.word_count ??
    structure?.statistics?.words ??
    structure?.statistics
      ?.word_count ??
    "—";

  const imagesCount =
    images.length ||
    assets.filter(
      (asset) =>
        asset.asset_type ===
        "image"
    ).length ||
    0;

  const figuresCount =
    figures.length ||
    assets.filter(
      (asset) =>
        asset.asset_type ===
        "figure"
    ).length ||
    0;

  const tablesCount =
    tables.length ||
    statistics?.tables ||
    0;

  const mathCount =
    math.length ||
    statistics?.math ||
    0;

  /* ========================================================
     TÉLÉCHARGEMENT
  ======================================================== */

  const handleDownload =
    async (format) => {
      if (!report?.id) {
        return;
      }

      try {
        setDownloadLoading(
          format
        );

        const extension =
          format === "pdf"
            ? "pdf"
            : format === "latex"
              ? "tex"
              : "zip";

        const safeTitle =
          String(
            report.title ||
              `rapport-${report.id}`
          )
            .trim()
            .replace(
              /[<>:"/\\|?*\x00-\x1F]/g,
              "-"
            )
            .replace(
              /\s+/g,
              "-"
            )
            .slice(0, 100);

        await editorService.exportAndDownload(
          report.id,
          format,
          `${safeTitle}.${extension}`
        );

        setDownloadOpen(false);
      } catch (err) {
        console.error(
          `MACEVO : erreur export ${format}.`,
          err?.response?.data ||
            err
        );

        setError(
          `Impossible de télécharger le rapport en ${format.toUpperCase()}.`
        );
      } finally {
        setDownloadLoading(
          ""
        );
      }
    };

  /* ========================================================
     CHARGEMENT
  ======================================================== */

  if (loading) {
    return (
      <PageShell>
        <main className="flex flex-1 items-center justify-center p-8">
          <LoadingState />
        </main>
      </PageShell>
    );
  }

  /* ========================================================
     ERREUR
  ======================================================== */

  if (error || !report) {
    return (
      <PageShell>
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/30">
              <AlertCircle size={32} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Rapport indisponible
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {error ||
                "Ce rapport n'est pas disponible."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/rapports"
                )
              }
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft size={16} />
              Retour aux rapports
            </button>
          </div>
        </main>
      </PageShell>
    );
  }

  /* ========================================================
     AFFICHAGE
  ======================================================== */

  return (
    <PageShell>
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 dark:bg-[#0d1117] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">

          {/* ==================================================
              BARRE ACTIONS
          ================================================== */}

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/rapports"
                )
              }
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={17} />
              Retour aux rapports
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/rapports/editeur/${report.id}`
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Pencil size={16} />
                Modifier
              </button>

              <button
                type="button"
                onClick={() =>
                  setDownloadOpen(true)
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download size={16} />
                Télécharger
              </button>

              <button
                type="button"
                onClick={() =>
                  loadReport(true)
                }
                disabled={
                  refreshing
                }
                title="Actualiser"
                aria-label="Actualiser le rapport"
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
            </div>
          </div>

          {/* ==================================================
              ERREUR SECONDAIRE
          ================================================== */}

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
              <AlertCircle size={17} />

              <span className="flex-1 text-xs">
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* ==================================================
              EN-TÊTE
          ================================================== */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
            <div className="border-b border-slate-200 p-6 dark:border-slate-800 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      <GraduationCap size={14} />
                      {getReportLevel(
                        report
                      )}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusConfig.className}`}
                    >
                      <StatusIcon
                        size={13}
                      />
                      {
                        statusConfig.label
                      }
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <FileText size={13} />
                      {getReportType(
                        report
                      )}
                    </span>
                  </div>

                  <h1 className="break-words text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    {report.title ||
                      "Document sans titre"}
                  </h1>

                  {report.summary && (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {report.summary}
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Hash size={14} />
                      Rapport #{report.id}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <Calendar size={14} />
                      Créé le{" "}
                      {formatDate(
                        report.created_at
                      )}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <Clock3 size={14} />
                      Modifié le{" "}
                      {formatDate(
                        report.updated_at
                      )}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50 lg:min-w-[220px]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Identifiant
                  </p>

                  <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                    #{report.id}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    ID réel du rapport
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-200 dark:divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              <MetadataItem
                icon={User}
                label="Auteur"
                value={
                  report.author
                }
              />

              <MetadataItem
                icon={Building2}
                label="Institution"
                value={
                  report.institution
                }
              />

              <MetadataItem
                icon={BookOpen}
                label="Domaine scientifique"
                value={
                  report.scientific_field
                }
              />

              <MetadataItem
                icon={Calendar}
                label="Année académique"
                value={
                  report.academic_year
                }
              />
            </div>
          </section>

          {/* ==================================================
              STATISTIQUES
          ================================================== */}

          <section className="mt-6">
            <SectionTitle
              icon={BarChart3}
              title="Analyse du document"
            />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Mots"
                value={words}
              />

              <StatCard
                label="Images"
                value={
                  imagesCount
                }
                icon={ImageIcon}
              />

              <StatCard
                label="Figures"
                value={
                  figuresCount
                }
                icon={Layers}
              />

              <StatCard
                label="Tableaux"
                value={
                  tablesCount
                }
                icon={Table2}
              />
            </div>

            {mathCount > 0 && (
              <div className="mt-3 max-w-sm">
                <StatCard
                  label="Équations"
                  value={
                    mathCount
                  }
                  icon={Sigma}
                />
              </div>
            )}
          </section>

          {/* ==================================================
              SOMMAIRE SCIENTIFIQUE
          ================================================== */}

          {headings.length >
            0 && (
            <section className="mt-8">
              <SectionTitle
                icon={BookOpen}
                title="Structure du document"
              />

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <div className="space-y-2">
                  {headings.map(
                    (
                      heading,
                      index
                    ) => (
                      <div
                        key={
                          heading.id ||
                          `${index}-${heading.text}`
                        }
                        className="flex items-start gap-3 rounded-xl px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        <span className="font-mono text-xs text-slate-400">
                          {index + 1}
                        </span>

                        <span
                          className={`font-medium ${
                            heading.level >
                            1
                              ? "pl-4 text-slate-600 dark:text-slate-300"
                              : "font-bold text-slate-800 dark:text-white"
                          }`}
                        >
                          {heading.text ||
                            heading.title ||
                            "Section sans titre"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ==================================================
              DOCUMENT COMPLET
          ================================================== */}

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText
                  size={18}
                  className="text-blue-600"
                />

                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  Document scientifique
                </h2>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Lecture seule
              </span>
            </div>

            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
              {contentHtml ? (
                <div
                  className="
                    macevo-report-reader
                    px-6 py-10
                    sm:px-10 sm:py-12
                    lg:px-16 lg:py-16
                    text-[15px]
                    leading-8
                    text-slate-700
                    dark:text-slate-200

                    [&_h1]:mb-6
                    [&_h1]:mt-10
                    [&_h1]:text-3xl
                    [&_h1]:font-extrabold
                    [&_h1]:leading-tight
                    [&_h1]:text-slate-900
                    dark:[&_h1]:text-white

                    [&_h2]:mb-4
                    [&_h2]:mt-9
                    [&_h2]:text-2xl
                    [&_h2]:font-bold
                    [&_h2]:text-slate-900
                    dark:[&_h2]:text-white

                    [&_h3]:mb-3
                    [&_h3]:mt-7
                    [&_h3]:text-xl
                    [&_h3]:font-bold
                    [&_h3]:text-slate-900
                    dark:[&_h3]:text-white

                    [&_h4]:mb-2
                    [&_h4]:mt-5
                    [&_h4]:text-lg
                    [&_h4]:font-semibold
                    [&_h4]:text-slate-900
                    dark:[&_h4]:text-white

                    [&_p]:mb-4

                    [&_ul]:my-4
                    [&_ul]:list-disc
                    [&_ul]:pl-7

                    [&_ol]:my-4
                    [&_ol]:list-decimal
                    [&_ol]:pl-7

                    [&_li]:mb-2

                    [&_strong]:font-bold
                    [&_em]:italic
                    [&_u]:underline

                    [&_blockquote]:my-6
                    [&_blockquote]:border-l-4
                    [&_blockquote]:border-blue-500
                    [&_blockquote]:pl-5
                    [&_blockquote]:italic
                    [&_blockquote]:text-slate-500

                    [&_table]:my-8
                    [&_table]:w-full
                    [&_table]:border-collapse

                    [&_th]:border
                    [&_th]:border-slate-300
                    [&_th]:bg-slate-50
                    [&_th]:px-4
                    [&_th]:py-3
                    [&_th]:text-left
                    [&_th]:font-bold

                    [&_td]:border
                    [&_td]:border-slate-300
                    [&_td]:px-4
                    [&_td]:py-3

                    [&_figure]:my-8
                    [&_figure]:text-center

                    [&_figure_img]:mx-auto
                    [&_figure_img]:max-h-[700px]
                    [&_figure_img]:max-w-full
                    [&_figure_img]:rounded-xl

                    [&_figcaption]:mt-3
                    [&_figcaption]:text-sm
                    [&_figcaption]:italic
                    [&_figcaption]:text-slate-500

                    [&_img]:mx-auto
                    [&_img]:max-h-[700px]
                    [&_img]:max-w-full
                    [&_img]:rounded-xl

                    [&_[data-latex]]:my-5
                    [&_[data-latex]]:block
                    [&_[data-latex]]:text-center
                  "
                  dangerouslySetInnerHTML={{
                    __html:
                      contentHtml,
                  }}
                />
              ) : (
                <EmptyContent />
              )}
            </article>
          </section>

          {/* ==================================================
              RÉFÉRENCES
          ================================================== */}

          <section className="mt-8">
            <SectionTitle
              icon={BookOpen}
              title="Références bibliographiques"
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#161b22] sm:p-8">
              {references.length >
              0 ? (
                <div className="space-y-4">
                  {references.map(
                    (
                      reference,
                      index
                    ) => (
                      <div
                        key={
                          reference.id ||
                          `${index}-${reference.title || "reference"}`
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
                      >
                        <div className="flex gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {reference.authors ||
                                reference.author ||
                                "Auteur non renseigné"}
                            </p>

                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                              {reference.title ||
                                "Titre non renseigné"}
                            </p>

                            {(reference.year ||
                              reference.source) && (
                              <p className="mt-1 text-xs text-slate-500">
                                {reference.year ||
                                  "s.d."}

                                {reference.source
                                  ? ` — ${reference.source}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptySection
                  icon={BookOpen}
                  title="Aucune référence disponible"
                  text="Les références apparaîtront ici lorsqu'elles seront présentes dans la structure scientifique du document."
                />
              )}
            </div>
          </section>

          {/* ==================================================
              RESSOURCES
          ================================================== */}

          <section className="mt-8">
            <SectionTitle
              icon={FolderOpen}
              title="Fichiers et ressources"
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#161b22] sm:p-8">
              {assets.length >
              0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {assets.map(
                    (asset) => (
                      <AssetCard
                        key={
                          asset.id
                        }
                        asset={
                          asset
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <EmptySection
                  icon={FolderOpen}
                  title="Aucune ressource associée"
                  text="Les images, figures et fichiers importés depuis l'éditeur apparaîtront ici."
                />
              )}
            </div>
          </section>

          {/* ==================================================
              INFORMATIONS ACADÉMIQUES
          ================================================== */}

          <section className="mb-10 mt-8">
            <SectionTitle
              icon={GraduationCap}
              title="Informations académiques"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoCard
                icon={
                  GraduationCap
                }
                label="Niveau académique"
                value={getReportLevel(
                  report
                )}
              />

              <InfoCard
                icon={BookOpen}
                label="Type de document"
                value={getReportType(
                  report
                )}
              />

              <InfoCard
                icon={Building2}
                label="Faculté / Département"
                value={
                  report.department
                }
              />

              <InfoCard
                icon={User}
                label="Directeur / Encadreur"
                value={
                  report.supervisor
                }
              />

              <InfoCard
                icon={Calendar}
                label="Année académique"
                value={
                  report.academic_year
                }
              />

              <InfoCard
                icon={Layers}
                label="Modèle"
                value={
                  bootstrap
                    ?.report
                    ?.template_details
                    ?.title ||
                  report.template_name ||
                  "Modèle personnalisé"
                }
              />
            </div>
          </section>
        </div>
      </main>

      {/* ======================================================
          TÉLÉCHARGEMENT
      ====================================================== */}

      {downloadOpen && (
        <DownloadModal
          report={report}
          loading={
            downloadLoading
          }
          onClose={() =>
            !downloadLoading &&
            setDownloadOpen(false)
          }
          onDownload={
            handleDownload
          }
        />
      )}
    </PageShell>
  );
}

/* ==========================================================
   PAGE SHELL
========================================================== */

function PageShell({
  children,
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 dark:bg-[#0d1117] dark:text-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />

        {children}
      </div>
    </div>
  );
}

/* ==========================================================
   CHARGEMENT
========================================================== */

function LoadingState() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
        <RefreshCw
          size={24}
          className="animate-spin text-blue-600"
        />
      </div>

      <p className="font-semibold text-slate-700 dark:text-slate-200">
        Chargement du rapport...
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Préparation du document scientifique
      </p>
    </div>
  );
}

/* ==========================================================
   MÉTADONNÉES
========================================================== */

function MetadataItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">
            {value ||
              "Non renseigné"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   STATISTIQUE
========================================================== */

function StatCard({
  label,
  value,
  icon: Icon = BarChart3,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   TITRE SECTION
========================================================== */

function SectionTitle({
  icon: Icon,
  title,
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon
        size={18}
        className="text-blue-600"
      />

      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        {title}
      </h2>
    </div>
  );
}

/* ==========================================================
   INFO CARD
========================================================== */

function InfoCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-200">
            {value ||
              "Non renseigné"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   ASSET CARD
========================================================== */

function AssetCard({
  asset,
}) {
  const fileUrl =
    asset?.file_url ||
    asset?.file ||
    null;

  const assetType =
    asset?.asset_type ||
    "";

  const isImage =
    assetType === "image" ||
    assetType === "figure" ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(
      String(fileUrl || "")
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      {isImage &&
        fileUrl && (
          <div className="flex h-48 items-center justify-center overflow-hidden bg-white dark:bg-slate-950">
            <img
              src={fileUrl}
              alt={
                asset.alt_text ||
                asset.title ||
                asset.caption ||
                "Ressource du rapport"
              }
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          {isImage ? (
            <ImageIcon
              size={18}
            />
          ) : (
            <FileText
              size={18}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold text-slate-800 dark:text-slate-200">
            {asset.title ||
              asset.caption ||
              "Ressource sans titre"}
          </p>

          {asset.description && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {
                asset.description
              }
            </p>
          )}

          {asset.caption && (
            <p className="mt-2 text-xs italic text-slate-400">
              {asset.caption}
            </p>
          )}

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Ouvrir la ressource
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   VIDE
========================================================== */

function EmptyContent() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-900">
        <FileText size={26} />
      </div>

      <h3 className="font-bold text-slate-700 dark:text-slate-200">
        Aucun contenu
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        Ce rapport ne contient actuellement aucun contenu scientifique enregistré.
      </p>
    </div>
  );
}

function EmptySection({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-900">
        <Icon size={22} />
      </div>

      <h3 className="font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </h3>

      <p className="mt-2 max-w-lg text-xs leading-5 text-slate-400">
        {text}
      </p>
    </div>
  );
}

/* ==========================================================
   DOWNLOAD MODAL
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

            <p className="mt-1 text-xs text-slate-500">
              {report.title ||
                `Rapport #${report.id}`}
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
                "pdf"
              )
            }
          />

          <DownloadOption
            icon={FileCode2}
            title="LaTeX"
            description="Code source scientifique du rapport."
            loading={
              loading === "latex"
            }
            onClick={() =>
              onDownload(
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
   DOWNLOAD OPTION
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

      <div>
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