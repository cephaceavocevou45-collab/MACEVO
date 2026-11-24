/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : DocumentGroup.jsx
 * Description : Groupe Document du ruban MACEVO.
 * Version : 7.0.0
 * Statut  : Frontend autonome — stockage local temporaire
 * ==========================================================
 */

import {
    FilePlus,
    FolderOpen,
    Save,
    Printer,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";


/* ==========================================================
   CONSTANTES
   ========================================================== */

const STORAGE_KEY = "macevo_local_documents";

const CURRENT_DOCUMENT_KEY =
    "macevo_current_document";


/* ==========================================================
   OUTILS LOCAL STORAGE
   ========================================================== */

function getLocalDocuments() {
    try {
        const stored =
            localStorage.getItem(STORAGE_KEY);

        if (!stored) {
            return [];
        }

        const documents =
            JSON.parse(stored);

        return Array.isArray(documents)
            ? documents
            : [];

    } catch (error) {
        console.error(
            "MACEVO : erreur lors de la lecture des documents locaux.",
            error
        );

        return [];
    }
}


function saveLocalDocuments(documents) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(documents)
        );

        return true;

    } catch (error) {
        console.error(
            "MACEVO : erreur lors de la sauvegarde locale.",
            error
        );

        return false;
    }
}


/* ==========================================================
   DOCUMENT GROUP
   ========================================================== */

