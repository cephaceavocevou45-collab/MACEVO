/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : AccessibilityGroup.jsx
 * Version : 4.0.0
 * Statut  : Professionnel
 * Description :
 * Vérification, scan et correction de l'accessibilité
 * des documents scientifiques.
 * ===========================================================
 */

import { useState } from "react";
import { createPortal } from "react-dom";

import {
    Accessibility,
    ScanSearch,
    BadgeCheck,
    X,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
    Info,
    AlertTriangle,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import accessibilityEngine from "../../../../../core/document/engines/revision/AccessibilityEngine";

function AccessibilityGroup() {
    const { editor } = useEditorContext();

    const [activeModal, setActiveModal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [accessibilityReport, setAccessibilityReport] =
        useState(null);

    const [issuesList, setIssuesList] = useState([]);

    const [feedbackMessage, setFeedbackMessage] =
        useState("");

    if (!editor) {
        return null;
    }

    /* ======================================================
       FEEDBACK
    ====================================================== */

    function showFeedback(message) {
        setFeedbackMessage(message);
        setActiveModal("feedback");
    }

    /* ======================================================
       VÉRIFIER
    ====================================================== */

    async function checkAccessibility() {
        const text = editor.getText();

        if (!text.trim()) {
            showFeedback(
                "Le document est vide. Ajoutez du contenu avant de lancer la vérification."
            );
            return;
        }

        setIsLoading(true);
        setAccessibilityReport(null);
        setActiveModal("accessibility-report");

        try {
            const report =
                await Promise.resolve(
                    accessibilityEngine.check(text)
                );

            setAccessibilityReport(report || {});
        } catch (error) {
            console.error(
                "Erreur lors de la vérification de l'accessibilité :",
                error
            );

            setAccessibilityReport({
                accessible: false,
                score: 0,
                total: 0,
                errors: 1,
                warnings: 0,
                infos: 0,
                issues: [],
                error:
                    "Impossible d'effectuer la vérification.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    /* ======================================================
       SCANNER
    ====================================================== */

    async function scanDocument() {
        const text = editor.getText();

        if (!text.trim()) {
            showFeedback(
                "Le document est vide. Ajoutez du contenu avant de lancer le scan."
            );
            return;
        }

        setIsLoading(true);
        setIssuesList([]);
        setActiveModal("scan-issues");

        try {
            const issues =
                await Promise.resolve(
                    accessibilityEngine.scan(text)
                );

            setIssuesList(
                Array.isArray(issues)
                    ? issues
                    : []
            );
        } catch (error) {
            console.error(
                "Erreur lors du scan d'accessibilité :",
                error
            );

            setIssuesList([]);
        } finally {
            setIsLoading(false);
        }
    }

    /* ======================================================
       CORRECTION
    ====================================================== */

    async function fixAccessibility() {
        const text = editor.getText();

        if (!text.trim()) {
            showFeedback(
                "Le document est vide. Ajoutez du contenu avant de lancer la correction."
            );
            return;
        }

        try {
            const correctedText =
                await Promise.resolve(
                    accessibilityEngine.fix(text)
                );

            if (
                typeof correctedText === "string" &&
                correctedText !== text
            ) {
                editor
                    .chain()
                    .focus()
                    .setContent(
                        `<p>${escapeHtml(correctedText)
                            .replace(/\n\n/g, "</p><p>")
                            .replace(/\n/g, "<br>")}</p>`
                    )
                    .run();

                showFeedback(
                    "La correction automatique de l'accessibilité a été appliquée avec succès."
                );
            } else {
                showFeedback(
                    "Aucune correction automatique n'était nécessaire."
                );
            }
        } catch (error) {
            console.error(
                "Erreur lors de la correction automatique :",
                error
            );

            showFeedback(
                "Une erreur est survenue lors de la correction automatique."
            );
        }
    }

    /* ======================================================
       OUTILS
    ====================================================== */

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getIssueIcon(type) {
        switch (type) {
            case "error":
                return (
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                );

            case "warning":
                return (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                );

            case "info":
                return (
                    <Info className="w-4 h-4 text-blue-600" />
                );

            default:
                return (
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                );
        }
    }

    function getIssueLabel(type) {
        switch (type) {
            case "error":
                return "Erreur";

            case "warning":
                return "Avertissement";

            case "info":
                return "Information";

            default:
                return "Problème";
        }
    }

    /* ======================================================
       INTERFACE
    ====================================================== */

    return (
        <>
            <RibbonGroup
                title="Accessibilité"
                className="w-[230px] min-w-[230px]"
            >
                <RibbonButton
                    icon={Accessibility}
                    label="Vérifier"
                    tooltip="Vérifier l'accessibilité du document"
                    onClick={checkAccessibility}
                />

                <RibbonButton
                    icon={ScanSearch}
                    label="Scanner"
                    tooltip="Scanner les problèmes d'accessibilité"
                    onClick={scanDocument}
                />

                <RibbonButton
                    icon={BadgeCheck}
                    label="Corriger"
                    tooltip="Corriger automatiquement les problèmes simples"
                    onClick={fixAccessibility}
                />
            </RibbonGroup>

            {/* ==================================================
                RAPPORT
            ================================================== */}

            {activeModal === "accessibility-report" &&
                createPortal(
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px]">
                        <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[620px] max-w-[95vw] overflow-hidden flex flex-col">

                            {/* HEADER */}

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Accessibility className="w-4 h-4 text-blue-600" />
                                    Vérification d'accessibilité
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* BODY */}

                            <div className="p-6 max-h-[65vh] overflow-y-auto bg-slate-50">

                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500 text-xs">
                                        <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />

                                        <span>
                                            Analyse de l'accessibilité en cours...
                                        </span>
                                    </div>
                                ) : accessibilityReport ? (
                                    <div className="flex flex-col gap-5">

                                        {/* SCORE */}

                                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                                            <div className="flex items-center justify-between">

                                                <div>
                                                    <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                                                        Score d'accessibilité
                                                    </div>

                                                    <div className="text-3xl font-bold text-gray-800 mt-1">
                                                        {accessibilityReport.score ?? 0}
                                                        <span className="text-base text-gray-400 ml-1">
                                                            /100
                                                        </span>
                                                    </div>
                                                </div>

                                                {(accessibilityReport.accessible) ? (
                                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                                ) : (
                                                    <ShieldAlert className="w-10 h-10 text-amber-500" />
                                                )}

                                            </div>
                                        </div>

                                        {/* STATISTIQUES */}

                                        <div className="grid grid-cols-3 gap-3">

                                            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                                                <div className="text-xl font-bold text-red-600">
                                                    {accessibilityReport.errors ?? 0}
                                                </div>

                                                <div className="text-[10px] uppercase text-gray-500">
                                                    Erreurs
                                                </div>
                                            </div>

                                            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                                                <div className="text-xl font-bold text-amber-600">
                                                    {accessibilityReport.warnings ?? 0}
                                                </div>

                                                <div className="text-[10px] uppercase text-gray-500">
                                                    Avertissements
                                                </div>
                                            </div>

                                            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                                                <div className="text-xl font-bold text-blue-600">
                                                    {accessibilityReport.infos ?? 0}
                                                </div>

                                                <div className="text-[10px] uppercase text-gray-500">
                                                    Informations
                                                </div>
                                            </div>

                                        </div>

                                        {/* RÉSULTAT */}

                                        <div className="bg-white border border-gray-200 rounded-lg p-4">

                                            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">
                                                Résultat de l'analyse
                                            </div>

                                            {accessibilityReport.issues?.length ? (
                                                <div className="flex flex-col gap-2">

                                                    {accessibilityReport.issues.map(
                                                        (issue, index) => (
                                                            <div
                                                                key={index}
                                                                className="border border-gray-200 rounded-lg p-3"
                                                            >
                                                                <div className="flex items-center gap-2 font-semibold text-xs text-gray-800">
                                                                    {getIssueIcon(
                                                                        issue.type
                                                                    )}

                                                                    <span>
                                                                        {issue.title ||
                                                                            getIssueLabel(
                                                                                issue.type
                                                                            )}
                                                                    </span>
                                                                </div>

                                                                <p className="text-xs text-gray-600 mt-1 ml-6">
                                                                    {issue.description ||
                                                                        "Aucune description disponible."}
                                                                </p>
                                                            </div>
                                                        )
                                                    )}

                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs text-green-600">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Aucun problème détecté.
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* FOOTER */}

                            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                                >
                                    Fermer
                                </button>
                            </div>

                        </div>
                    </div>,
                    document.body
                )}

            {/* ==================================================
                SCAN
            ================================================== */}

            {activeModal === "scan-issues" &&
                createPortal(
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px]">
                        <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[620px] max-w-[95vw] overflow-hidden flex flex-col">

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <ScanSearch className="w-4 h-4 text-blue-600" />
                                    Scan d'accessibilité
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 max-h-[65vh] overflow-y-auto bg-slate-50">

                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500 text-xs">
                                        <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />

                                        <span>
                                            Scan du document en cours...
                                        </span>
                                    </div>
                                ) : issuesList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">

                                        <CheckCircle2 className="w-10 h-10 text-green-500" />

                                        <div className="text-sm font-semibold text-gray-700">
                                            Aucun problème détecté
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            Le document ne présente aucun problème identifié par le moteur actuel.
                                        </div>

                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">

                                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                            {issuesList.length} problème(s) détecté(s)
                                        </div>

                                        {issuesList.map(
                                            (issue, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-white border border-gray-200 rounded-lg p-4"
                                                >

                                                    <div className="flex items-center gap-2">

                                                        {getIssueIcon(
                                                            issue.type
                                                        )}

                                                        <span className="text-xs font-semibold text-gray-800">
                                                            {issue.title ||
                                                                getIssueLabel(
                                                                    issue.type
                                                                )}
                                                        </span>

                                                        <span className="ml-auto text-[10px] text-gray-400 uppercase">
                                                            {getIssueLabel(
                                                                issue.type
                                                            )}
                                                        </span>

                                                    </div>

                                                    <p className="text-xs text-gray-600 mt-2">
                                                        {issue.description ||
                                                            "Aucune description disponible."}
                                                    </p>

                                                </div>
                                            )
                                        )}

                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                                >
                                    Fermer
                                </button>

                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* ==================================================
                FEEDBACK
            ================================================== */}

            {activeModal === "feedback" &&
                createPortal(
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-[3px]">

                        <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-[440px] max-w-[95vw] overflow-hidden flex flex-col">

                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">

                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">

                                    <AlertCircle className="w-4 h-4 text-blue-600" />

                                    Accessibilité

                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                            </div>

                            <div className="p-6 flex flex-col items-center justify-center text-center gap-3 bg-slate-50">

                                <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">

                                    <CheckCircle2 className="w-6 h-6" />

                                </div>

                                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                                    {feedbackMessage}
                                </p>

                            </div>

                            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveModal(null)
                                    }
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                                >
                                    OK
                                </button>

                            </div>

                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}

export default AccessibilityGroup;