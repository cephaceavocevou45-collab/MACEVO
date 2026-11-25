/**
 * ============================================================
 * MACEVO
 *
 * Fichier : LatexApi.js
 * Description : API de communication avec le compilateur LaTeX
 * Version : 3.0.0
 * ============================================================
 */

class LatexApi {

    constructor() {

        const apiBaseURL = (
            import.meta.env.VITE_API_BASE_URL ||
            "/api/"
        ).replace(/\/+$/, "");

        this.baseURL = `${apiBaseURL}/latex`;

    }


    /* ======================================================
       COMPILATION
    ====================================================== */

    async compile(latex = "", assets = []) {

        const response =
            await fetch(

                `${this.baseURL}/compile`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({ latex, assets })

                }

            );


        if (!response.ok) {

            let message =
                "Impossible de contacter le compilateur LaTeX.";

            try {

                const error =
                    await response.json();

                message =
                    error?.message ??
                    error?.error ??
                    message;

            }

            catch {

                // Réponse non JSON.
            }


            throw new Error(
                message
            );

        }


        const result =
            await response.json();


        /*
         * Si la compilation a réussi et que
         * le backend fournit un compilationId,
         * on construit toujours l'URL HTTP du PDF.
         */

        if (

            result?.success &&

            result?.compilationId

        ) {

            result.pdf =
                this.getPdfUrl(
                    result.compilationId
                );

        }


        return result;

    }


    /* ======================================================
       URL PDF
    ====================================================== */

    getPdfUrl(id) {

        if (!id) {

            return null;

        }

        return `${this.baseURL}/pdf/${encodeURIComponent(id)}`;

    }


    /* ======================================================
       TELECHARGEMENT PDF
    ====================================================== */

    async downloadPdf(id) {

        return this.getPdfUrl(id);

    }


    /* ======================================================
       LOGS
    ====================================================== */

    async logs(id) {

        if (!id) {

            return [];

        }


        const response =
            await fetch(

                `${this.baseURL}/logs/${encodeURIComponent(id)}`

            );


        if (!response.ok) {

            throw new Error(
                "Impossible de récupérer les logs."
            );

        }


        return await response.json();

    }


    /* ======================================================
       ETAT DU SERVEUR
    ====================================================== */

    async ping() {

        try {

            const response =
                await fetch(

                    `${this.baseURL}/ping`

                );

            return response.ok;

        }

        catch {

            return false;

        }

    }

}


const latexApi =
    new LatexApi();


export default latexApi;
