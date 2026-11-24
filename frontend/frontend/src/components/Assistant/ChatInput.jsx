/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : ChatInput.jsx
 * Version : 3.3.0
 * Statut  : Pièces jointes + validation + envoi sécurisé
 * ==========================================================
 */

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Paperclip,
  X,
  FileText,
} from "lucide-react";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
];

export default function ChatInput({ onSend }) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  /* ==========================================================
     AUTO-RESIZE
  ========================================================== */

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    const nextHeight = Math.min(
      textarea.scrollHeight,
      160
    );

    textarea.style.height = `${nextHeight}px`;
  }, [message]);

  /* ==========================================================
     SÉLECTION DU FICHIER
  ========================================================== */

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setErrorMessage("");

    /* --------------------------------------------------------
       Taille
    -------------------------------------------------------- */

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setErrorMessage(
        "Le fichier est trop volumineux. La taille maximale est de 20 Mo."
      );

      return;
    }

    /* --------------------------------------------------------
       Extension
    -------------------------------------------------------- */

    const fileName =
      typeof selectedFile.name === "string"
        ? selectedFile.name.toLowerCase()
        : "";

    const isAccepted =
      ACCEPTED_EXTENSIONS.some((extension) =>
        fileName.endsWith(extension)
      );

    if (!isAccepted) {
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setErrorMessage(
        "Format non pris en charge. Utilisez PDF, DOCX, TXT, JPG, JPEG ou PNG."
      );

      return;
    }

    setFile(selectedFile);
  };

  /* ==========================================================
     OUVRIR LE SÉLECTEUR
  ========================================================== */

  const handleAttachmentClick = () => {
    if (isSending) {
      return;
    }

    fileInputRef.current?.click();
  };

  /* ==========================================================
     SUPPRIMER LE FICHIER
  ========================================================== */

  const removeFile = () => {
    if (isSending) {
      return;
    }

    setFile(null);
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ==========================================================
     ENVOYER
  ========================================================== */

  const handleSend = async () => {
    if (isSending) {
      return;
    }

    const text =
      typeof message === "string"
        ? message.trim()
        : "";

    if (!text && !file) {
      return;
    }

    if (typeof onSend !== "function") {
      setErrorMessage(
        "Le système d'envoi de MACEVO IA n'est pas disponible."
      );

      return;
    }

    setErrorMessage("");
    setIsSending(true);

    const selectedFile = file;

    try {
      await onSend(text, selectedFile);

      /*
       * Nettoyage uniquement après réussite.
       */
      setMessage("");
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(
        "Erreur ChatInput :",
        error
      );

      /*
       * ChatWindow gère déjà l'erreur serveur.
       * On affiche ici uniquement un message de secours
       * si aucune erreur exploitable n'est disponible.
       */
      const serverDetail =
        error?.response?.data?.detail ||
        error?.response?.data?.message;

      setErrorMessage(
        typeof serverDetail === "string"
          ? serverDetail
          : "Impossible d'envoyer le message. Vous pouvez réessayer."
      );
    } finally {
      setIsSending(false);
    }
  };

  /* ==========================================================
     CLAVIER
  ========================================================== */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void handleSend();
    }
  };

  /* ==========================================================
     INTERFACE
  ========================================================== */

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] px-6 py-5 transition-colors duration-200">

      {/* ======================================================
          ERREUR
      ====================================================== */}

      {errorMessage && (
        <div
          role="alert"
          className="
            mb-3
            rounded-xl
            border
            border-red-200
            dark:border-red-900/50
            bg-red-50
            dark:bg-red-950/30
            px-4
            py-3
            text-xs
            text-red-700
            dark:text-red-300
          "
        >
          {errorMessage}
        </div>
      )}

      {/* ======================================================
          FICHIER SÉLECTIONNÉ
      ====================================================== */}

      {file && (
        <div className="
          mb-3
          flex
          items-center
          justify-between
          rounded-xl
          border
          border-indigo-500/30
          bg-slate-50
          dark:bg-[#161b22]
          px-4
          py-3
          text-slate-800
          dark:text-slate-200
          shadow-sm
        ">
          <div className="flex items-center gap-3 min-w-0">

            <div className="
              w-9
              h-9
              rounded-lg
              bg-indigo-500/10
              border
              border-indigo-500/20
              text-indigo-600
              dark:text-indigo-400
              flex
              items-center
              justify-center
              shrink-0
            ">
              <FileText size={18} />
            </div>

            <div className="min-w-0">
              <p className="
                font-medium
                text-sm
                truncate
                text-slate-800
                dark:text-slate-100
              ">
                {file.name}
              </p>

              <p className="
                text-xs
                text-slate-500
                dark:text-slate-400
              ">
                {(file.size / 1024 / 1024).toFixed(2)} Mo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={removeFile}
            disabled={isSending}
            className="
              p-1.5
              rounded-lg
              text-slate-500
              dark:text-slate-400
              hover:text-slate-800
              dark:hover:text-slate-100
              hover:bg-slate-200
              dark:hover:bg-slate-800
              disabled:opacity-50
              transition
            "
            title="Supprimer le fichier"
            aria-label="Supprimer le fichier"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ======================================================
          INPUT FICHIER
      ====================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        onChange={handleFileChange}
        disabled={isSending}
        className="hidden"
      />

      {/* ======================================================
          ZONE PRINCIPALE
      ====================================================== */}

      <div className="flex items-end gap-3">

        {/* Pièce jointe */}

        <button
          type="button"
          onClick={handleAttachmentClick}
          disabled={isSending}
          className="
            p-3
            rounded-xl
            border
            border-slate-200
            dark:border-slate-800
            bg-slate-100
            dark:bg-[#161b22]
            text-slate-600
            dark:text-slate-400
            hover:text-slate-900
            dark:hover:text-slate-200
            hover:border-slate-300
            dark:hover:border-slate-700
            disabled:opacity-50
            disabled:cursor-not-allowed
            transition
            shadow-sm
          "
          title="Joindre un document ou une image"
          aria-label="Joindre un document ou une image"
        >
          <Paperclip size={20} />
        </button>

        {/* Texte */}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);

            if (errorMessage) {
              setErrorMessage("");
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message à MACEVO IA..."
          rows={1}
          disabled={isSending}
          aria-label="Message à MACEVO IA"
          className="
            flex-1
            resize-none
            overflow-y-auto
            rounded-xl
            border
            border-slate-200
            dark:border-slate-800
            bg-slate-50
            dark:bg-[#161b22]
            px-4
            py-3
            text-slate-800
            dark:text-slate-100
            placeholder:text-slate-400
            dark:placeholder:text-slate-500
            text-sm
            outline-none
            focus:border-indigo-500/60
            focus:ring-2
            focus:ring-indigo-500/20
            max-h-40
            disabled:opacity-60
            disabled:cursor-not-allowed
            transition
          "
        />

        {/* Envoyer */}

        <button
          type="button"
          onClick={handleSend}
          disabled={
            isSending ||
            (!message.trim() && !file)
          }
          className="
            bg-indigo-600
            hover:bg-indigo-500
            disabled:bg-slate-200
            dark:disabled:bg-slate-800
            disabled:text-slate-400
            dark:disabled:text-slate-600
            text-white
            rounded-xl
            p-3
            transition
            shadow-md
            shadow-indigo-600/20
            disabled:shadow-none
            disabled:cursor-not-allowed
          "
          title={
            isSending
              ? "Envoi en cours..."
              : "Envoyer"
          }
          aria-label={
            isSending
              ? "Envoi en cours"
              : "Envoyer le message"
          }
        >
          {isSending ? (
            <div
              className="
                w-5
                h-5
                border-2
                border-white/40
                border-t-white
                rounded-full
                animate-spin
              "
            />
          ) : (
            <Send size={20} />
          )}
        </button>

      </div>
    </div>
  );
}