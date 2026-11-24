/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier  : PagesGroup.jsx
 * Version  : 2.0.0
 * Statut   : Gestion des pages et sauts de page
 * ===========================================================
 */

import { FilePlus2, FileText, Scissors } from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

function PagesGroup({ editor }) {
    if (!editor) {
        return null;
    }

    /**
     * Insère un saut de page compatible
     * avec le moteur de pagination actuel.
     */
    const insertPageBreak = () => {
        editor
            .chain()
            .focus()
            .insertContent('<p class="rm-page-break"></p>')
            .run();
    };

    /**
     * Insère un saut de page suivi d'un
     * paragraphe vide permettant de continuer
     * directement sur la nouvelle page.
     */
    const insertNewPage = () => {
        editor
            .chain()
            .focus()
            .insertContent(
                '<p class="rm-page-break"></p><p></p>'
            )
            .run();
    };

    /**
     * Insère un saut de page à la position
     * courante de la sélection.
     */
    const insertPageBefore = () => {
        const { from } = editor.state.selection;

        const position = Math.max(
            1,
            Math.min(from, editor.state.doc.content.size)
        );

        editor
            .chain()
            .focus()
            .insertContentAt(
                position,
                '<p class="rm-page-break"></p>'
            )
            .run();
    };

    return (
        <RibbonGroup title="Pages">
            <RibbonButton
                icon={Scissors}
                label="Saut"
                tooltip="Insérer un saut de page"
                onClick={insertPageBreak}
            />

            <RibbonButton
                icon={FilePlus2}
                label="Nouvelle"
                tooltip="Créer une nouvelle page à partir de la position actuelle"
                onClick={insertNewPage}
            />

            <RibbonButton
                icon={FileText}
                label="Avant"
                tooltip="Insérer un saut de page à la position actuelle"
                onClick={insertPageBefore}
            />
        </RibbonGroup>
    );
}

export default PagesGroup;