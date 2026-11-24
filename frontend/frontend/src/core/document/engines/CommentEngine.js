/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : CommentEngine.js
 * Description : Gestion complète des commentaires.
 * Version : 2.0.0
 * Statut : Stable
 * ============================================================
 */

class CommentEngine {

    constructor() {

        this.reset();

    }

    /* ======================================================
       ETAT
    ====================================================== */

    reset() {

        this.comments = [];

        this.currentId = 1;

        this.visible = true;

        this.activeComment = null;

    }

    /* ======================================================
       AJOUT
    ====================================================== */

    addComment(selection, content, author = "Utilisateur") {

        const comment = {

            id: this.currentId++,

            selection,

            content,

            author,

            replies: [],

            resolved: false,

            createdAt: new Date(),

            updatedAt: new Date(),

        };

        this.comments.push(comment);

        this.activeComment = comment.id;

        return comment;

    }

    /* ======================================================
       REPONSE
    ====================================================== */

    reply(commentId, content, author = "Utilisateur") {

        const comment = this.getComment(commentId);

        if (!comment) return;

        comment.replies.push({

            id: Date.now(),

            author,

            content,

            createdAt: new Date(),

        });

        comment.updatedAt = new Date();

    }

    /* ======================================================
       MODIFICATION
    ====================================================== */

    updateComment(commentId, content) {

        const comment = this.getComment(commentId);

        if (!comment) return;

        comment.content = content;

        comment.updatedAt = new Date();

    }

    /* ======================================================
       RECHERCHE
    ====================================================== */

    getComment(commentId) {

        return this.comments.find(

            comment => comment.id === commentId

        );

    }

    getComments() {

        return this.comments;

    }

    /* ======================================================
       SUPPRESSION
    ====================================================== */

    deleteComment(commentId) {

        this.comments = this.comments.filter(

            comment => comment.id !== commentId

        );

    }

    deleteAll() {

        this.comments = [];

    }

    /* ======================================================
       RESOLUTION
    ====================================================== */

    resolve(commentId) {

        const comment = this.getComment(commentId);

        if (!comment) return;

        comment.resolved = true;

        comment.updatedAt = new Date();

    }

    reopen(commentId) {

        const comment = this.getComment(commentId);

        if (!comment) return;

        comment.resolved = false;

        comment.updatedAt = new Date();

    }

    /* ======================================================
       NAVIGATION
    ====================================================== */

    nextComment() {

        if (!this.comments.length) return null;

        const index = this.comments.findIndex(

            c => c.id === this.activeComment

        );

        const next =

            this.comments[(index + 1) % this.comments.length];

        this.activeComment = next.id;

        return next;

    }

    previousComment() {

        if (!this.comments.length) return null;

        const index = this.comments.findIndex(

            c => c.id === this.activeComment

        );

        const previous =

            this.comments[
                (index - 1 + this.comments.length) %
                this.comments.length
            ];

        this.activeComment = previous.id;

        return previous;

    }

    /* ======================================================
       VISIBILITE
    ====================================================== */

    show() {

        this.visible = true;

    }

    hide() {

        this.visible = false;

    }

    toggle() {

        this.visible = !this.visible;

    }

    isVisible() {

        return this.visible;

    }

    /* ======================================================
       EXPORT
    ====================================================== */

    exportComments() {

        return JSON.stringify(

            this.comments,

            null,

            2

        );

    }

    importComments(json) {

        try {

            this.comments = JSON.parse(json);

        }

        catch {

            console.error(

                "Import des commentaires impossible."

            );

        }

    }

    /* ======================================================
       STATISTIQUES
    ====================================================== */

    count() {

        return this.comments.length;

    }

    resolvedCount() {

        return this.comments.filter(

            comment => comment.resolved

        ).length;

    }

    unresolvedCount() {

        return this.comments.filter(

            comment => !comment.resolved

        ).length;

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const commentEngine = new CommentEngine();

export default commentEngine;