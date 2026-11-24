/**
 * ==========================================================
 * MACEVO
 * Assistant Service
 * ==========================================================
 *
 * Service frontend central pour MACEVO IA.
 *
 * Responsabilités :
 * - conversations ;
 * - envoi de messages ;
 * - pièces jointes ;
 * - génération classique ;
 * - génération en streaming SSE ;
 * - authentification JWT ;
 * - refresh automatique du JWT ;
 * - gestion des erreurs.
 *
 * Architecture :
 *
 *   ChatWindow
 *       ↓
 *   assistantService
 *       ↓
 *   API Django
 *       ↓
 *   AssistantService (authentification, historique, documents)
 *       ↓
 *   MACEVO_IA API (raisonnement et génération)
 *       ↓
 *   Fournisseur configuré côté MACEVO_IA
 *
 * ==========================================================
 */

import api, {
  fetchWithAuth,
} from "../api/axios";


/* ==========================================================
 * CONFIGURATION
 * ========================================================== */

const CHAT_ENDPOINT = "assistant/chat/";

const MAX_FILE_SIZE =
  20 * 1024 * 1024;


/* ==========================================================
 * UTILITAIRES
 * ========================================================== */

/**
 * Retourne l'URL absolue du endpoint de chat.
 */
const getChatUrl = () => {
  const baseURL =
    api.defaults.baseURL;

  if (!baseURL) {
    throw new Error(
      "L'URL de l'API MACEVO n'est pas configurée."
    );
  }

  const absoluteBaseURL = new URL(
    baseURL,
    window.location.origin
  );

  return new URL(
    CHAT_ENDPOINT,
    absoluteBaseURL
  ).toString();
};


/**
 * Vérifie une pièce jointe.
 */
const validateFile = (file) => {
  if (!file) {
    return;
  }

  if (
    typeof file.size === "number" &&
    file.size > MAX_FILE_SIZE
  ) {
    throw new Error(
      "Le fichier ne doit pas dépasser 20 Mo."
    );
  }

  const allowedExtensions = [
    ".pdf",
    ".docx",
    ".txt",
    ".jpg",
    ".jpeg",
    ".png",
  ];

  const name = String(
    file.name || ""
  ).toLowerCase();

  const validExtension =
    allowedExtensions.some(
      (extension) =>
        name.endsWith(extension)
    );

  if (!validExtension) {
    throw new Error(
      "Type de fichier non pris en charge. " +
      "Formats acceptés : PDF, DOCX, TXT, JPG, JPEG et PNG."
    );
  }
};


/**
 * Construit le FormData utilisé par Django.
 */
const buildChatFormData = (
  message,
  conversationId = null,
  file = null
) => {
  const formData =
    new FormData();

  formData.append(
    "message",
    String(message || "")
  );

  if (
    conversationId !== null &&
    conversationId !== undefined &&
    conversationId !== ""
  ) {
    formData.append(
      "conversation_id",
      String(conversationId)
    );
  }

  if (file) {
    validateFile(file);

    formData.append(
      "file",
      file,
      file.name
    );
  }

  return formData;
};


/**
 * Transforme une erreur Axios en message lisible.
 */
const getAxiosErrorMessage = (
  error,
  fallback = "Une erreur est survenue."
) => {
  if (!error) {
    return fallback;
  }

  if (
    error.response &&
    error.response.data
  ) {
    const data =
      error.response.data;

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return String(
        data.detail
      );
    }

    if (data.message) {
      return String(
        data.message
      );
    }

    if (data.error) {
      return String(
        data.error
      );
    }

    if (
      data.non_field_errors &&
      Array.isArray(
        data.non_field_errors
      )
    ) {
      return data.non_field_errors.join(
        " "
      );
    }
  }

  if (error.message) {
    return String(
      error.message
    );
  }

  return fallback;
};


/**
 * Transforme une réponse HTTP d'erreur
 * en message utilisateur.
 */
