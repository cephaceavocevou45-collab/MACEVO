/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : Assistant.jsx
 * Version : 4.0.0
 * Statut  : Assistant IA - interface frontend stabilisée
 * ==========================================================
 */

import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import ChatWindow from "../../components/Assistant/ChatWindow";
import ConversationList from "../../components/Assistant/ConversationList";

import assistantService from "../../services/assistantService";
import { exportAssistantConversation } from "../../services/assistantExport";

import {
  Search,
  Bell,
  ChevronDown,
  Edit3,
  CheckCircle,
  FileText,
  Wand2,
  Languages,
  Quote,
  Plus,
  MessageSquare,
  RefreshCw,
  Download,
} from "lucide-react";

/* ==========================================================
   OUTILS D'ASSISTANCE
========================================================== */

const ASSISTANT_TOOLS = [
  {
    id: "write",
    icon: Edit3,
    title: "Rédiger",
    description:
      "Générer du contenu à partir d'une idée ou d'un sujet.",
    prompt:
      "Aide-moi à rédiger un contenu scientifique à partir de mon idée.",
  },
  {
    id: "correct",
    icon: CheckCircle,
    title: "Corriger le texte",
    description:
      "Corriger l'orthographe, la grammaire et la ponctuation.",
    prompt:
      "Corrige le texte que je vais fournir en conservant son sens et son niveau scientifique.",
  },
  {
    id: "summarize",
    icon: FileText,
    title: "Résumer",
    description:
      "Obtenir un résumé clair et concis d'un texte long.",
    prompt:
      "Résume le texte que je vais fournir en conservant les informations scientifiques essentielles.",
  },
  {
    id: "improve",
    icon: Wand2,
    title: "Améliorer le style",
    description:
      "Améliorer la clarté, le ton et la qualité du texte.",
    prompt:
      "Améliore le style du texte que je vais fournir afin de le rendre plus clair, précis et scientifique.",
  },
  {
    id: "translate",
    icon: Languages,
    title: "Traduire",
    description:
      "Traduire le texte dans une autre langue.",
    prompt:
      "Traduis le texte que je vais fournir dans la langue que je préciserai.",
  },
  {
    id: "citation",
    icon: Quote,
    title: "Citer des sources",
    description:
      "Aider à structurer et intégrer les références scientifiques.",
    prompt:
      "Aide-moi à identifier le type de références scientifiques nécessaires pour soutenir mon texte.",
  },
];

/* ==========================================================
   COMPOSANT
========================================================== */

