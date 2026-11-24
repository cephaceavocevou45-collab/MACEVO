/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexClipboard.js
 * Description : Gestion robuste du presse-papiers LaTeX
 * Version : 2.0.0
 * ==========================================================
 */

class LatexClipboard {

    /* ======================================================
       COPIER LE CODE LATEX
    ====================================================== */

    async copy(latex = "") {

        if (
            typeof latex !== "string" ||
            !latex.trim()
        ) {

            throw new Error(
                "Aucun code LaTeX à copier."
            );

        }


        /*
         * ==================================================
         * MÉTHODE MODERNE
         * ==================================================
         */

        if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function"
        ) {

            try {

                await navigator.clipboard.writeText(
                    latex
                );

                console.log(
                    "MACEVO CLIPBOARD — copie réussie avec navigator.clipboard"
                );

                return true;

            }

            catch (error) {

                console.warn(
                    "MACEVO CLIPBOARD — navigator.clipboard a échoué.",
                    error
                );

            }

        }


        /*
         * ==================================================
         * FALLBACK COMPATIBILITÉ NAVIGATEUR
         * ==================================================
         */

        try {

            const textarea =
                document.createElement("textarea");


            textarea.value =
                latex;


            textarea.setAttribute(
                "readonly",
                ""
            );


            textarea.style.position =
                "fixed";

            textarea.style.left =
                "-9999px";

            textarea.style.top =
                "0";

            textarea.style.opacity =
                "0";


            document.body.appendChild(
                textarea
            );


            textarea.focus();

            textarea.select();


            const successful =
                document.execCommand(
                    "copy"
                );


            document.body.removeChild(
                textarea
            );


            if (!successful) {

                throw new Error(
                    "La commande de copie du navigateur a échoué."
                );

            }


            console.log(
                "MACEVO CLIPBOARD — copie réussie avec le fallback."
            );


            return true;

        }

        catch (error) {

            console.error(
                "MACEVO CLIPBOARD — échec complet de la copie.",
                error
            );


            throw new Error(
                "Impossible de copier le code LaTeX dans le presse-papiers."
            );

        }

    }

}


const latexClipboard =
    new LatexClipboard();


export default latexClipboard;