const getFetchErrorMessage = async (
  response
) => {
  if (!response) {
    return "Impossible d'envoyer le message.";
  }

  if (response.status === 401) {
    /*
     * Normalement fetchWithAuth() aura déjà effectué
     * le refresh et la seconde tentative.
     *
     * Si nous arrivons encore ici avec 401,
     * le refresh n'a pas permis de réauthentifier
     * la requête.
     */
    return (
      "Votre session a expiré. " +
      "Veuillez vous reconnecter."
    );
  }

  let errorMessage =
    "Impossible d'envoyer le message.";

  try {
    const errorText =
      await response.text();

    if (!errorText) {
      return errorMessage;
    }

    try {
      const errorData =
        JSON.parse(errorText);

      if (errorData.detail) {
        errorMessage =
          String(
            errorData.detail
          );
      } else if (
        errorData.message
      ) {
        errorMessage =
          String(
            errorData.message
          );
      } else if (
        errorData.error
      ) {
        errorMessage =
          String(
            errorData.error
          );
      } else if (
        errorData.non_field_errors &&
        Array.isArray(
          errorData.non_field_errors
        )
      ) {
        errorMessage =
          errorData.non_field_errors.join(
            " "
          );
      }
    } catch {
      if (errorText.trim()) {
        errorMessage =
          errorText.trim();
      }
    }
  } catch {
    /*
     * On conserve le message par défaut.
     */
  }

  return errorMessage;
};


/* ==========================================================
 * PARSING SSE
 * ========================================================== */

/**
 * Parse un événement SSE.
 *
 * Exemple :
 *
 * event: chunk
 * data: {"type":"chunk","content":"Bonjour"}
 */
