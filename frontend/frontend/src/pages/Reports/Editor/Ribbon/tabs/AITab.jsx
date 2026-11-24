/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : AITab.jsx
 * Version : 1.0.0
 * Statut  : Stable
 * ==========================================================
 */

import {

    Sparkles,

    Wand2,

    FilePenLine,

    Languages,

    BookOpenCheck,

    BrainCircuit,

    MessageSquareText,

    Search,

} from "lucide-react";

import RibbonButton from "../components/buttons/RibbonButton";

import RibbonGroup from "../components/RibbonGroup";

import RibbonDivider from "../components/RibbonDivider";

import { useEditorContext } from "../../EditorContext";

/* ==========================================================
   COMPOSANT
========================================================== */

function AITab() {

    const { editor } = useEditorContext();

    if (!editor) {

        return null;

    }

    return (

        <div

            className="
                flex
                items-stretch
                overflow-x-auto
                px-2
                py-1
                bg-white
            "
            
            >            {/* =====================================  
        {/* =====================================
                RÉDACTION 
            ====================================== */}

            <RibbonGroup title="Rédaction">

                <RibbonButton

                    icon={<Sparkles />}

                    label="Améliorer"

                    tooltip="Améliorer le texte avec l'IA"

                />

                <RibbonButton

                    icon={<FilePenLine />}

                    label="Réécrire"

                    tooltip="Réécrire la sélection"

                />

                <RibbonButton

                    icon={<Wand2 />}

                    label="Résumer"

                    tooltip="Créer un résumé"

                />

            </RibbonGroup> 

            {/* =====================================
                LANGUES
            ====================================== */}

            <RibbonGroup title="Langues">

                <RibbonButton

                    icon={<Languages />}

                    label="Traduire"

                    tooltip="Traduire le document"

                />

            </RibbonGroup>
          
            {/* =====================================
                ASSISTANT
            ====================================== */}

            <RibbonGroup title="Assistant">

                <RibbonButton

                    icon={<BrainCircuit />}

                    label="Assistant"

                    tooltip="Ouvrir l'assistant IA"

                />

                <RibbonButton

                    icon={<MessageSquareText />}

                    label="Discussion"

                    tooltip="Discuter avec l'IA"

                />

                <RibbonButton

                    icon={<Search />}

                    label="Recherche"

                    tooltip="Recherche intelligente"

                />

                <RibbonButton

                    icon={<BookOpenCheck />}

                    label="Vérifier"

                    tooltip="Vérifier les références"

                />

            </RibbonGroup> </div>

    );

}
export default AITab;   