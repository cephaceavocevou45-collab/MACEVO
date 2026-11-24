import axios from "axios";

/* ============================================================
   CONFIGURATION API MACEVO
============================================================ */

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    "/api/"
).trim();

const REQUEST_TIMEOUT =
    Number(import.meta.env.VITE_API_TIMEOUT) || 60000;

const normalizedBaseURL = API_BASE_URL.endsWith("/")
    ? API_BASE_URL
    : `${API_BASE_URL}/`;


/* ============================================================
   INSTANCE AXIOS
============================================================ */

const api = axios.create({
    baseURL: normalizedBaseURL,
    timeout: REQUEST_TIMEOUT,
    headers: {
        Accept: "application/json",
    },
});


/* ============================================================
   CONSTANTES
============================================================ */

const ACCESS_TOKEN_KEY = "access";
const REFRESH_TOKEN_KEY = "refresh";
const EMAIL_KEY = "email";
const FULLNAME_KEY = "fullname";


/* ============================================================
   OUTILS TOKEN
============================================================ */

export const getAccessToken = () => {
    try {
        return localStorage.getItem(
            ACCESS_TOKEN_KEY
        );
    } catch (error) {
        console.error(
            "MACEVO : impossible de lire le token d'accès.",
            error
        );

        return null;
    }
};


export const getRefreshToken = () => {
    try {
        return localStorage.getItem(
            REFRESH_TOKEN_KEY
        );
    } catch (error) {
        console.error(
            "MACEVO : impossible de lire le token de rafraîchissement.",
            error
        );

        return null;
    }
};


export const setAccessToken = (token) => {
    try {
        if (token) {
            localStorage.setItem(
                ACCESS_TOKEN_KEY,
                token
            );
        } else {
            localStorage.removeItem(
                ACCESS_TOKEN_KEY
            );
        }
    } catch (error) {
        console.error(
            "MACEVO : impossible d'enregistrer le token.",
            error
        );
    }
};


export const setRefreshToken = (token) => {
    try {
        if (token) {
            localStorage.setItem(
                REFRESH_TOKEN_KEY,
                token
            );
        } else {
            localStorage.removeItem(
                REFRESH_TOKEN_KEY
            );
        }
    } catch (error) {
        console.error(
            "MACEVO : impossible d'enregistrer le refresh token.",
            error
        );
    }
};


/* ============================================================
   INFORMATIONS UTILISATEUR
============================================================ */

export const getStoredUser = () => {
    try {
        return {
            email:
                localStorage.getItem(
                    EMAIL_KEY
                ) || "",

            fullname:
                localStorage.getItem(
                    FULLNAME_KEY
                ) || "",
        };
    } catch (error) {
        console.error(
            "MACEVO : impossible de récupérer les informations utilisateur.",
            error
        );

        return {
            email: "",
            fullname: "",
        };
    }
};


/* ============================================================
   REFRESH TOKEN
============================================================ */

let refreshPromise = null;