const parseSSEEvent = (
  rawEvent
) => {
  const lines =
    String(rawEvent || "")
      .split(/\r?\n/);

  let eventType =
    "message";

  const dataLines = [];

  for (const line of lines) {

    if (
      line.startsWith("event:")
    ) {
      eventType =
        line
          .slice(6)
          .trim() ||
        "message";
    }

    if (
      line.startsWith("data:")
    ) {
      dataLines.push(
        line.slice(5)
      );
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  /*
   * SSE permet plusieurs lignes data:.
   * Elles doivent être réunies avec un saut de ligne.
   */
  const rawData =
    dataLines.join("\n").trim();

  if (!rawData) {
    return {
      type: eventType,
    };
  }

  let data;

  try {
    data =
      JSON.parse(rawData);
  } catch {
    data = {
      type: eventType,
      content: rawData,
    };
  }

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    if (!data.type) {
      data.type = eventType;
    }

    return data;
  }

  return {
    type: eventType,
    content: String(
      data ?? ""
    ),
  };
};


/* ==========================================================
 * SERVICE
 * ========================================================== */

const assistantService = {


  /* ========================================================
   * CONVERSATIONS
   * ======================================================== */

  /**
   * Récupère les conversations.
   */
  async getConversations(
    params = {}
  ) {
    try {
      const response =
        await api.get(
          "assistant/conversations/",
          {
            params,
          }
        );

      return response.data;

    } catch (error) {

      console.error(
        "Erreur récupération conversations :",
        error
      );

      throw new Error(
        getAxiosErrorMessage(
          error,
          "Impossible de récupérer les conversations."
        ),
        { cause: error }
      );
    }
  },


  /**
   * Récupère une conversation.
   */
  async getConversation(
    conversationId
  ) {
    if (
      conversationId === null ||
      conversationId === undefined
    ) {
      throw new Error(
        "Identifiant de conversation manquant."
      );
    }

    try {
      const response =
        await api.get(
          `assistant/conversations/${conversationId}/`
        );

      return response.data;

    } catch (error) {

      console.error(
        "Erreur récupération conversation :",
        error
      );

      throw new Error(
        getAxiosErrorMessage(
          error,
          "Impossible de récupérer la conversation."
        ),
        { cause: error }
      );
    }
  },


  /**
   * Crée une nouvelle conversation.
   */
  async createConversation(
    title = "Nouvelle conversation",
    projectId = null
  ) {
    try {
      const response =
        await api.post(
          "assistant/conversations/create/",
          {
            title,
            ...(projectId ? { project_id: projectId } : {}),
          }
        );

      return response.data;

    } catch (error) {

      console.error(
        "Erreur création conversation :",
        error
      );

      throw new Error(
        getAxiosErrorMessage(
          error,
          "Impossible de créer une nouvelle conversation."
        ),
        { cause: error }
      );
    }
  },


  /**
   * Renomme une conversation.
   */
  async renameConversation(
    conversationId,
    title
  ) {
    if (
      conversationId === null ||
      conversationId === undefined
    ) {
      throw new Error(
        "Identifiant de conversation manquant."
      );
    }

    try {
      const response =
        await api.patch(
          `assistant/conversations/${conversationId}/rename/`,
          {
            title,
          }
        );

      return response.data;

    } catch (error) {

      console.error(
        "Erreur renommage conversation :",
        error
      );

      throw new Error(
        getAxiosErrorMessage(
          error,
          "Impossible de renommer la conversation."
        ),
        { cause: error }
      );
    }
  },


  /**
   * Supprime une conversation.
   */
  async deleteConversation(
    conversationId
  ) {
    if (
      conversationId === null ||
      conversationId === undefined
    ) {
      throw new Error(
        "Identifiant de conversation manquant."
      );
    }

    try {
      const response =
        await api.delete(
          `assistant/conversations/${conversationId}/delete/`
        );

      return response.data;

    } catch (error) {

      console.error(
        "Erreur suppression conversation :",
        error
      );

      throw new Error(
        getAxiosErrorMessage(
          error,
          "Impossible de supprimer la conversation."
        ),
        { cause: error }
      );
    }
  },


  /**
   * Épingle / désépingle une conversation.
   */
  async togglePin(
    conversationId
  ) {
    if (
      conversationId === null ||
      conversationId === undefined
    ) {
      throw new Error(
        "Identifiant de conversation manquant."
      );
    }

    try {
      const response =
        await api.post(
          `assistant/conversations/${conversationId}/pin/`
        );

      return response.data;

    } catch (error) {

      console.error(
        "Erreur modification épingle :",
        error
      );

      throw new Error(
        getAxiosErrorMessage(
          error,
          "Impossible de modifier l'état de la conversation."
        ),
        { cause: error }
      );
    }
  },


  /**
   * Archive / désarchive une conversation.
   */
  async toggleArchive(
    conversationId
  ) {
    if (
      conversationId === null ||
      conversationId === undefined
    ) {
      throw new Error(
        "Identifiant de conversation manquant."
      );
    }

    try {
      const response =
        await api.post(
          `assistant/conversations/${conversationId}/archive/`
        );

      return response.data;

    } catch (error) {

      console.error(
        "Erreur archivage conversation :",
        error
      );

      throw new Error(
        getAxiosErrorMessage(
          error,
          "Impossible de modifier l'archivage."
        ),
        { cause: error }
      );
    }
  },


  /* ========================================================
   * MESSAGE CLASSIQUE
   * ======================================================== */

  /**
   * Envoie un message sans streaming.
   *
   * Axios prend automatiquement en charge :
   * - access token ;
   * - 401 ;
   * - refresh ;
   * - retry.
   */
  async sendMessage(
    message,
    conversationId = null,
    file = null
  ) {
    const cleanMessage =
      String(message || "").trim();

    if (
      !cleanMessage &&
      !file
    ) {
      throw new Error(
        "Le message ne peut pas être vide."
      );
    }

    const formData =
      buildChatFormData(
        cleanMessage,
        conversationId,
        file
      );

    try {
      const response =
        await api.post(
          CHAT_ENDPOINT,
          formData,
          {
            timeout: 180000,
          }
        );

      return response.data;

    } catch (error) {

      console.error(
        "Erreur envoi message :",
        error
      );

      throw new Error(
        getAxiosErrorMessage(
          error,
          "Impossible d'envoyer le message."
        ),
        { cause: error }
      );
    }
  },


  /* ========================================================
   * STREAMING SSE
   * ======================================================== */

  /**
   * Envoie un message et reçoit progressivement
   * la réponse de MACEVO IA via SSE.
   *
   * IMPORTANT :
   *
   * On n'utilise plus directement `fetch()`.
   *
   * On utilise :
   *
   *     fetchWithAuth()
   *
   * qui reproduit le mécanisme Axios :
   *
   *     access token
   *          ↓
   *        requête
   *          ↓
   *        401 ?
   *          ↓
   *      refresh JWT
   *          ↓
   *      nouveau token
   *          ↓
   *        retry
   *
   * Cela corrige notamment le problème :
   *
   * "Votre session a expiré"
   *
   * qui pouvait apparaître après le premier message
   * lorsque le access token arrivait à expiration.
   */
  async streamMessage(
    message,
    conversationId = null,
    file = null,
    callbacks = {}
  ) {

    const {
      onStart,
      onChunk,
      onDone,
      onError,
      signal,
    } = callbacks || {};


    /* ======================================================
     * VALIDATION MESSAGE
     * ====================================================== */

    const cleanMessage =
      String(message || "").trim();

    if (
      !cleanMessage &&
      !file
    ) {
      throw new Error(
        "Le message ne peut pas être vide."
      );
    }


    /* ======================================================
     * FORMDATA
     * ====================================================== */

    const formData =
      buildChatFormData(
        cleanMessage,
        conversationId,
        file
      );


    /* ======================================================
     * URL
     * ====================================================== */

    const url = new URL(getChatUrl());
    url.searchParams.set("stream", "true");


    /* ======================================================
     * REQUÊTE SSE AUTHENTIFIÉE
     * ====================================================== */

    let response;

    try {

      response =
        await fetchWithAuth(
          url.toString(),
          {
            method: "POST",

            headers: {
              /*
               * IMPORTANT :
               *
               * Ne pas définir Content-Type ici.
               *
               * FormData doit laisser le navigateur
               * générer automatiquement :
               *
               * multipart/form-data;
               * boundary=...
               */

              Accept:
                "text/event-stream",
            },

            body: formData,

            credentials:
              "include",

            signal,
          }
        );

    } catch (error) {

      /*
       * Annulation volontaire.
       */
      if (
        error &&
        error.name === "AbortError"
      ) {
        throw error;
      }

      console.error(
        "Erreur connexion streaming MACEVO :",
        error
      );

      const networkError =
        new Error(
          "Impossible de contacter le serveur MACEVO."
        );

      if (
        typeof onError === "function"
      ) {
        onError(networkError);
      }

      throw networkError;
    }


    /* ======================================================
     * ERREUR HTTP
     * ====================================================== */

    if (!response.ok) {

      const errorMessage =
        await getFetchErrorMessage(
          response
        );

      const httpError =
        new Error(
          errorMessage
        );

      console.error(
        "Erreur HTTP streaming MACEVO :",
        response.status,
        errorMessage
      );

      if (
        typeof onError === "function"
      ) {
        onError(httpError);
      }

      throw httpError;
    }


    /* ======================================================
     * VÉRIFICATION STREAM
     * ====================================================== */

    if (!response.body) {

      const streamError =
        new Error(
          "Le navigateur ne prend pas en charge le streaming de réponse."
        );

      if (
        typeof onError === "function"
      ) {
        onError(streamError);
      }

      throw streamError;
    }


    /* ======================================================
     * DÉBUT
     * ====================================================== */

    if (
      typeof onStart === "function"
    ) {
      onStart();
    }


    /* ======================================================
     * READER
     * ====================================================== */

    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder(
        "utf-8"
      );

    let buffer = "";
    let fullResponse = "";
    let completed = false;


    /* ======================================================
     * TRAITEMENT ÉVÉNEMENT SSE
     * ====================================================== */

    const processEvent = (
      rawEvent
    ) => {

      const event =
        parseSSEEvent(
          rawEvent
        );

      if (!event) {
        return;
      }

      const type =
        String(
          event.type ||
          "message"
        ).toLowerCase();


      /* ----------------------------------------------------
       * START
       * ---------------------------------------------------- */

      if (
        type === "start"
      ) {
        return;
      }


      /* ----------------------------------------------------
       * CHUNK
       * ---------------------------------------------------- */

      if (
        type === "chunk"
      ) {

        const content =
          event.content;

        if (
          content !== null &&
          content !== undefined &&
          String(content).length > 0
        ) {

          const text =
            String(content);

          fullResponse += text;

          if (
            typeof onChunk === "function"
          ) {
            onChunk(
              text,
              event
            );
          }
        }

        return;
      }


      /* ----------------------------------------------------
       * DONE
       * ---------------------------------------------------- */

      if (
        type === "done"
      ) {

        completed = true;

        if (
          typeof onDone === "function"
        ) {
          onDone({
            ...event,

            type:
              "done",

            response:
              fullResponse,
          });
        }

        return;
      }


      /* ----------------------------------------------------
       * ERROR
       * ---------------------------------------------------- */

      if (
        type === "error"
      ) {

        const message =
          event.error ||
          event.message ||
          event.content ||
          "Erreur pendant la génération.";

        throw new Error(
          String(message)
        );
      }


      /* ----------------------------------------------------
       * KEEPALIVE / PING
       * ---------------------------------------------------- */

      if (
        type === "ping" ||
        type === "keepalive"
      ) {
        return;
      }


      /* ----------------------------------------------------
       * ÉVÉNEMENT INCONNU AVEC CONTENU
       * ---------------------------------------------------- */

      if (
        event.content !== null &&
        event.content !== undefined
      ) {

        const text =
          String(
            event.content
          );

        if (text) {

          fullResponse += text;

          if (
            typeof onChunk === "function"
          ) {
            onChunk(
              text,
              event
            );
          }
        }
      }
    };


    /* ======================================================
     * LECTURE DU STREAM
     * ====================================================== */

    try {

      while (true) {

        const result =
          await reader.read();

        if (result.done) {
          break;
        }

        const decoded =
          decoder.decode(
            result.value,
            {
              stream: true,
            }
          );

        buffer += decoded;


        /*
         * SSE :
         *
         * événement
         *
         * événement
         *
         * Les événements sont séparés
         * par une ligne vide.
         */

        const events =
          buffer.split(
            /\r?\n\r?\n/
          );

        buffer =
          events.pop() || "";


        for (
          const rawEvent of events
        ) {

          if (
            !rawEvent.trim()
          ) {
            continue;
          }

          processEvent(
            rawEvent
          );
        }
      }


      /* ====================================================
       * FIN DU DECODER
       * ==================================================== */

      buffer +=
        decoder.decode();


      if (
        buffer.trim()
      ) {
        processEvent(
          buffer
        );
      }


      /* ====================================================
       * FALLBACK DONE
       * ==================================================== */

      if (
        !completed
      ) {

        completed = true;

        if (
          typeof onDone === "function"
        ) {
          onDone({
            type:
              "done",

            response:
              fullResponse,

            fallback:
              true,
          });
        }
      }


      /* ====================================================
       * RÉSULTAT FINAL
       * ==================================================== */

      return {
        type:
          "done",

        response:
          fullResponse,
      };

    } catch (error) {

      /*
       * Annulation volontaire.
       */
      if (
        error &&
        error.name === "AbortError"
      ) {
        throw error;
      }

      console.error(
        "Erreur streaming MACEVO :",
        error
      );

      if (
        typeof onError === "function"
      ) {
        onError(error);
      }

      throw error;

    } finally {

      try {
        reader.releaseLock();
      } catch {
        /*
         * Rien à faire.
         */
      }
    }
  },


  /* ========================================================
   * REQUÊTE GÉNÉRIQUE
   * ======================================================== */

  async request(
    config
  ) {
    try {

      const response =
        await api.request(
          config
        );

      return response.data;

    } catch (error) {

      console.error(
        "Erreur requête assistant :",
        error
      );

      throw new Error(
        getAxiosErrorMessage(
          error,
          "Une erreur est survenue lors de la requête."
        ),
        { cause: error }
      );
    }
  },


  /* ========================================================
   * INFORMATIONS
   * ======================================================== */

  info() {
    return {
      service:
        "assistantService",

      chatEndpoint:
        CHAT_ENDPOINT,

      streaming:
        true,

      authentication:
        "JWT",

      authenticationRefresh:
        true,

      transport:
        "fetch/SSE",

      maxFileSize:
        MAX_FILE_SIZE,
    };
  },
};


/* ==========================================================
 * EXPORT
 * ========================================================== */

export default assistantService;
