import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Archive,
} from "lucide-react";

export default function ConversationList({
  conversations = [],
  selectedConversation,
  onSelectConversation,
  onNewConversation,
}) {
  const [search, setSearch] = useState("");

  const filteredConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      if (!conversation) return false;

      const title = String(conversation.title ?? "");

      if (!normalizedSearch) {
        return true;
      }

      return title.toLowerCase().includes(normalizedSearch);
    });
  }, [conversations, search]);

  const getLastMessage = (conversation) => {
    const lastMessage = conversation?.last_message;

    if (!lastMessage) {
      return "Nouvelle conversation";
    }

    if (typeof lastMessage === "string") {
      return lastMessage;
    }

    return lastMessage.content || "Nouvelle conversation";
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString();
  };

  return (
    <div className="w-80 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d1117] text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* ==================================================
          Nouvelle conversation
      ================================================== */}

      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80">
        <button
          type="button"
          onClick={onNewConversation}
          className="
            w-full
            bg-gradient-to-r
            from-blue-600
            via-indigo-600
            to-violet-600
            hover:from-blue-500
            hover:via-indigo-500
            hover:to-violet-500
            text-white
            font-medium
            rounded-xl
            py-3
            px-4
            flex
            items-center
            justify-center
            gap-2
            shadow-lg
            shadow-indigo-500/25
            hover:shadow-indigo-500/40
            transition-all
            duration-200
            active:scale-[0.98]
          "
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>Nouvelle conversation</span>
        </button>
      </div>

      {/* ==================================================
          Recherche
      ================================================== */}

      <div className="p-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500"
          />

          <input
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Rechercher une conversation"
            className="
              w-full
              pl-10
              pr-4
              py-2.5
              rounded-xl
              border
              border-slate-200
              dark:border-slate-800
              bg-slate-100
              dark:bg-slate-900/90
              text-sm
              text-slate-800
              dark:text-slate-100
              placeholder:text-slate-400
              dark:placeholder:text-slate-500
              outline-none
              focus:border-indigo-500
              focus:ring-2
              focus:ring-indigo-500/20
              transition-all
              duration-200
            "
          />
        </div>
      </div>

      {/* ==================================================
          Liste
      ================================================== */}

      <div className="flex-1 overflow-y-auto space-y-1.5 px-3 pb-4 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="text-center mt-12 px-4 text-sm text-slate-400 dark:text-slate-500 font-medium">
            {search.trim()
              ? "Aucune conversation trouvée."
              : "Aucune conversation."}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected =
              selectedConversation?.id === conversation.id;

            const title =
              conversation.title?.trim() ||
              "Nouvelle conversation";

            const lastMessage = getLastMessage(conversation);

            const totalMessages =
              Number(conversation.total_messages) ||
              Number(conversation.messages_count) ||
              0;

            return (
              <button
                type="button"
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                aria-current={isSelected ? "true" : undefined}
                className={`
                  w-full
                  text-left
                  p-3.5
                  rounded-xl
                  transition-all
                  duration-200
                  relative
                  group
                  ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-950/80 dark:to-slate-900/80 border border-indigo-200 dark:border-indigo-500/40 text-indigo-950 dark:text-white shadow-sm dark:shadow-md dark:shadow-indigo-950/50"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent text-slate-600 dark:text-slate-300"
                  }
                `}
              >
                {/* Barre de sélection */}

                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="
                      absolute
                      left-0
                      top-1/2
                      -translate-y-1/2
                      w-1
                      h-6
                      bg-indigo-600
                      dark:bg-indigo-500
                      rounded-r-full
                      shadow-[0_0_8px_rgba(99,102,241,0.8)]
                    "
                  />
                )}

                <div className="flex items-start gap-3">
                  {/* Icône */}

                  <div
                    className={`
                      p-2
                      rounded-lg
                      shrink-0
                      transition-colors
                      ${
                        isSelected
                          ? "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400"
                          : "bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                      }
                    `}
                  >
                    <MessageSquare size={16} />
                  </div>

                  {/* Informations */}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3
                        className={`
                          font-semibold
                          text-sm
                          truncate
                          ${
                            isSelected
                              ? "text-indigo-950 dark:text-white"
                              : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"
                          }
                        `}
                      >
                        {title}
                      </h3>

                      <div className="flex items-center gap-1 shrink-0">
                        {conversation.is_pinned && (
                          <Pin
                            size={12}
                            className="text-amber-500 dark:text-amber-400"
                            aria-label="Conversation épinglée"
                          />
                        )}

                        {conversation.is_archived && (
                          <Archive
                            size={12}
                            className="text-slate-400 dark:text-slate-500"
                            aria-label="Conversation archivée"
                          />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                      {lastMessage}
                    </p>

                    <div className="flex justify-between items-center mt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
                      <span className="font-medium">
                        {totalMessages}{" "}
                        {totalMessages > 1 ? "messages" : "message"}
                      </span>

                      <span>
                        {formatDate(conversation.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}