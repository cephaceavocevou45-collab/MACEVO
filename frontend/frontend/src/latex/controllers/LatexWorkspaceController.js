/**
 * ==========================================================
 * MACEVO
 *
 * ----------------------------------------------------------
 * Fichier : LatexWorkspaceController.js
 * Description : Contrôleur principal du Workspace LaTeX
 * Version : 7.0.0
 * Statut : Stable
 * ==========================================================
 */

import latexSyncService
    from "../services/LatexSyncService";


class LatexWorkspaceController {


    /* ======================================================
       SYNCHRONISATION
    ====================================================== */

    async synchronize(context) {

        return await latexSyncService.synchronize(

            context

        );

    }


    /* ======================================================
       NOUVEAU PROJET
    ====================================================== */

    newProject(context) {

        return latexSyncService.newProject(

            context

        );

    }


    /* ======================================================
       COMPILATION
    ====================================================== */

    async compile(context) {

        return await latexSyncService.compile(

            context

        );

    }


    /* ======================================================
       MISE À JOUR DU CODE LATEX
    ====================================================== */

    async updateLatex(

        latex,

        context

    ) {

        return await latexSyncService.updateLatex(

            latex,

            context

        );

    }


    /* ======================================================
       SYNCHRONISATION DOCUMENT → LATEX
    ====================================================== */

    async updateDocument(

        document,

        context

    ) {

        return await latexSyncService.updateDocument(

            document,

            context

        );

    }


    /* ======================================================
       COPIER LE CODE LATEX
    ====================================================== */

    async copyLatex(context) {

        return await latexSyncService.copyLatex(

            context

        );

    }


    /* ======================================================
       TÉLÉCHARGER LE CODE LATEX
    ====================================================== */

    downloadTex(context) {

        return latexSyncService.downloadTex(

            context

        );

    }


    /* ======================================================
       TÉLÉCHARGER LE PDF
    ====================================================== */

    downloadPdf(context) {

        return latexSyncService.downloadPdf(

            context

        );

    }


    /* ======================================================
       ENREGISTRER
    ====================================================== */

    save(context) {

        return latexSyncService.saveProject(

            context

        );

    }


    /* ======================================================
       OUVRIR
    ====================================================== */

    async open(context) {

        return await latexSyncService.openProject(

            context

        );

    }


    /* ======================================================
       GESTION DES PACKAGES
    ====================================================== */

    packages(context) {

        return latexSyncService.addInfo(

            "Ouverture du gestionnaire de packages.",

            context

        );

    }


    /* ======================================================
       PARAMÈTRES
    ====================================================== */

    settings(context) {

        return latexSyncService.addInfo(

            "Ouverture des paramètres.",

            context

        );

    }


    /* ======================================================
       RÉINITIALISATION
    ====================================================== */

    reset(context) {

        return latexSyncService.reset(

            context

        );

    }

}


/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const latexWorkspaceController =
    new LatexWorkspaceController();


export default latexWorkspaceController;