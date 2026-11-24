/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : useWatermarkEngine.js
 * Description : Gestion des filigranes du document.
 * Version : 1.0.0
 * Statut : Foundation
 * ===========================================================
 */

export function useWatermarkEngine() {

    /* ======================================================
     * ÉTAT
     * ====================================================== */

    const state = {

        enabled: false,

        type: null,

        text: "",

        image: null,

        opacity: 0.15,

        rotation: -45,

        fontFamily: "Arial",

        fontSize: 48,

        color: "#999999",

        position: "center",

        scale: 1,

    };

    /* ======================================================
     * FILIGRANE TEXTE
     * ====================================================== */

    function insertText(text) {

    }

    function updateText(text) {

    }

    /* ======================================================
     * FILIGRANE IMAGE
     * ====================================================== */

    function insertImage(image) {

    }

    function replaceImage(image) {

    }

    /* ======================================================
     * APPARENCE
     * ====================================================== */

    function setOpacity(opacity) {

    }

    function setRotation(angle) {

    }

    function setScale(scale) {

    }

    function setColor(color) {

    }

    function setFontFamily(font) {

    }

    function setFontSize(size) {

    }

    function setPosition(position) {

    }

    /* ======================================================
     * VISIBILITÉ
     * ====================================================== */

    function show() {

    }

    function hide() {

    }

    function toggle() {

    }

    /* ======================================================
     * SUPPRESSION
     * ====================================================== */

    function remove() {

    }

    function reset() {

    }

    /* ======================================================
     * API PUBLIQUE
     * ====================================================== */

    return {

        state,

        insertText,

        updateText,

        insertImage,

        replaceImage,

        setOpacity,

        setRotation,

        setScale,

        setColor,

        setFontFamily,

        setFontSize,

        setPosition,

        show,

        hide,

        toggle,

        remove,

        reset,

    };

}