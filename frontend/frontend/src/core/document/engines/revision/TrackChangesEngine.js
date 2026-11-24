/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : TrackChangesEngine.js
 * Description : Gestion du suivi des modifications.
 * Version : 1.0.0
 * Statut : Stable
 * ============================================================
 */

class TrackChangesEngine {

    constructor() {

        this.enabled = false;

        this.changes = [];

        this.currentId = 1;

    }

    /* ======================================================
       ACTIVATION
    ====================================================== */

    enable() {

        this.enabled = true;

    }

    disable() {

        this.enabled = false;

    }

    toggle() {

        this.enabled = !this.enabled;

    }

    isEnabled() {

        return this.enabled;

    }

    /* ======================================================
       AJOUT
    ====================================================== */

    addChange({

        type,

        author,

        oldValue,

        newValue,

        position,

    }) {

        if (!this.enabled) {

            return null;

        }

        const change = {

            id: this.currentId++,

            type,

            author,

            oldValue,

            newValue,

            position,

            accepted: false,

            rejected: false,

            createdAt: new Date(),

        };

        this.changes.push(change);

        return change;

    }

    /* ======================================================
       LECTURE
    ====================================================== */

    getChanges() {

        return this.changes;

    }

    getChange(id) {

        return this.changes.find(

            (change) => change.id === id

        );

    }

    count() {

        return this.changes.length;

    }

    hasChanges() {

        return this.changes.length > 0;

    }

    /* ======================================================
       VALIDATION
    ====================================================== */

    accept(id) {

        const change = this.getChange(id);

        if (!change) return;

        change.accepted = true;

        change.rejected = false;

    }

    reject(id) {

        const change = this.getChange(id);

        if (!change) return;

        change.accepted = false;

        change.rejected = true;

    }

    acceptAll() {

        this.changes.forEach((change) => {

            change.accepted = true;

            change.rejected = false;

        });

    }

    rejectAll() {

        this.changes.forEach((change) => {

            change.accepted = false;

            change.rejected = true;

        });

    }

    /* ======================================================
       SUPPRESSION
    ====================================================== */

    remove(id) {

        this.changes = this.changes.filter(

            (change) => change.id !== id

        );

    }

    clear() {

        this.changes = [];

        this.currentId = 1;

    }

    /* ======================================================
       EXPORT
    ====================================================== */

    export() {

        return JSON.stringify(

            this.changes,

            null,

            2

        );

    }

    import(data) {

        try {

            this.changes = JSON.parse(data);

        }

        catch {

            this.clear();

        }

    }

}

const trackChangesEngine =

    new TrackChangesEngine();

export default trackChangesEngine;