export const refreshAccessToken = async () => {
    const refreshToken =
        getRefreshToken();

    if (!refreshToken) {
        throw new Error(
            "Aucun refresh token disponible."
        );
    }

    /*
     * Si un refresh est déjà en cours,
     * toutes les requêtes utilisent la même promesse.
     */
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = axios
        .post(
            `${normalizedBaseURL}token/refresh/`,
            {
                refresh: refreshToken,
            },
            {
                timeout: REQUEST_TIMEOUT,

                headers: {
                    Accept:
                        "application/json",

                    "Content-Type":
                        "application/json",
                },
            }
        )
        .then((response) => {
            const newAccessToken =
                response?.data?.access;

            if (!newAccessToken) {
                throw new Error(
                    "Le serveur n'a pas retourné de nouveau token d'accès."
                );
            }

            setAccessToken(
                newAccessToken
            );

            return newAccessToken;
        })
        .catch((error) => {
            console.error(
                "MACEVO : échec du renouvellement du token.",
                error
            );

            throw error;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
};


export const getFreshAccessToken = async () => {
    return refreshAccessToken();
};


/* ============================================================
   LOGOUT
============================================================ */

export const logout = () => {
    try {
        localStorage.removeItem(
            ACCESS_TOKEN_KEY
        );

        localStorage.removeItem(
            REFRESH_TOKEN_KEY
        );

        localStorage.removeItem(
            EMAIL_KEY
        );

        localStorage.removeItem(
            FULLNAME_KEY
        );

        sessionStorage.removeItem(
            "macevo_current_report"
        );

        sessionStorage.removeItem(
            "macevo_report_data"
        );

        sessionStorage.removeItem(
            "macevo_generation_config"
        );
    } catch (error) {
        console.error(
            "MACEVO : erreur pendant la déconnexion.",
            error
        );
    }
};


/* ============================================================
   REQUEST INTERCEPTOR
============================================================ */

api.interceptors.request.use(
    (config) => {
        const token =
            getAccessToken();

        /*
         * Ajout automatique du JWT.
         */
        if (token) {
            config.headers =
                config.headers || {};

            config.headers.Authorization =
                `Bearer ${token}`;
        }

        /*
         * Axios doit gérer automatiquement
         * le Content-Type des FormData.
         */
        if (
            typeof FormData !==
                "undefined" &&
            config.data instanceof FormData
        ) {
            if (
                config.headers &&
                config.headers["Content-Type"]
            ) {
                delete config.headers[
                    "Content-Type"
                ];
            }
        } else if (
            config.data !== undefined &&
            config.data !== null
        ) {
            config.headers =
                config.headers || {};

            config.headers[
                "Content-Type"
            ] =
                "application/json";
        }

        /*
         * Diagnostic utile en développement.
         */
        if (import.meta.env.DEV) {
            const method =
                (
                    config.method ||
                    "GET"
                ).toUpperCase();

            console.debug(
                `[MACEVO API] ${method} ${config.baseURL}${config.url}`
            );
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


/* ============================================================
   RESPONSE INTERCEPTOR
============================================================ */

api.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        /*
         * Aucun response =
         * problème réseau, serveur inaccessible,
         * CORS, timeout, etc.
         */
        if (!error.response) {
            console.error(
                "=================================================="
            );

            console.error(
                "MACEVO API : ERREUR RÉSEAU"
            );

            console.error(
                "URL API :",
                normalizedBaseURL
            );

            console.error(
                "Message :",
                error.message
            );

            console.error(
                "Code :",
                error.code
            );

            console.error(
                "=================================================="
            );

            return Promise.reject(
                error
            );
        }

        const originalRequest =
            error.config;

        /*
         * On ne tente pas de refresh
         * pour les routes d'authentification.
         */
        const requestUrl =
            originalRequest?.url ||
            "";

        const isAuthRoute =
            requestUrl.includes(
                "/token/"
            ) ||
            requestUrl.includes(
                "/login/"
            ) ||
            requestUrl.includes(
                "/register/"
            ) ||
            requestUrl.includes(
                "/connexion/"
            );

        /*
         * Seul le 401 déclenche le refresh.
         *
         * _retry empêche une boucle infinie.
         */
        if (
            error.response.status !==
                401 ||
            isAuthRoute ||
            originalRequest?._retry
        ) {
            return Promise.reject(
                error
            );
        }

        originalRequest._retry = true;

        try {
            const newAccessToken =
                await getFreshAccessToken();

            originalRequest.headers =
                originalRequest.headers ||
                {};

            originalRequest.headers.Authorization =
                `Bearer ${newAccessToken}`;

            return api(
                originalRequest
            );
        } catch (
            refreshError
        ) {
            console.error(
                "MACEVO : session expirée.",
                refreshError
            );

            logout();

            /*
             * Éviter de rediriger si on est
             * déjà sur la page de connexion.
             */
            if (
                window.location.pathname !==
                "/connexion"
            ) {
                window.location.href =
                    "/connexion";
            }

            return Promise.reject(
                refreshError
            );
        }
    }
);


/* ============================================================
   FETCH NATIF AVEC AUTHENTIFICATION JWT
============================================================ */

/**
 * Fetch natif destiné notamment au streaming SSE.
 *
 * Contrairement à Axios :
 * - retourne une vraie Response native ;
 * - expose response.body ;
 * - permet response.body.getReader() ;
 * - ajoute le JWT ;
 * - tente un refresh automatique en cas de 401 ;
 * - rejoue la requête avec le nouveau token.
 *
 * Utilisation :
 *
 * fetchWithAuth(url, {
 *     method: "POST",
 *     headers: {
 *         Accept: "text/event-stream",
 *     },
 *     body: formData,
 * });
 */

export const fetchWithAuth = async (
    input,
    init = {}
) => {
    /* ========================================================
       URL
    ======================================================== */

    let url;
    let options;

    /*
     * Support :
     *
     * fetchWithAuth(url, options)
     *
     * et :
     *
     * fetchWithAuth({
     *     url,
     *     method,
     *     headers,
     *     body,
     * })
     */
    if (
        typeof input === "string"
    ) {
        url = input;

        options = {
            ...init,
        };
    } else if (
        input &&
        typeof input === "object"
    ) {
        url =
            input.url ||
            input.href ||
            "";

        options = {
            ...input,
        };

        delete options.url;
        delete options.href;
    } else {
        throw new Error(
            "URL de requête MACEVO invalide."
        );
    }


    /* ========================================================
       NORMALISATION URL
    ======================================================== */

    if (!url) {
        throw new Error(
            "URL de requête MACEVO manquante."
        );
    }

    /*
     * Si l'URL est relative,
     * on la rattache automatiquement
     * à l'API MACEVO.
     *
     * Exemples :
     *
     * "reports/"
     * "/reports/"
     *
     * deviennent :
     *
     * http://127.0.0.1:8000/api/reports/
     */
    if (
        !/^https?:\/\//i.test(url)
    ) {
        const apiOrigin = new URL(
            normalizedBaseURL,
            window.location.origin
        ).toString();

        url =
            new URL(
                url.replace(/^\/+/, ""),
                apiOrigin.endsWith("/")
                    ? apiOrigin
                    : `${apiOrigin}/`
            ).toString();
    }


    /* ========================================================
       FONCTION DE REQUÊTE
    ======================================================== */

    const executeFetch = async (
        accessToken
    ) => {
        const headers =
            new Headers(
                options.headers || {}
            );

        /*
         * JWT
         */
        if (accessToken) {
            headers.set(
                "Authorization",
                `Bearer ${accessToken}`
            );
        }

        /*
         * Ne jamais forcer Content-Type
         * pour FormData.
         *
         * Le navigateur doit créer automatiquement :
         *
         * multipart/form-data; boundary=...
         */
        if (
            typeof FormData !==
                "undefined" &&
            options.body instanceof FormData
        ) {
            headers.delete(
                "Content-Type"
            );
        }

        /*
         * Diagnostic utile en développement.
         */
        if (import.meta.env.DEV) {
            console.debug(
                `[MACEVO FETCH] ${
                    (
                        options.method ||
                        "GET"
                    ).toUpperCase()
                } ${url}`
            );
        }

        return fetch(
            url,
            {
                ...options,

                headers,

                credentials:
                    options.credentials ||
                    "include",
            }
        );
    };


    /* ========================================================
       PREMIÈRE TENTATIVE
    ======================================================== */

    let accessToken =
        getAccessToken();

    let response =
        await executeFetch(
            accessToken
        );


    /* ========================================================
       401 → REFRESH JWT
    ======================================================== */

    if (
        response.status === 401
    ) {
        /*
         * On tente exactement le même mécanisme
         * de renouvellement que pour Axios.
         */
        try {
            const newAccessToken =
                await refreshAccessToken();

            accessToken =
                newAccessToken;

            /*
             * Nouvelle tentative avec
             * le nouveau token.
             */
            response =
                await executeFetch(
                    accessToken
                );
        } catch (
            refreshError
        ) {
            console.error(
                "MACEVO FETCH : session expirée.",
                refreshError
            );

            logout();

            if (
                window.location.pathname !==
                "/connexion"
            ) {
                window.location.href =
                    "/connexion";
            }

            throw refreshError;
        }
    }


    /* ========================================================
       RETOUR RESPONSE NATIVE
    ======================================================== */

    return response;
};


/* ============================================================
   DIAGNOSTIC API
============================================================ */

export const apiConfig = {
    baseURL:
        normalizedBaseURL,

    timeout:
        REQUEST_TIMEOUT,
};


/* ============================================================
   EXPORT
============================================================ */

export default api;