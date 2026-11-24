/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : TypingIndicator.jsx
 * Version : 2.0.0
 * Statut  : Compatible Light / Dark
 * ==========================================================
 */

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-6">
      <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />

          <span
            className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />

          <span
            className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}