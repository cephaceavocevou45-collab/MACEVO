/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : ShareEngine.js
 * Version : 1.0.0
 * Statut : Fonctionnel
 * ============================================================
 */

class ShareEngine {
    constructor() {
        this.baseUrl = window.location.origin;
    }

    async share(content) {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "Document Macevo",
                    text: "Découvrez ce document créé sur Macevo.",
                    url: window.location.href,
                });
                return true;
            } else {
                return await this.link(content);
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Erreur lors du partage :", error);
                alert("Impossible de partager le document.");
            }
            return false;
        }
    }

    async email(content) {
        try {
            const subject = encodeURIComponent("Document Macevo");
            const body = encodeURIComponent("Voici un document partagé depuis l'éditeur Macevo :\n\n" + this.stripHtml(content));
            
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
            return true;
        } catch (error) {
            console.error("Erreur lors de l'envoi par e-mail :", error);
            alert("Impossible d'ouvrir le client de messagerie.");
            return false;
        }
    }

    async link(content) {
        try {
            const shareableUrl = window.location.href;
            await navigator.clipboard.writeText(shareableUrl);
            alert("Lien de partage copié dans le presse-papier !");
            return shareableUrl;
        } catch (error) {
            console.error("Erreur lors de la génération du lien :", error);
            alert("Impossible de copier le lien.");
            return null;
        }
    }

    stripHtml(html) {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }
}

const shareEngine = new ShareEngine();
export default shareEngine;