/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier : ProtectGroup.jsx
 * Version : 4.0.0
 * Statut  : Protection documentaire — stable
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
    Lock,
    KeyRound,
    ShieldCheck,
    X,
    Check,
    AlertCircle,
    CheckCircle2,
    Eye,
    MessageSquare,
    Edit3,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useEditorContext } from "../../EditorContext";

import protectEngine from "../../../../../core/document/engines/revision/ProtectEngine";

const PERMISSION_OPTIONS = [
    {
        id: "lecture",
        label: "Lecture seule",
        icon: Eye,
        description:
            "Empêche toute modification du document.",
    },
    {
        id: "commentaire",
        label: "Commentaires uniquement",
        icon: MessageSquare,
        description:
            "Permet de laisser des commentaires sans modifier le texte.",
    },
    {
        id: "édition",
        label: "Édition complète",
        icon: Edit3,
        description:
            "Autorise la modification libre du contenu.",
    },
];

function ProtectGroup() {
    const { editor } = useEditorContext();

    const [isProtected, setIsProtected] = useState(() => {
        if (
            typeof protectEngine?.isProtected ===
            "function"
        ) {
            return Boolean(
                protectEngine.isProtected()
            );
        }

        return false;
    });

    const [activeModal, setActiveModal] =
        useState(null);

    const [passwordInput, setPasswordInput] =
        useState("");

    const [selectedPermission, setSelectedPermission] =
        useState("édition");

    const [feedbackMessage, setFeedbackMessage] =
        useState("");

    /**
     * ---------------------------------------------------------
     * Synchronisation avec ProtectEngine
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (
            typeof protectEngine?.isProtected ===
            "function"
        ) {
            setIsProtected(
                Boolean(protectEngine.isProtected())
            );
        }
    }, []);

    /**
     * ---------------------------------------------------------
     * Fermeture des modales avec Escape
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (!activeModal) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setActiveModal(null);
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [activeModal]);

    /**
     * ---------------------------------------------------------
     * Feedback
     * ---------------------------------------------------------
     */

    const showFeedback = (message) => {
        setFeedbackMessage(message);
        setActiveModal("feedback");
    };

    /**
     * ---------------------------------------------------------
     * Protection
     * ---------------------------------------------------------
     */

    const toggleProtection = () => {
        if (!protectEngine) {
            showFeedback(
                "Le moteur de protection est indisponible."
            );
            return;
        }

        try {
            const currentlyProtected =
                typeof protectEngine.isProtected ===
                "function"
                    ? Boolean(
                          protectEngine.isProtected()
                      )
                    : isProtected;

            if (currentlyProtected) {
                if (
                    typeof protectEngine.unlock !==
                    "function"
                ) {
                    throw new Error(
                        "Le moteur ne fournit pas la fonction de déverrouillage."
                    );
                }

                protectEngine.unlock();
                setIsProtected(false);

                showFeedback(
                    "Le document a été déverrouillé avec succès."
                );

                return;
            }

            if (
                typeof protectEngine.lock !==
                "function"
            ) {
                throw new Error(
                    "Le moteur ne fournit pas la fonction de verrouillage."
                );
            }

            protectEngine.lock();
            setIsProtected(true);

            showFeedback(
                "Le document est désormais verrouillé."
            );
        } catch (error) {
            console.error(
                "[MACEVO Protection] Erreur :",
                error
            );

            showFeedback(
                error?.message ||
                    "Impossible de modifier la protection du document."
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * Mot de passe
     * ---------------------------------------------------------
     */

    const openPasswordModal = () => {
        setPasswordInput("");
        setActiveModal("password-input");
    };

    const handleSavePassword = () => {
        const password = passwordInput.trim();

        if (!password) {
            return;
        }

        try {
            if (
                typeof protectEngine?.setPassword !==
                "function"
            ) {
                throw new Error(
                    "Le moteur de protection ne fournit pas la fonction setPassword()."
                );
            }

            protectEngine.setPassword(password);

            setPasswordInput("");
            setActiveModal(null);

            showFeedback(
                "Le mot de passe de protection a été enregistré."
            );
        } catch (error) {
            console.error(
                "[MACEVO Protection] Mot de passe :",
                error
            );

            showFeedback(
                error?.message ||
                    "Impossible d'enregistrer le mot de passe."
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * Permissions
     * ---------------------------------------------------------
     */

    const openPermissionsModal = () => {
        let currentPermission = "édition";

        try {
            if (
                typeof protectEngine?.getPermission ===
                "function"
            ) {
                currentPermission =
                    protectEngine.getPermission() ||
                    "édition";
            }
        } catch (error) {
            console.warn(
                "[MACEVO Protection] Lecture des permissions impossible :",
                error
            );
        }

        const isValidPermission =
            PERMISSION_OPTIONS.some(
                (option) =>
                    option.id === currentPermission
            );

        setSelectedPermission(
            isValidPermission
                ? currentPermission
                : "édition"
        );

        setActiveModal("permissions-config");
    };

    const handleSavePermissions = () => {
        try {
            if (
                typeof protectEngine?.setPermission !==
                "function"
            ) {
                throw new Error(
                    "Le moteur de protection ne fournit pas la fonction setPermission()."
                );
            }

            protectEngine.setPermission(
                selectedPermission
            );

            setActiveModal(null);

            showFeedback(
                `Permissions mises à jour : ${selectedPermission}`
            );
        } catch (error) {
            console.error(
                "[MACEVO Protection] Permissions :",
                error
            );

            showFeedback(
                error?.message ||
                    "Impossible de modifier les permissions."
            );
        }
    };

    /**
     * ---------------------------------------------------------
     * Modale générique
     * ---------------------------------------------------------
     */

    const closeModal = () => {
        setActiveModal(null);
    };

    /**
     * Aucun éditeur disponible.
     */
    if (!editor) {
        return null;
    }

    return (
        <>
            <RibbonGroup
                title="Protection"
                className="w-[230px] min-w-[230px]"
            >
                <RibbonButton
                    icon={Lock}
                    label={
                        isProtected
                            ? "Déverrouiller"
                            : "Verrouiller"
                    }
                    tooltip={
                        isProtected
                            ? "Déverrouiller le document"
                            : "Verrouiller le document"
                    }
                    onClick={toggleProtection}
                    active={isProtected}
                />

                <RibbonButton
                    icon={KeyRound}
                    label="Mot de passe"
                    tooltip="Définir un mot de passe de protection"
                    onClick={openPasswordModal}
                />

                <RibbonButton
                    icon={ShieldCheck}
                    label="Permissions"
                    tooltip="Gérer les permissions du document"
                    onClick={openPermissionsModal}
                />
            </RibbonGroup>

            {/* =================================================
                MODALE — MOT DE PASSE
               ================================================= */}

            {activeModal === "password-input" &&
                createPortal(
                    <div
                        className="
                            fixed
                            inset-0
                            z-[999999]
                            flex
                            items-center
                            justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="macevo-password-title"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }
                        }}
                    >
                        <div
                            className="
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border
                                border-slate-300
                                w-[440px]
                                max-w-[95vw]
                                overflow-hidden
                            "
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    px-6
                                    py-4
                                    border-b
                                    border-slate-200
                                    bg-slate-50
                                "
                            >
                                <h3
                                    id="macevo-password-title"
                                    className="
                                        text-sm
                                        font-bold
                                        text-slate-800
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <KeyRound className="w-4 h-4 text-blue-600" />
                                    Définir un mot de passe
                                </h3>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="
                                        p-1
                                        text-slate-400
                                        hover:text-slate-700
                                        rounded
                                    "
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 bg-white">
                                <label
                                    htmlFor="macevo-protection-password"
                                    className="
                                        block
                                        mb-2
                                        text-xs
                                        font-semibold
                                        text-slate-700
                                    "
                                >
                                    Mot de passe de protection
                                </label>

                                <input
                                    id="macevo-protection-password"
                                    type="password"
                                    value={passwordInput}
                                    onChange={(event) =>
                                        setPasswordInput(
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key ===
                                                "Enter" &&
                                            passwordInput.trim()
                                        ) {
                                            handleSavePassword();
                                        }
                                    }}
                                    autoFocus
                                    autoComplete="new-password"
                                    placeholder="Mot de passe sécurisé"
                                    className="
                                        w-full
                                        px-3
                                        py-2
                                        text-xs
                                        border
                                        border-slate-300
                                        rounded-md
                                        bg-white
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-blue-500/20
                                        focus:border-blue-500
                                    "
                                />
                            </div>

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    px-6
                                    py-4
                                    border-t
                                    border-slate-200
                                    bg-slate-50
                                "
                            >
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="
                                        px-3
                                        py-2
                                        text-xs
                                        font-medium
                                        text-slate-600
                                        bg-slate-100
                                        hover:bg-slate-200
                                        rounded
                                    "
                                >
                                    Annuler
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSavePassword}
                                    disabled={
                                        !passwordInput.trim()
                                    }
                                    className="
                                        px-4
                                        py-2
                                        text-xs
                                        font-medium
                                        text-white
                                        bg-blue-600
                                        hover:bg-blue-700
                                        disabled:bg-blue-300
                                        disabled:cursor-not-allowed
                                        rounded
                                        shadow-sm
                                        flex
                                        items-center
                                        gap-1.5
                                    "
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* =================================================
                MODALE — PERMISSIONS
               ================================================= */}

            {activeModal ===
                "permissions-config" &&
                createPortal(
                    <div
                        className="
                            fixed
                            inset-0
                            z-[999999]
                            flex
                            items-center
                            justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="macevo-permissions-title"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }
                        }}
                    >
                        <div
                            className="
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border
                                border-slate-300
                                w-[500px]
                                max-w-[95vw]
                                overflow-hidden
                            "
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    px-6
                                    py-4
                                    border-b
                                    border-slate-200
                                    bg-slate-50
                                "
                            >
                                <h3
                                    id="macevo-permissions-title"
                                    className="
                                        text-sm
                                        font-bold
                                        text-slate-800
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    Gestion des permissions
                                </h3>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="
                                        p-1
                                        text-slate-400
                                        hover:text-slate-700
                                        rounded
                                    "
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 bg-white">
                                <p className="text-xs font-semibold text-slate-700 mb-3">
                                    Niveau d'accès autorisé
                                </p>

                                <div className="flex flex-col gap-2">
                                    {PERMISSION_OPTIONS.map(
                                        (option) => {
                                            const Icon =
                                                option.icon;

                                            const selected =
                                                selectedPermission ===
                                                option.id;

                                            return (
                                                <button
                                                    key={
                                                        option.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedPermission(
                                                            option.id
                                                        )
                                                    }
                                                    className={`
                                                        w-full
                                                        p-3
                                                        border
                                                        rounded-lg
                                                        text-left
                                                        flex
                                                        items-start
                                                        gap-3
                                                        transition-all
                                                        ${
                                                            selected
                                                                ? "bg-blue-50 border-blue-500 shadow-sm"
                                                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                        }
                                                    `}
                                                    aria-pressed={
                                                        selected
                                                    }
                                                >
                                                    <span
                                                        className={`
                                                            p-2
                                                            rounded-md
                                                            shrink-0
                                                            ${
                                                                selected
                                                                    ? "bg-blue-600 text-white"
                                                                    : "bg-slate-100 text-slate-600"
                                                            }
                                                        `}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </span>

                                                    <span className="flex flex-col gap-0.5">
                                                        <span
                                                            className={`
                                                                text-xs
                                                                font-bold
                                                                ${
                                                                    selected
                                                                        ? "text-blue-900"
                                                                        : "text-slate-800"
                                                                }
                                                            `}
                                                        >
                                                            {
                                                                option.label
                                                            }
                                                        </span>

                                                        <span className="text-[11px] text-slate-500 leading-normal">
                                                            {
                                                                option.description
                                                            }
                                                        </span>
                                                    </span>
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    px-6
                                    py-4
                                    border-t
                                    border-slate-200
                                    bg-slate-50
                                "
                            >
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="
                                        px-3
                                        py-2
                                        text-xs
                                        font-medium
                                        text-slate-600
                                        bg-slate-100
                                        hover:bg-slate-200
                                        rounded
                                    "
                                >
                                    Annuler
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleSavePermissions
                                    }
                                    className="
                                        px-4
                                        py-2
                                        text-xs
                                        font-medium
                                        text-white
                                        bg-blue-600
                                        hover:bg-blue-700
                                        rounded
                                        shadow-sm
                                        flex
                                        items-center
                                        gap-1.5
                                    "
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Appliquer
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* =================================================
                MODALE — FEEDBACK
               ================================================= */}

            {activeModal === "feedback" &&
                createPortal(
                    <div
                        className="
                            fixed
                            inset-0
                            z-[999999]
                            flex
                            items-center
                            justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="macevo-protection-feedback-title"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeModal();
                            }
                        }}
                    >
                        <div
                            className="
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border
                                border-slate-300
                                w-[420px]
                                max-w-[95vw]
                                overflow-hidden
                            "
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    px-6
                                    py-4
                                    border-b
                                    border-slate-200
                                    bg-slate-50
                                "
                            >
                                <h3
                                    id="macevo-protection-feedback-title"
                                    className="
                                        text-sm
                                        font-bold
                                        text-slate-800
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <AlertCircle className="w-4 h-4 text-blue-600" />
                                    Information — Protection
                                </h3>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="
                                        p-1
                                        text-slate-400
                                        hover:text-slate-700
                                        rounded
                                    "
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div
                                className="
                                    p-6
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    text-center
                                    gap-3
                                    bg-white
                                "
                            >
                                <div
                                    className="
                                        w-10
                                        h-10
                                        rounded-full
                                        bg-blue-50
                                        text-blue-600
                                        flex
                                        items-center
                                        justify-center
                                    "
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>

                                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                    {feedbackMessage}
                                </p>
                            </div>

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-end
                                    px-6
                                    py-4
                                    border-t
                                    border-slate-200
                                    bg-slate-50
                                "
                            >
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="
                                        px-4
                                        py-2
                                        text-xs
                                        font-medium
                                        text-white
                                        bg-blue-600
                                        hover:bg-blue-700
                                        rounded
                                        shadow-sm
                                    "
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

export default ProtectGroup;