/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : ScienceGroup.jsx
 * Rôle    : Ruban scientifique et mathématique
 * Version : 13.0.1
 * Statut  : Correction compatibilité Lucide
 * ===========================================================
 */

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import {
    FunctionSquare,
    Sigma,
    Superscript,
    Subscript,
    Calculator,
    Brackets,
    Code2,
    Quote,
    BookmarkPlus,
    Atom,
} from "lucide-react";

export default function ScienceGroup({ editor }) {
    if (!editor) {
        return null;
    }

    /**
     * ---------------------------------------------------------
     * MOTEUR MATHÉMATIQUE MACEVO
     * ---------------------------------------------------------
     *
     * Toutes les expressions sont insérées comme MathNode.
     */
    const insertMath = (latex) => {
        if (!latex) return;

        editor
            .chain()
            .focus()
            .insertMath(latex)
            .run();
    };

    /**
     * ---------------------------------------------------------
     * MATHÉMATIQUES
     * ---------------------------------------------------------
     */

    // Équation
    const insertEquation = () => {
        insertMath("\\sum_{i=1}^{n} x_i");
    };

    // Fraction
    const insertFraction = () => {
        insertMath("\\frac{a}{b}");
    };

    // Racine
    const insertRoot = () => {
        insertMath("\\sqrt{x}");
    };

    // Puissance
    const insertPower = () => {
        insertMath("x^{2}");
    };

    // Indice
    const insertIndex = () => {
        insertMath("x_{i}");
    };

    // Intégrale
    const insertIntegral = () => {
        insertMath("\\int_{a}^{b} f(x)\\,dx");
    };

    // Somme
    const insertSum = () => {
        insertMath("\\sum_{i=1}^{n} x_i");
    };

    // Limite
    const insertLimit = () => {
        insertMath("\\lim_{x\\to\\infty} f(x)");
    };

    // Matrice
    const insertMatrix = () => {
        insertMath(
            "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}"
        );
    };

    // Symboles scientifiques
    const insertSymbols = () => {
        insertMath(
            "\\alpha + \\beta + \\gamma + \\Delta + \\Omega"
        );
    };

    /**
     * ---------------------------------------------------------
     * OUTILS SCIENTIFIQUES
     * ---------------------------------------------------------
     */

    const toggleCode = () => {
        editor
            .chain()
            .focus()
            .toggleCodeBlock()
            .run();
    };

    const toggleCitation = () => {
        editor
            .chain()
            .focus()
            .toggleBlockquote()
            .run();
    };

    /**
     * ---------------------------------------------------------
     * RÉFÉRENCE
     *
     * Placeholder conservé pour le moment.
     * Le véritable système sera raccordé à useReferenceState.
     * ---------------------------------------------------------
     */

    const insertReference = () => {
        editor
            .chain()
            .focus()
            .insertContent(" [ref_key] ")
            .run();
    };

    return (
        <RibbonGroup
            title="Science & Maths"
            width="w-[260px]"
        >
            <div className="flex items-center justify-center gap-1 w-full pt-1">

                {/* ÉQUATION */}
                <RibbonButton
                    size="small"
                    icon={FunctionSquare}
                    tooltip="Insérer une équation"
                    onClick={insertEquation}
                />

                {/* FRACTION */}
                <RibbonButton
                    size="small"
                    icon={Brackets}
                    tooltip="Insérer une fraction"
                    onClick={insertFraction}
                />

                {/* RACINE */}
                <RibbonButton
                    size="small"
                    icon={Calculator}
                    tooltip="Insérer une racine"
                    onClick={insertRoot}
                />

                {/* PUISSANCE */}
                <RibbonButton
                    size="small"
                    icon={Superscript}
                    tooltip="Insérer une puissance"
                    onClick={insertPower}
                />

                {/* INDICE */}
                <RibbonButton
                    size="small"
                    icon={Subscript}
                    tooltip="Insérer un indice"
                    onClick={insertIndex}
                />

                {/* INTÉGRALE */}
                <RibbonButton
                    size="small"
                    icon={FunctionSquare}
                    tooltip="Insérer une intégrale"
                    onClick={insertIntegral}
                />

                {/* SOMME */}
                <RibbonButton
                    size="small"
                    icon={Sigma}
                    tooltip="Insérer une somme"
                    onClick={insertSum}
                />

                {/* LIMITE */}
                <RibbonButton
                    size="small"
                    icon={Atom}
                    tooltip="Insérer une limite"
                    onClick={insertLimit}
                />

                {/* MATRICE */}
                <RibbonButton
                    size="small"
                    icon={Brackets}
                    tooltip="Insérer une matrice"
                    onClick={insertMatrix}
                />

                {/* SYMBOLES */}
                <RibbonButton
                    size="small"
                    icon={Sigma}
                    tooltip="Insérer des symboles scientifiques"
                    onClick={insertSymbols}
                />

                {/* CODE */}
                <RibbonButton
                    size="small"
                    icon={Code2}
                    tooltip="Bloc de code scientifique"
                    onClick={toggleCode}
                />

                {/* CITATION */}
                <RibbonButton
                    size="small"
                    icon={Quote}
                    tooltip="Citation scientifique"
                    onClick={toggleCitation}
                />

                {/* RÉFÉRENCE */}
                <RibbonButton
                    size="small"
                    icon={BookmarkPlus}
                    tooltip="Insérer une référence"
                    onClick={insertReference}
                />

            </div>
        </RibbonGroup>
    );
}