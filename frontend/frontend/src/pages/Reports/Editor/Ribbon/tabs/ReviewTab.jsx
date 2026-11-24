/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : ReviewTab.jsx
 * Version : 3.2.0
 * Statut  : Professionnel (Conteneur du ruban Révision unifié)
 * ===========================================================
 */

import RibbonDivider from "../components/RibbonDivider";

import SpellingGroup from "../groups/SpellingGroup";
import GrammarGroup from "../groups/GrammarGroup";
import DictionaryGroup from "../groups/DictionaryGroup";
import TranslateGroup from "../groups/TranslateGroup";

import TrackChangesGroup from "../groups/TrackChangesGroup";
import CompareGroup from "../groups/CompareGroup";
import ProtectGroup from "../groups/ProtectGroup";
import ReadabilityGroup from "../groups/ReadabilityGroup";
import AccessibilityGroup from "../groups/AccessibilityGroup";

import CommentsGroup from "../groups/CommentsGroup";

import DefinitionGroup from "../groups/DefinitionGroup";
import GrammarCustomGroup from "../groups/GrammarCustomGroup";
import VocabGroup from "../groups/VocabGroup";

import { useEditorContext } from "../../EditorContext";

/* ==========================================================
    COMPOSANT
========================================================== */

function ReviewTab() {
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
                gap-1
                select-none
            "
        >
            {/* ==================== ORTHOGRAPHE ==================== */}
            <SpellingGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== GRAMMAIRE ==================== */}
            <GrammarGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== DICTIONNAIRE ==================== */}
            <DictionaryGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== TRADUCTION ==================== */}
            <TranslateGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== DÉFINITION ==================== */}
            <DefinitionGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== GRAMMAIRE (PERSONNALISÉ) ==================== */}
            <GrammarCustomGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== VOCABULAIRE ==================== */}
            <VocabGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== COMMENTAIRES ==================== */}
            <CommentsGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== SUIVI DES MODIFICATIONS ==================== */}
            <TrackChangesGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== COMPARAISON ==================== */}
            <CompareGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== PROTECTION ==================== */}
            <ProtectGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== LISIBILITÉ ==================== */}
            <ReadabilityGroup editor={editor} />

            <RibbonDivider />

            {/* ==================== ACCESSIBILITÉ ==================== */}
            <AccessibilityGroup editor={editor} />
        </div>
    );
}

export default ReviewTab;