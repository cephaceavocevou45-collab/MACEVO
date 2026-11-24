/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : CloudGroup.jsx
 * Description : Groupe Cloud du ruban MACEVO.
 * Version : 3.0.0
 * Statut  : Fonctionnel — sécurisé côté interface
 * ==========================================================
 */

import {
    Cloud,
    Upload,
    Download,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import cloudEngine from "../../../../../core/document/engines/export/CloudEngine";


function CloudGroup() {
    const { editor } = useEditorContext();

    if (!editor) {
        return null;
    }

    /* ======================================================
       CONNECTER AU CLOUD
       ====================================================== */

    async function connectCloud() {
        try {
            await cloudEngine.connect();

            window.alert(
                "Connexion au Cloud effectuée."
            );
        } catch (error) {
            console.error(
                "MACEVO : impossible de se connecter au Cloud.",
                error
            );

            window.alert(
                "Impossible de se connecter au Cloud."
            );
        }
    }


    /* ======================================================
       ENVOYER VERS LE CLOUD
       ====================================================== */

    async function uploadCloud() {
        try {
            const html = editor.getHTML();

            if (!html || !html.trim()) {
                window.alert(
                    "Le document est vide."
                );

                return;
            }

            await cloudEngine.upload(html);

            window.alert(
                "Document envoyé vers le Cloud."
            );
        } catch (error) {
            console.error(
                "MACEVO : impossible d'envoyer le document vers le Cloud.",
                error
            );

            window.alert(
                "Impossible d'envoyer le document vers le Cloud."
            );
        }
    }


    /* ======================================================
       RÉCUPÉRER DEPUIS LE CLOUD
       ====================================================== */

    async function downloadCloud() {
        try {
            const content =
                await cloudEngine.download();

            if (
                content === null ||
                content === undefined ||
                content === ""
            ) {
                window.alert(
                    "Aucun contenu n'a été récupéré depuis le Cloud."
                );

                return;
            }

            editor.commands.setContent(
                content
            );
        } catch (error) {
            console.error(
                "MACEVO : impossible de récupérer le document depuis le Cloud.",
                error
            );

            window.alert(
                "Impossible de récupérer le document depuis le Cloud."
            );
        }
    }


    /* ======================================================
       RENDU
       ====================================================== */

    return (
        <RibbonGroup title="Cloud">

            <RibbonButton
                icon={Cloud}
                label="Connecter"
                tooltip="Se connecter au Cloud"
                onClick={connectCloud}
            />

            <RibbonButton
                icon={Upload}
                label="Envoyer"
                tooltip="Envoyer le document vers le Cloud"
                onClick={uploadCloud}
            />

            <RibbonButton
                icon={Download}
                label="Récupérer"
                tooltip="Récupérer le document depuis le Cloud"
                onClick={downloadCloud}
            />

        </RibbonGroup>
    );
}


export default CloudGroup;