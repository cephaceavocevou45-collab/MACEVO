/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LatexPreview.js
 * Description : Aperçu des documents LaTeX.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class LatexPreview {

    constructor() {

        this.title = "Aperçu LaTeX";

    }

    /* ======================================================
       CONFIGURATION
    ====================================================== */

    configure(options = {}) {

        if (options.title) {

            this.title = options.title;

        }

    }

    /* ======================================================
       APERCU
    ====================================================== */

    open(content = "") {

        if (!content.trim()) {

            return {

                success: false,

                message: "Aucun contenu à afficher."

            };

        }

        const preview = window.open(

            "",

            "_blank",

            "noopener,noreferrer"

        );

        if (!preview) {

            return {

                success: false,

                message: "Impossible d'ouvrir la fenêtre d'aperçu."

            };

        }

        preview.document.open();

        preview.document.write(

            this.buildPage(content)

        );

        preview.document.close();

        return {

            success: true

        };

    }

    /* ======================================================
       PAGE HTML
    ====================================================== */

    buildPage(content) {

        return `<!DOCTYPE html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<title>${this.title}</title>

<style>

*{

box-sizing:border-box;

}

body{

margin:0;

background:#1e1e1e;

font-family:Consolas,"Courier New",monospace;

color:#f3f3f3;

}

header{

padding:15px 25px;

background:#111827;

border-bottom:1px solid #333;

display:flex;

justify-content:space-between;

align-items:center;

}

header h2{

margin:0;

font-size:18px;

}

button{

padding:8px 14px;

border:none;

border-radius:6px;

cursor:pointer;

background:#2563eb;

color:white;

font-weight:600;

}

button:hover{

background:#1d4ed8;

}

pre{

margin:0;

padding:25px;

white-space:pre-wrap;

word-break:break-word;

font-size:15px;

line-height:1.7;

overflow:auto;

}

</style>

</head>

<body>

<header>

<h2>${this.title}</h2>

<button onclick="copyCode()">

Copier

</button>

</header>

<pre id="latex">${this.escape(content)}</pre>

<script>

function copyCode(){

const text=document.getElementById("latex").innerText;

navigator.clipboard.writeText(text);

alert("Code LaTeX copié.");

}

</script>

</body>

</html>`;

    }

    /* ======================================================
       SECURITE HTML
    ====================================================== */

    escape(text) {

        return String(text)

            .replace(/&/g,"&amp;")

            .replace(/</g,"&lt;")

            .replace(/>/g,"&gt;")

            .replace(/"/g,"&quot;")

            .replace(/'/g,"&#039;");

    }

    /* ======================================================
       EXPORT
    ====================================================== */

    toJSON() {

        return {

            title:this.title

        };

    }

}

export default LatexPreview;