export default function Assistant() {
  const location = useLocation();
  const activeProjectId =
    location.state?.projectId ||
    new URLSearchParams(location.search).get("project_id");

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] =
    useState(false);

  const [creatingConversation, setCreatingConversation] =
    useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportConversation = async (format) => {
    if (!selectedConversation || exporting) return;

    setExporting(true);
    setExportMenuOpen(false);
    try {
      await exportAssistantConversation(selectedConversation, format);
    } catch (error) {
      setErrorMessage(error?.message || "L’export de la conversation a échoué.");
    } finally {
      setExporting(false);
    }
  };

  /* ========================================================
     CHARGER UNE CONVERSATION
  ======================================================== */

  const loadConversation = useCallback(
    async (id) => {
      if (!id) {
        return;
      }

      try {
        setLoadingConversation(true);
        setErrorMessage("");

        const conversation =
          await assistantService.getConversation(id);

        if (conversation) {
          setSelectedConversation(conversation);
        }
      } catch (error) {
        console.error(
          "Erreur chargement conversation :",
          error
        );

        setErrorMessage(
          error?.message || "Impossible de charger cette conversation."
        );
      } finally {
        setLoadingConversation(false);
      }
    },
    []
  );

  /* ========================================================
     PREMIER CHARGEMENT
  ======================================================== */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);

        const data =
          await assistantService.getConversations();

        if (!mounted) {
          return;
        }

        const normalized =
          Array.isArray(data) ? data : [];

        setConversations(normalized);

        if (
          !selectedConversation &&
          normalized.length > 0
        ) {
          const first =
            await assistantService.getConversation(
              normalized[0].id
            );

          if (mounted && first) {
            setSelectedConversation(first);
          }
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "Erreur initialisation Assistant :",
          error
        );

        setErrorMessage(
          "Impossible de charger MACEVO IA."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };

    // L'initialisation doit être exécutée une seule fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========================================================
     NOUVELLE CONVERSATION
  ======================================================== */

  const createConversation = async () => {
    if (creatingConversation) {
      return;
    }

    try {
      setCreatingConversation(true);
      setErrorMessage("");

      const conversation =
        await assistantService.createConversation(
          "Nouvelle conversation",
          activeProjectId
        );

      if (!conversation?.id) {
        throw new Error(
          "La conversation créée ne possède pas d'identifiant."
        );
      }

      /*
       * On sélectionne immédiatement la conversation créée.
       */
      setSelectedConversation(conversation);

      /*
       * Puis on actualise la liste sans perdre
       * la conversation nouvellement créée.
       */
      const data =
        await assistantService.getConversations();

      setConversations(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Erreur création conversation :",
        error
      );

      setErrorMessage(
        error?.message || "Impossible de créer une nouvelle conversation."
      );
    } finally {
      setCreatingConversation(false);
    }
  };

  /* ========================================================
     RAFRAÎCHIR UNE CONVERSATION
  ======================================================== */

  const refreshConversation = async (id) => {
    if (!id) {
      return;
    }

    try {
      setErrorMessage("");

      /*
       * Actualisation de la conversation actuellement ouverte.
       */
      const conversation =
        await assistantService.getConversation(id);

      if (conversation) {
        setSelectedConversation(conversation);
      }

      /*
       * Actualisation de la liste.
       */
      const data =
        await assistantService.getConversations();

      setConversations(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Erreur actualisation conversation :",
        error
      );
    }
  };

  /* ========================================================
     OUTIL D'ASSISTANCE
  ======================================================== */

  const handleToolClick = (tool) => {
    /*
     * Les outils ne disposent pas encore d'un endpoint
     * frontend dédié dans l'API actuelle.
     *
     * On prépare néanmoins leur intention sous forme
     * de commande structurée afin que ChatWindow puisse
     * l'utiliser proprement lorsque le mécanisme de
     * commandes rapides sera branché.
     */

    if (!tool) {
      return;
    }

    /*
     * Pour l'instant, on ne simule PAS l'envoi.
     * Cela évite de créer artificiellement une requête
     * backend qui n'existe pas.
     */
    console.info(
      "Outil MACEVO sélectionné :",
      tool.id,
      tool.prompt
    );
  };

  /* ========================================================
     RECHERCHE LOCALE
  ======================================================== */

  const filteredConversations =
    conversations.filter((conversation) => {
      if (!searchQuery.trim()) {
        return true;
      }

      const query =
        searchQuery.trim().toLowerCase();

      const title =
        typeof conversation?.title === "string"
          ? conversation.title.toLowerCase()
          : "";

      return title.includes(query);
    });

  /* ========================================================
     INTERFACE
  ======================================================== */

  return (
    <div
      className="
        flex
        h-screen
        overflow-hidden
        bg-slate-50
        dark:bg-[#0b0f17]
        text-slate-900
        dark:text-slate-100
        transition-colors
        duration-200
        font-sans
      "
    >
      {/* ====================================================
          SIDEBAR PRINCIPALE
      ==================================================== */}

      <Sidebar />

      {/* ====================================================
          CONTENU
      ==================================================== */}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ==================================================
            NAVBAR
        ================================================== */}

        <header
          className="
            h-16
            shrink-0
            border-b
            border-slate-200
            dark:border-slate-800
            bg-white
            dark:bg-[#161b22]
            px-6
            flex
            items-center
            justify-between
          "
        >
          {/* Recherche */}

          <div className="relative w-96 max-w-[45vw]">
            <Search
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
              size={16}
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Rechercher une conversation..."
              aria-label="Rechercher une conversation"
              className="
                w-full
                pl-9
                pr-16
                py-2
                bg-slate-100
                dark:bg-slate-800/60
                rounded-xl
                text-xs
                text-slate-700
                dark:text-slate-200
                placeholder:text-slate-400
                outline-none
                focus:ring-2
                focus:ring-blue-500/20
                transition
              "
            />

            <span
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-[10px]
                bg-slate-200
                dark:bg-slate-700
                text-slate-500
                dark:text-slate-300
                px-1.5
                py-0.5
                rounded
                font-medium
              "
            >
              Ctrl + K
            </span>
          </div>

          {/* Zone utilisateur */}

          <div className="flex items-center gap-4">

            <div className="relative">
              <button
                type="button"
                disabled={!selectedConversation || exporting}
                onClick={() => setExportMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                aria-haspopup="menu"
                aria-expanded={exportMenuOpen}
                title="Exporter la conversation ouverte"
              >
                <Download size={15} />
                <span className="hidden sm:inline">{exporting ? "Export…" : "Exporter"}</span>
                <ChevronDown size={13} />
              </button>

              {exportMenuOpen && (
                <div
                  role="menu"
                  aria-label="Formats d’export"
                  className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  {[
                    ["pdf", "PDF — impression"],
                    ["docx", "Word (.docx)"],
                    ["tex", "LaTeX (.tex)"],
                    ["md", "Markdown (.md)"],
                    ["txt", "Texte (.txt)"],
                  ].map(([format, label]) => (
                    <button
                      key={format}
                      type="button"
                      role="menuitem"
                      onClick={() => void handleExportConversation(format)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="
                relative
                p-2
                rounded-lg
                text-slate-500
                dark:text-slate-400
                hover:text-slate-700
                dark:hover:text-slate-200
                hover:bg-slate-100
                dark:hover:bg-slate-800
                transition
              "
              title="Notifications"
              aria-label="Notifications"
              onClick={() => {
                console.info(
                  "Notifications MACEVO"
                );
              }}
            >
              <Bell size={18} />

              <span
                className="
                  absolute
                  top-1
                  right-1
                  min-w-4
                  h-4
                  px-1
                  bg-red-500
                  text-white
                  text-[9px]
                  font-bold
                  rounded-full
                  flex
                  items-center
                  justify-center
                "
              >
                3
              </span>
            </button>

            <button
              type="button"
              className="
                flex
                items-center
                gap-2.5
                pl-3
                border-l
                border-slate-200
                dark:border-slate-800
                hover:opacity-80
                transition
              "
              title="Profil utilisateur"
              aria-label="Profil utilisateur"
            >
              <div
                className="
                  w-8
                  h-8
                  rounded-full
                  bg-blue-600
                  text-white
                  flex
                  items-center
                  justify-center
                  text-xs
                  font-bold
                  shrink-0
                "
              >
                MA
              </div>

              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-tight">
                  MACEVO
                </p>

                <p className="text-[10px] text-slate-400">
                  Assistant scientifique
                </p>
              </div>

              <ChevronDown
                size={14}
                className="text-slate-400"
              />
            </button>
          </div>
        </header>

        {/* ==================================================
            CORPS
        ================================================== */}

        <div className="flex flex-1 overflow-hidden">

          {/* =================================================
              CHAT
          ================================================= */}

          <main className="flex flex-1 min-w-0 overflow-hidden">

            {loading ? (
              <div
                className="
                  flex
                  flex-1
                  items-center
                  justify-center
                  bg-white
                  dark:bg-[#0d1117]
                "
              >
                <div className="text-center">

                  <div
                    className="
                      w-8
                      h-8
                      mx-auto
                      mb-3
                      border-2
                      border-slate-300
                      dark:border-slate-700
                      border-t-blue-600
                      rounded-full
                      animate-spin
                    "
                  />

                  <p className="text-xs text-slate-400">
                    Chargement de MACEVO IA...
                  </p>
                </div>
              </div>
            ) : selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                loading={
                  loadingConversation
                }
                onConversationUpdated={
                  refreshConversation
                }
              />
            ) : (
              <div
                className="
                  flex
                  flex-1
                  items-center
                  justify-center
                  bg-white
                  dark:bg-[#0d1117]
                  px-6
                "
              >
                <div className="text-center max-w-md">

                  <div
                    className="
                      w-14
                      h-14
                      mx-auto
                      mb-4
                      rounded-2xl
                      bg-blue-500/10
                      text-blue-600
                      dark:text-blue-400
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <MessageSquare size={26} />
                  </div>

                  <h2
                    className="
                      text-base
                      font-semibold
                      text-slate-800
                      dark:text-slate-100
                    "
                  >
                    MACEVO IA
                  </h2>

                  <p
                    className="
                      mt-2
                      text-xs
                      leading-relaxed
                      text-slate-400
                    "
                  >
                    Votre assistant scientifique pour
                    rédiger, analyser, corriger et
                    structurer vos documents.
                  </p>

                  <button
                    type="button"
                    onClick={createConversation}
                    disabled={creatingConversation}
                    className="
                      mt-5
                      inline-flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      bg-blue-600
                      hover:bg-blue-500
                      text-white
                      text-xs
                      font-semibold
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      transition
                    "
                  >
                    {creatingConversation ? (
                      <RefreshCw
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Plus size={14} />
                    )}

                    Nouvelle conversation
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* =================================================
              PANNEAU DROIT
          ================================================= */}

          <aside
            className="
              w-80
              shrink-0
              hidden
              xl:flex
              flex-col
              justify-between
              gap-6
              p-5
              overflow-y-auto
              bg-white
              dark:bg-[#161b22]
              border-l
              border-slate-200
              dark:border-slate-800
            "
          >

            {/* =================================================
                OUTILS
            ================================================= */}

            <section className="space-y-3">

              <h3
                className="
                  text-xs
                  font-bold
                  text-slate-900
                  dark:text-white
                  uppercase
                  tracking-wider
                "
              >
                Outils d'assistance
              </h3>

              <div className="space-y-2">

                {ASSISTANT_TOOLS.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() =>
                        handleToolClick(tool)
                      }
                      disabled={
                        !selectedConversation ||
                        loadingConversation
                      }
                      className="
                        w-full
                        text-left
                        p-2.5
                        rounded-xl
                        border
                        border-slate-200/80
                        dark:border-slate-800
                        hover:border-blue-500/40
                        hover:bg-blue-50/30
                        dark:hover:bg-slate-800/50
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        transition
                        flex
                        items-start
                        gap-2.5
                        group
                      "
                    >
                      <div
                        className="
                          p-1.5
                          rounded-lg
                          bg-slate-100
                          dark:bg-slate-800
                          text-blue-600
                          group-hover:bg-blue-600
                          group-hover:text-white
                          transition
                          shrink-0
                        "
                      >
                        <Icon size={14} />
                      </div>

                      <div className="min-w-0">
                        <h4
                          className="
                            text-xs
                            font-bold
                            text-slate-800
                            dark:text-slate-200
                            group-hover:text-blue-600
                            dark:group-hover:text-blue-400
                            transition
                          "
                        >
                          {tool.title}
                        </h4>

                        <p
                          className="
                            text-[10px]
                            text-slate-400
                            leading-snug
                            mt-0.5
                          "
                        >
                          {tool.description}
                        </p>
                      </div>
                    </button>
                  );
                })}

              </div>
            </section>

            {/* =================================================
                HISTORIQUE
            ================================================= */}

            <section
              className="
                pt-4
                border-t
                border-slate-200
                dark:border-slate-800
                space-y-3
              "
            >
              <div className="flex items-center justify-between">

                <h3
                  className="
                    text-xs
                    font-bold
                    text-slate-900
                    dark:text-white
                    uppercase
                    tracking-wider
                  "
                >
                  Historique
                </h3>

                <span
                  className="
                    text-[11px]
                    font-semibold
                    text-slate-400
                  "
                >
                  {filteredConversations.length}
                </span>
              </div>

              <div className="min-h-0 max-h-56 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="py-5 text-center">

                    <MessageSquare
                      size={18}
                      className="
                        mx-auto
                        mb-2
                        text-slate-300
                        dark:text-slate-700
                      "
                    />

                    <p
                      className="
                        text-[11px]
                        text-slate-400
                      "
                    >
                      {searchQuery
                        ? "Aucune conversation trouvée."
                        : "Aucune conversation."}
                    </p>
                  </div>
                ) : (
                  <ConversationList
                    conversations={
                      filteredConversations
                    }
                    selectedConversationId={
                      selectedConversation?.id
                    }
                    onSelectConversation={
                      loadConversation
                    }
                  />
                )}
              </div>

              <button
                type="button"
                onClick={createConversation}
                disabled={creatingConversation}
                className="
                  w-full
                  flex
                  items-center
                  justify-center
                  gap-2
                  border
                  border-blue-600
                  text-blue-600
                  hover:bg-blue-50
                  dark:hover:bg-slate-800
                  font-semibold
                  py-2
                  rounded-xl
                  text-xs
                  transition
                  shadow-sm
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {creatingConversation ? (
                  <RefreshCw
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={14} />
                )}

                {creatingConversation
                  ? "Création..."
                  : "Nouvelle conversation"}
              </button>
            </section>
          </aside>
        </div>
      </div>

      {/* ======================================================
          ERREUR GLOBALE
      ====================================================== */}

      {errorMessage && (
        <div
          role="alert"
          className="
            fixed
            bottom-5
            right-5
            z-50
            max-w-sm
            rounded-xl
            border
            border-red-200
            dark:border-red-900/50
            bg-white
            dark:bg-[#161b22]
            px-4
            py-3
            shadow-xl
            text-xs
            text-red-600
            dark:text-red-300
          "
        >
          {errorMessage}

          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="
              ml-3
              font-semibold
              underline
              hover:no-underline
            "
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
