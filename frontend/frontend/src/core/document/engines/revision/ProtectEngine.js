/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : ProtectEngine.js
 * Description : Protection du document.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class ProtectEngine {

    constructor() {

        this.protected = false;

        this.password = null;

        this.readOnly = false;

        this.allowCopy = true;

        this.allowPrint = true;

        this.allowExport = true;

    }

    /* ======================================================
       PROTECTION
    ====================================================== */

    enable(password = "") {

        this.protected = true;

        this.password = password;

    }

    disable(password = "") {

        if (

            this.password !== null &&

            this.password !== password

        ) {

            return false;

        }

        this.protected = false;

        this.password = null;

        return true;

    }

    toggle(password = "") {

        if (this.protected) {

            return this.disable(password);

        }

        this.enable(password);

        return true;

    }

    isProtected() {

        return this.protected;

    }

    /* ======================================================
       LECTURE SEULE
    ====================================================== */

    enableReadOnly() {

        this.readOnly = true;

    }

    disableReadOnly() {

        this.readOnly = false;

    }

    isReadOnly() {

        return this.readOnly;

    }

    /* ======================================================
       COPIE
    ====================================================== */

    allowCopying(value = true) {

        this.allowCopy = value;

    }

    canCopy() {

        return this.allowCopy;

    }

    /* ======================================================
       IMPRESSION
    ====================================================== */

    allowPrinting(value = true) {

        this.allowPrint = value;

    }

    canPrint() {

        return this.allowPrint;

    }

    /* ======================================================
       EXPORT
    ====================================================== */

    allowExporting(value = true) {

        this.allowExport = value;

    }

    canExport() {

        return this.allowExport;

    }

    /* ======================================================
       CONFIGURATION
    ====================================================== */

    getConfiguration() {

        return {

            protected: this.protected,

            readOnly: this.readOnly,

            allowCopy: this.allowCopy,

            allowPrint: this.allowPrint,

            allowExport: this.allowExport,

        };

    }

    /* ======================================================
       RESET
    ====================================================== */

    reset() {

        this.protected = false;

        this.password = null;

        this.readOnly = false;

        this.allowCopy = true;

        this.allowPrint = true;

        this.allowExport = true;

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const protectEngine = new ProtectEngine();

/* ==========================================================
   EXPORT
========================================================== */

export default protectEngine;