function DocumentGroup({ editor }) {

    if (!editor) {
        return null;
    }


    /* ======================================================
       NOUVEAU DOCUMENT
       ====================================================== */

    const handleNewDocument = () => {

        const confirmed =
            window.confirm(
                "Créer un nouveau document ?\n\n" +
                "Le contenu actuellement affiché sera effacé."
            );

        if (!confirmed) {
            return;
        }


        /* ----------------------------------------------
           Nettoyage de l'éditeur
           ---------------------------------------------- */

        editor
            .chain()
            .focus()
            .clearContent()
            .run();


        /* ----------------------------------------------
           Réinitialisation du document courant
           ---------------------------------------------- */

        try {
            localStorage.removeItem(
                CURRENT_DOCUMENT_KEY
            );

        } catch (error) {
            console.error(
                "MACEVO : impossible de réinitialiser le document courant.",
                error
            );
        }


        /* ----------------------------------------------
           Notification
           ---------------------------------------------- */

        window.alert(
            "Nouveau document créé."
        );
    };


    /* ======================================================
       OUVRIR DOCUMENT
       ====================================================== */

    const handleOpenDocument = () => {

        const documents =
            getLocalDocuments();


        /* ----------------------------------------------
           Aucun document
           ---------------------------------------------- */

        if (documents.length === 0) {

            window.alert(
                "Aucun document enregistré localement."
            );

            return;
        }


        /* ----------------------------------------------
           Liste des documents
           ---------------------------------------------- */

        const documentList =
            documents
                .map((document, index) => {

                    const title =
                        document.title ||
                        "Document sans titre";

                    const date =
                        document.updatedAt
                            ? new Date(
                                document.updatedAt
                            ).toLocaleString("fr-FR")
                            : "Date inconnue";

                    return (
                        `${index + 1}. ${title} — ${date}`
                    );
                })
                .join("\n");


        /* ----------------------------------------------
           Sélection
           ---------------------------------------------- */

        const answer =
            window.prompt(
                "Documents disponibles :\n\n" +
                documentList +
                "\n\n" +
                "Entrez le numéro du document à ouvrir :"
            );


        if (answer === null) {
            return;
        }


        const index =
            Number(answer) - 1;


        /* ----------------------------------------------
           Validation
           ---------------------------------------------- */

        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= documents.length
        ) {

            window.alert(
                "Numéro de document invalide."
            );

            return;
        }


        const selectedDocument =
            documents[index];


        if (
            !selectedDocument ||
            typeof selectedDocument.content !== "string"
        ) {

            window.alert(
                "Le document sélectionné ne contient aucun contenu valide."
            );

            return;
        }


        /* ----------------------------------------------
           Injection dans Tiptap
           ---------------------------------------------- */

        try {

            editor
                .chain()
                .focus()
                .setContent(
                    selectedDocument.content
                )
                .run();

        } catch (error) {

            console.error(
                "MACEVO : erreur lors de l'ouverture du document.",
                error
            );

            window.alert(
                "Impossible d'ouvrir ce document."
            );

            return;
        }


        /* ----------------------------------------------
           Mémorisation
           ---------------------------------------------- */

        try {

            localStorage.setItem(
                CURRENT_DOCUMENT_KEY,
                JSON.stringify(
                    selectedDocument
                )
            );

        } catch (error) {

            console.error(
                "MACEVO : impossible de mémoriser le document courant.",
                error
            );
        }


        window.alert(
            `Document "${selectedDocument.title || "sans titre"}" ouvert.`
        );
    };


    /* ======================================================
       ENREGISTRER
       ====================================================== */

    const handleSaveDocument = () => {

        /* ----------------------------------------------
           Récupération du contenu
           ---------------------------------------------- */

        const content =
            editor.getHTML();


        /* ----------------------------------------------
           Récupération du document courant
           ---------------------------------------------- */

        let currentDocument = null;

        try {

            const stored =
                localStorage.getItem(
                    CURRENT_DOCUMENT_KEY
                );

            if (stored) {

                currentDocument =
                    JSON.parse(stored);
            }

        } catch (error) {

            console.error(
                "MACEVO : erreur lecture du document courant.",
                error
            );
        }


        /* ----------------------------------------------
           Titre
           ---------------------------------------------- */

        const existingTitle =
            currentDocument?.title || "";


        const title =
            window.prompt(
                "Nom du document :",
                existingTitle ||
                    "Nouveau document"
            );


        if (title === null) {
            return;
        }


        const cleanTitle =
            title.trim();


        if (!cleanTitle) {

            window.alert(
                "Le document doit avoir un nom."
            );

            return;
        }


        /* ----------------------------------------------
           Documents existants
           ---------------------------------------------- */

        const documents =
            getLocalDocuments();


        /* ----------------------------------------------
           Identifiant
           ---------------------------------------------- */

        const documentId =
            currentDocument?.id ||
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 9)}`;


        /* ----------------------------------------------
           Objet document
           ---------------------------------------------- */

        const documentToSave = {

            id: documentId,

            title: cleanTitle,

            content,

            updatedAt:
                new Date().toISOString(),

        };


        /* ----------------------------------------------
           Recherche du document existant
           ---------------------------------------------- */

        const existingIndex =
            documents.findIndex(
                (document) =>
                    document.id ===
                    documentId
            );


        if (existingIndex >= 0) {

            documents[existingIndex] =
                documentToSave;

        } else {

            documents.push(
                documentToSave
            );
        }


        /* ----------------------------------------------
           Sauvegarde
           ---------------------------------------------- */

        const saved =
            saveLocalDocuments(
                documents
            );


        if (!saved) {

            window.alert(
                "Impossible d'enregistrer le document localement."
            );

            return;
        }


        /* ----------------------------------------------
           Document courant
           ---------------------------------------------- */

        try {

            localStorage.setItem(
                CURRENT_DOCUMENT_KEY,
                JSON.stringify(
                    documentToSave
                )
            );

        } catch (error) {

            console.error(
                "MACEVO : impossible de mémoriser le document courant.",
                error
            );
        }


        window.alert(
            `Document "${cleanTitle}" enregistré.`
        );
    };


    /* ======================================================
       IMPRIMER
       ====================================================== */

    const handlePrintDocument = () => {

        /*
         * Le système d'impression du navigateur
         * utilisera les règles @media print de MACEVO.
         */

        window.print();
    };


    /* ======================================================
       RENDU
       ====================================================== */

    return (

        <RibbonGroup title="Document">

            <div
                className="
                    flex
                    items-center
                    gap-1
                    h-full
                "
            >

                {/* ------------------------------------------
                   NOUVEAU
                   ------------------------------------------ */}

                <RibbonButton
                    icon={FilePlus}
                    label="Nouveau"
                    tooltip="Créer un nouveau document"
                    onClick={
                        handleNewDocument
                    }
                />


                {/* ------------------------------------------
                   OUVRIR
                   ------------------------------------------ */}

                <RibbonButton
                    icon={FolderOpen}
                    label="Ouvrir"
                    tooltip="Ouvrir un document enregistré localement"
                    onClick={
                        handleOpenDocument
                    }
                />


                {/* ------------------------------------------
                   ENREGISTRER
                   ------------------------------------------ */}

                <RibbonButton
                    icon={Save}
                    label="Enregistrer"
                    tooltip="Enregistrer le document localement"
                    onClick={
                        handleSaveDocument
                    }
                />


                {/* ------------------------------------------
                   IMPRIMER
                   ------------------------------------------ */}

                <RibbonButton
                    icon={Printer}
                    label="Imprimer"
                    tooltip="Imprimer le document"
                    onClick={
                        handlePrintDocument
                    }
                />

            </div>

        </RibbonGroup>

    );
}


export default DocumentGroup;