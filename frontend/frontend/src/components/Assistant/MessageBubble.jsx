/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : MessageBubble.jsx
 * Version : 2.1.0
 * Statut  : Stable
 * ==========================================================
 */

import {
  User,
  Bot,
  FileText,
  Download,
  ExternalLink,
} from "lucide-react";

function renderInlineMarkdown(text, keyPrefix) {
  const tokens = String(text || "").split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g);

  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/i);
    if (link) {
      return <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{link[1]}</a>;
    }
    if (token.startsWith("**") || token.startsWith("__")) {
      return <strong key={key} className="font-semibold">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("*") || token.startsWith("_")) {
      return <em key={key}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

function renderAssistantMarkdown(content) {
  let inCodeBlock = false;

  return String(content || "").replace(/\r\n?/g, "\n").split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return null;
    }
    if (inCodeBlock) {
      return <pre key={`code-${index}`} className="my-1 overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-slate-100">{line || " "}</pre>;
    }
    if (!trimmed) return <div key={`space-${index}`} className="h-2" aria-hidden="true" />;

    const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const level = trimmed.match(/^#+/)[0].length;
      const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
      const size = level === 1 ? "text-lg" : level === 2 ? "text-base" : "text-sm";
      return <Tag key={`heading-${index}`} className={`mb-1 mt-3 first:mt-0 ${size} font-semibold tracking-tight`}>{renderInlineMarkdown(heading[1], `heading-${index}`)}</Tag>;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bullet) return <div key={`bullet-${index}`} className="flex gap-2 pl-1"><span className="text-indigo-500" aria-hidden="true">•</span><span>{renderInlineMarkdown(bullet[1], `bullet-${index}`)}</span></div>;

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) return <p key={`number-${index}`} className="pl-1">{renderInlineMarkdown(trimmed.replace(/^\d+[.)]\s+/, ""), `number-${index}`)}</p>;

    return <p key={`paragraph-${index}`} className="my-1 first:mt-0 last:mb-0">{renderInlineMarkdown(trimmed.replace(/^>\s?/, ""), `paragraph-${index}`)}</p>;
  });
}

export default function MessageBubble({ message }) {
  if (!message) return null;

  const isUser = message.role === "user";

  // ==========================================================
  // Heure du message
  // ==========================================================

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // ==========================================================
  // Informations de la pièce jointe
  // ==========================================================

  const attachmentUrl =
    message.attachment_url ||
    message.attachment ||
    null;

  const attachmentName =
    message.attachment_name ||
    "Fichier joint";

  const attachmentType =
    message.attachment_type ||
    "";

  // ==========================================================
  // Détection image
  // ==========================================================

  const isImage =
    attachmentType.toLowerCase().startsWith("image/") ||
    /\.(jpg|jpeg|png)$/i.test(attachmentName);

  // ==========================================================
  // Taille du fichier
  // ==========================================================

  const formatFileSize = (size) => {
    if (!size || Number(size) <= 0) return "";

    const bytes = Number(size);

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // ==========================================================
  // Classes
  // ==========================================================

  const bubbleClasses = isUser
    ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/10"
    : "bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-slate-200/50 dark:shadow-slate-950/20";

  const attachmentClasses = isUser
    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-500/30 text-indigo-950 dark:text-white"
    : "bg-slate-50 dark:bg-[#161b22] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100";

  // ==========================================================
  // Rendu
  // ==========================================================

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex max-w-4xl gap-3 ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        {/* ==================================================
            Avatar
        ================================================== */}

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${
            isUser
              ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
              : "bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-indigo-600 dark:text-indigo-400"
          }`}
          aria-hidden="true"
        >
          {isUser ? (
            <User size={20} />
          ) : (
            <Bot size={20} />
          )}
        </div>

        {/* ==================================================
            Contenu
        ================================================== */}

        <div className="min-w-0">
          {/* ==================================================
              Message texte
          ================================================== */}

          {message.content && (
            <div
              className={`rounded-2xl px-5 py-4 shadow-sm whitespace-pre-wrap break-words text-sm leading-relaxed transition-colors ${bubbleClasses}`}
            >
              {isUser ? message.content : renderAssistantMarkdown(message.content)}
            </div>
          )}

          {/* ==================================================
              Pièce jointe
          ================================================== */}

          {attachmentUrl && (
            <div
              className={`mt-3 rounded-2xl overflow-hidden border shadow-sm transition-colors ${attachmentClasses}`}
            >
              {/* ==================================================
                  Image
              ================================================== */}

              {isImage ? (
                <div className="p-2">
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ouvrir ${attachmentName}`}
                  >
                    <img
                      src={attachmentUrl}
                      alt={attachmentName}
                      className="
                        max-w-full
                        max-h-96
                        rounded-xl
                        object-contain
                        cursor-pointer
                        hover:opacity-90
                        transition
                      "
                    />
                  </a>
                </div>
              ) : (
                /* ==================================================
                    Document
                ================================================== */

                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        w-12
                        h-12
                        rounded-xl
                        bg-indigo-500/10
                        border
                        border-indigo-500/20
                        text-indigo-600
                        dark:text-indigo-400
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                      "
                    >
                      <FileText size={24} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-slate-800 dark:text-slate-100">
                        {attachmentName}
                      </p>

                      {message.attachment_size && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatFileSize(message.attachment_size)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ==================================================
                      Actions
                  ================================================== */}

                  <div className="flex flex-wrap gap-2 mt-4">
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        flex
                        items-center
                        gap-2
                        px-3
                        py-2
                        rounded-lg
                        bg-indigo-600
                        hover:bg-indigo-500
                        text-white
                        text-sm
                        font-medium
                        transition
                      "
                    >
                      <ExternalLink size={16} />
                      Ouvrir
                    </a>

                    <a
                      href={attachmentUrl}
                      download={attachmentName}
                      className="
                        flex
                        items-center
                        gap-2
                        px-3
                        py-2
                        rounded-lg
                        border
                        border-slate-300
                        dark:border-slate-700
                        bg-white
                        dark:bg-slate-800/80
                        hover:bg-slate-100
                        dark:hover:bg-slate-700
                        text-slate-700
                        dark:text-slate-200
                        text-sm
                        font-medium
                        transition
                      "
                    >
                      <Download size={16} />
                      Télécharger
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================
              Heure
          ================================================== */}

          {time && (
            <div
              className={`text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 ${
                isUser ? "text-right" : "text-left"
              }`}
            >
              {time}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
