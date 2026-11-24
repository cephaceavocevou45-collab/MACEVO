/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : EditorAdapter.js
 * Version : 1.0.0
 *
 * Rôle :
 * Couche d'abstraction entre le moteur documentaire
 * et l'éditeur Tiptap.
 *
 * Toute interaction avec Tiptap passera par cette classe.
 * ==========================================================
 */

class EditorAdapter {

    constructor(editor = null) {

        this.editor = editor;

    }

    /**
     * Définit l'éditeur courant.
     */
    setEditor(editor) {

        this.editor = editor;

    }

    /**
     * Retourne l'éditeur courant.
     */
    getEditor() {

        return this.editor;

    }

    /**
     * Vérifie qu'un éditeur est disponible.
     */
    hasEditor() {

        return this.editor !== null;

    }

}

export default EditorAdapter;