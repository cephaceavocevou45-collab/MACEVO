/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : ChatWindow.jsx
 * Version : 3.0.0
 * Statut  : Streaming SSE
 * ==========================================================
 */

import { useEffect, useRef, useState } from "react";

import assistantService from "../../services/assistantService";

import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";

import {
  Sparkles,
  Bot,
} from "lucide-react";


export default function ChatWindow({
  conversation,
  loading,
  onConversationUpdated,
}) {

  /* ========================================================
   * ÉTAT
   * ======================================================== */

  const [messages, setMessages] =
    useState([]);

  const [isTyping, setIsTyping] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");


  /* ========================================================
   * RÉFÉRENCES
   * ======================================================== */

  const messagesEndRef =
    useRef(null);

  const requestIdRef =
    useRef(0);

  const abortControllerRef =
    useRef(null);


  /* ========================================================
   * CHARGEMENT CONVERSATION
   * ======================================================== */

  useEffect(() => {

    /*
     * Invalide immédiatement une éventuelle
     * génération encore active.
     */

    requestIdRef.current += 1;


    /*
     * Annule le flux précédent.
     */

    if (
      abortControllerRef.current
    ) {

      try {

        abortControllerRef.current.abort();

      } catch {
        // Rien à faire.
      }

      abortControllerRef.current =
        null;
    }


    const nextMessages =
      Array.isArray(
        conversation?.messages
      )
        ? conversation.messages
        : [];


    let isCurrentConversation = true;
    queueMicrotask(() => {
      if (!isCurrentConversation) return;

      setMessages(nextMessages);
      setIsTyping(false);
      setErrorMessage("");
    });

    return () => {
      isCurrentConversation = false;
    };

  }, [conversation]);


  /* ========================================================
   * SCROLL AUTOMATIQUE
   * ======================================================== */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });

  }, [
    messages,
    isTyping,
  ]);


  /* ========================================================
   * NETTOYAGE
   * ======================================================== */

  useEffect(() => {

    return () => {

      requestIdRef.current += 1;


      if (
        abortControllerRef.current
      ) {

        try {

          abortControllerRef.current.abort();

        } catch {
          // Rien à faire.
        }

        abortControllerRef.current =
          null;
      }
    };

  }, []);


  /* ========================================================
   * ENVOI STREAMING
   * ======================================================== */

  const sendMessage = async (
    content,
    file = null
  ) => {

    const text =
      typeof content === "string"
        ? content.trim()
        : "";


    /*
     * Rien à envoyer.
     */

    if (
      !text &&
      !file
    ) {

      return false;
    }


    /* ======================================================
     * IDENTIFIANT DE REQUÊTE
     * ====================================================== */

    const requestId =
      ++requestIdRef.current;


    /* ======================================================
     * ANNULER UNE ANCIENNE REQUÊTE
     * ====================================================== */

    if (
      abortControllerRef.current
    ) {

      try {

        abortControllerRef.current.abort();

      } catch {
        // Rien à faire.
      }
    }


    const controller =
      new AbortController();


    abortControllerRef.current =
      controller;


    /* ======================================================
     * ÉTAT INITIAL
     * ====================================================== */

    setErrorMessage(
      "");

    setIsTyping(
      true
    );


    /* ======================================================
     * MESSAGE UTILISATEUR OPTIMISTE
     * ====================================================== */

    const optimisticUserMessage = {

      id:
        `optimistic-user-${Date.now()}-${requestId}`,

      role:
        "user",

      content:
        text ||
        "Pièce jointe envoyée.",

      created_at:
        new Date().toISOString(),

      attachment_name:
        file?.name ||
        null,

      attachment_type:
        file?.type ||
        null,

      attachment_size:
        file?.size ||
        null,
    };


    /* ======================================================
     * MESSAGE ASSISTANT TEMPORAIRE
     * ====================================================== */

    const streamingAssistantMessage = {

      id:
        `streaming-assistant-${Date.now()}-${requestId}`,

      role:
        "assistant",

      content:
        "",

      created_at:
        new Date().toISOString(),

      is_streaming:
        true,
    };


    /*
     * Les deux messages sont ajoutés immédiatement.
     *
     * Le message assistant sera ensuite mis à jour
     * à chaque chunk reçu du serveur.
     */

    setMessages((previous) => [

      ...previous,

      optimisticUserMessage,

      streamingAssistantMessage,

    ]);


    /* ======================================================
     * VARIABLES STREAM
     * ====================================================== */

    let streamedText =
      "";


    let streamCompleted =
      false;


    try {

      /* ====================================================
       * STREAM START
       * ==================================================== */

      await assistantService.streamMessage(

        text,

        conversation?.id,

        file,

        {

          /* =================================================
           * START
           * ================================================= */

          onStart: () => {

            /*
             * Vérifie que cette génération
             * est toujours la génération active.
             */

            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }


            setIsTyping(
              true
            );
          },


          /* =================================================
           * CHUNK
           * ================================================= */

          onChunk: (
            chunk
          ) => {

            /*
             * Une génération plus récente
             * a pris le relais.
             */

            if (
              requestId !==
              requestIdRef.current
            ) {

              return;
            }


            if (
              !chunk
            ) {

              return;
            }


            const normalizedChunk =
              String(
                chunk
              );


            streamedText +=
              normalizedChunk;


            /*
             * Mise à jour IMMÉDIATE du message
             * assistant.
             *
             * C'est ici que l'effet
             * "ChatGPT/Gemini" apparaît.
             */

            setMessages(
              (previous) =>

                previous.map(
                  (message) =>

                    message.id ===
                    streamingAssistantMessage.id

                      ? {
                          ...message,

                          content:
                            streamedText,

                          is_streaming:
                            true,
                        }

                      : message
                )
            );
          },


          /* =================================================
           * DONE
           * ================================================= */

          onDone: (
            data
          ) => {

            if (
              requestId !==
              requestIdRef.current
            ) {

              return;
            }


            streamCompleted =
              true;


            /*
             * Le backend peut éventuellement
             * renvoyer la réponse finale.
             */

            const finalResponse =
              typeof data?.response ===
              "string"

                ? data.response

                : streamedText;


            /*
             * Évite de remplacer une réponse
             * correctement accumulée par une valeur vide.
             */

            const finalText =
              finalResponse ||
              streamedText ||
              "";


            streamedText =
              finalText;


            setMessages(
              (previous) =>

                previous.map(
                  (message) =>

                    message.id ===
                    streamingAssistantMessage.id

                      ? {
                          ...message,

                          content:
                            finalText,

                          is_streaming:
                            false,
                        }

                      : message
                )
            );


            setIsTyping(
              false
            );
          },


          /* =================================================
           * ERROR
           * ================================================= */

          onError: (
            error
          ) => {

            if (
              requestId !==
              requestIdRef.current
            ) {

              return;
            }


            console.error(
              "Erreur streaming MACEVO IA :",
              error
            );
          },


          /* =================================================
           * ABORT
           * ================================================= */

          signal:
            controller.signal,
        }
      );


      /* ====================================================
       * VÉRIFICATION REQUÊTE ACTIVE
       * ==================================================== */

      if (
        requestId !==
        requestIdRef.current
      ) {

        return false;
      }


      /* ====================================================
       * FIN DE STREAM
       * ==================================================== */

      setIsTyping(
        false
      );


      /*
       * Si le serveur n'a pas envoyé explicitement
       * l'événement done mais que du texte existe,
       * le service de streaming possède déjà un fallback.
       */

      if (
        !streamCompleted
      ) {

        setMessages(
          (previous) =>

            previous.map(
              (message) =>

                message.id ===
                streamingAssistantMessage.id

                  ? {
                      ...message,

                      content:
                        streamedText,

                      is_streaming:
                        false,
                    }

                  : message
            )
        );
      }


      /* ====================================================
       * ACTUALISATION CONVERSATION
       * ==================================================== */

      /*
       * Une fois la génération terminée,
       * on recharge la conversation depuis le backend.
       *
       * Cela remplace les IDs temporaires par les
       * véritables IDs Django et récupère le message
       * effectivement sauvegardé.
       */

      if (
        typeof onConversationUpdated ===
          "function" &&
        conversation?.id
      ) {

        try {

          await onConversationUpdated(
            conversation.id
          );

        } catch (
          refreshError
        ) {

          /*
           * Une erreur de rafraîchissement ne doit
           * pas faire croire que la génération IA
           * a échoué.
           */

          console.warn(
            "Impossible de rafraîchir la conversation :",
            refreshError
          );
        }
      }


      return true;


    } catch (error) {

      /* ====================================================
       * REQUÊTE OBSOLÈTE
       * ==================================================== */

      if (
        requestId !==
        requestIdRef.current
      ) {

        return false;
      }


      /*
       * Abort volontaire :
       * ce n'est pas une erreur utilisateur.
       */

      if (
        error?.name ===
        "AbortError"
      ) {

        setMessages(
          (previous) =>

            previous.filter(
              (message) =>

                message.id !==
                  optimisticUserMessage.id &&
                message.id !==
                  streamingAssistantMessage.id
            )
        );


        setIsTyping(
          false
        );


        return false;
      }


      /* ====================================================
       * LOG
       * ==================================================== */

      console.error(
        "Erreur lors de la génération MACEVO IA :",
        error
      );


      /* ====================================================
       * RETRAIT DES MESSAGES TEMPORAIRES
       * ==================================================== */

      setMessages(
        (previous) =>

          previous.filter(
            (message) =>

              message.id !==
                optimisticUserMessage.id &&
              message.id !==
                streamingAssistantMessage.id
          )
      );


      /* ====================================================
       * MESSAGE D'ERREUR
       * ==================================================== */

      const serverDetail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error;


      setErrorMessage(

        typeof serverDetail ===
          "string"

          ? serverDetail

          : error?.message ||

            "Impossible de générer la réponse MACEVO IA. Vérifiez votre connexion puis réessayez."
      );


      setIsTyping(
        false
      );


      /*
       * ChatInput doit savoir que l'envoi
       * a réellement échoué.
       */

      throw error;


    } finally {

      /*
       * Ne modifie jamais l'état d'une génération
       * devenue obsolète.
       */

      if (
        requestId ===
        requestIdRef.current
      ) {

        setIsTyping(
          false
        );


        if (
          abortControllerRef.current ===
          controller
        ) {

          abortControllerRef.current =
            null;
        }
      }
    }
  };


  /* ========================================================
   * CHARGEMENT
   * ======================================================== */

  if (loading) {

    return (

      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0d1117] text-slate-500 dark:text-slate-400 transition-colors duration-200">

        <div className="flex items-center gap-3">

          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />

          <span>
            Chargement de la conversation...
          </span>

        </div>

      </div>
    );
  }


  /* ========================================================
   * INTERFACE
   * ======================================================== */

  return (

    <div className="flex flex-col flex-1 min-w-0 bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 transition-colors duration-200">


      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-10">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">

            <Bot size={20} />

          </div>


          <div>

            <h2 className="text-base font-semibold text-slate-900 dark:text-white">

              {conversation?.title ||
                "Assistant MACEVO IA"}

            </h2>


            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">

              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                aria-hidden="true"
              />

              {isTyping
                ? "Génération en cours..."
                : "En ligne"}

            </p>

          </div>

        </div>

      </div>


      {/* ====================================================
          MESSAGES
      ==================================================== */}

      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">


        {messages.length === 0 ? (

          <div className="flex flex-col justify-center items-center h-full text-center max-w-md mx-auto">


            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-4 shadow-xl">

              <Sparkles size={36} />

            </div>


            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">

              👋 Bonjour !

            </h1>


            <p className="text-slate-700 dark:text-slate-300 font-medium">

              Je suis MACEVO IA.

            </p>


            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">

              Posez-moi une question scientifique,
              importez un document ou commencez une
              nouvelle conversation.

            </p>

          </div>

        ) : (

          messages.map(
            (
              message,
              index
            ) => (

              <MessageBubble
                key={
                  message.id ??
                  `${message.role}-${message.created_at}-${index}`
                }
                message={
                  message
                }
              />

            )
          )

        )}


        {isTyping && (
          <TypingIndicator />
        )}


        {errorMessage && (

          <div
            role="alert"
            className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >

            {errorMessage}

          </div>

        )}


        <div
          ref={messagesEndRef}
        />

      </div>


      {/* ====================================================
          SAISIE
      ==================================================== */}

      <div className="p-4 bg-white/50 dark:bg-[#161b22]/50 border-t border-slate-200 dark:border-slate-800/80">

        <ChatInput
          onSend={
            sendMessage
          }
        />

      </div>

    </div>
  );
}
