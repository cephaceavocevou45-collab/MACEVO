/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : CommentsGroup.jsx
 * Description : Gestion des commentaires scientifiques.
 * Version : 4.0.0
 * Statut  : Professionnel — frontend autonome
 * ===========================================================
 */

import React, {
    useEffect,
    useState,
} from "react";

import { createPortal } from "react-dom";

import {
    MessageSquarePlus,
    MessageSquare,
    Check,
    Trash2,
    X,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";


export default function CommentsGroup({
    editor,
    comments = [],
    onAddComment,
    onDeleteComment,
}) {
    const [commentText, setCommentText] = useState("");
    const [isInputOpen, setIsInputOpen] = useState(false);

    const [isCommentsOpen, setIsCommentsOpen] =
        useState(false);

    const [feedbackMessage, setFeedbackMessage] =
        useState("");

    const [isFeedbackOpen, setIsFeedbackOpen] =
        useState(false);

    const [pendingSelection, setPendingSelection] =
        useState(null);


    /* ======================================================
       FEEDBACK
       ====================================================== */

    function showFeedback(message) {
        setFeedbackMessage(message);
        setIsFeedbackOpen(true);
    }


    /* ======================================================
       FERMETURE AVEC ESCAPE
       ====================================================== */

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key !== "Escape") {
                return;
            }

            setIsInputOpen(false);
            setIsFeedbackOpen(false);
            setIsCommentsOpen(false);
        }

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, []);


    /* ======================================================
       AJOUTER UN COMMENTAIRE
       ====================================================== */

    function handleAddCommentClick() {
        if (!editor) {
            showFeedback(
                "L'éditeur n'est pas disponible."
            );

            return;
        }

        const {
            from,
            to,
            empty,
        } = editor.state.selection;

        if (empty || from === to) {
            showFeedback(
                "Veuillez sélectionner du texte pour y ajouter un commentaire."
            );

            return;
        }

        const selectedText =
            editor.state.doc.textBetween(
                from,
                to,
                " "
            );

        if (!selectedText.trim()) {
            showFeedback(
                "La sélection ne contient aucun texte exploitable."
            );

            return;
        }

        /*
         * On mémorise la sélection au moment
         * où l'utilisateur clique sur Ajouter.
         *
         * Ainsi, le commentaire reste associé
         * à la bonne sélection même si l'interface
         * change pendant la saisie.
         */

        setPendingSelection({
            from,
            to,
            selectedText,
        });

        setCommentText("");
        setIsInputOpen(true);
    }


    /* ======================================================
       VALIDER LE COMMENTAIRE
       ====================================================== */

    function submitComment() {
        const text = commentText.trim();

        if (!text) {
            showFeedback(
                "Veuillez saisir un commentaire."
            );

            return;
        }

        if (!editor) {
            showFeedback(
                "L'éditeur n'est pas disponible."
            );

            return;
        }

        if (!pendingSelection) {
            showFeedback(
                "Aucune sélection n'est associée à ce commentaire."
            );

            return;
        }

        const {
            from,
            to,
            selectedText,
        } = pendingSelection;

        const comment = {
            id:
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            text,

            selectedText,

            from,

            to,

            date:
                new Date().toLocaleDateString(
                    "fr-FR"
                ),
        };

        try {
            if (typeof onAddComment === "function") {
                onAddComment(comment);
            } else {
                console.warn(
                    "MACEVO : onAddComment n'est pas disponible."
                );
            }

            setCommentText("");
            setPendingSelection(null);
            setIsInputOpen(false);

            showFeedback(
                "Le commentaire a été ajouté avec succès."
            );
        } catch (error) {
            console.error(
                "MACEVO : impossible d'ajouter le commentaire.",
                error
            );

            showFeedback(
                "Impossible d'ajouter le commentaire."
            );
        }
    }


    /* ======================================================
       SUPPRIMER UN COMMENTAIRE
       ====================================================== */

    function handleDeleteComment(comment) {
        if (
            typeof onDeleteComment !==
            "function"
        ) {
            showFeedback(
                "La suppression des commentaires n'est pas disponible."
            );

            return;
        }

        try {
            onDeleteComment(comment);

            showFeedback(
                "Le commentaire a été supprimé."
            );
        } catch (error) {
            console.error(
                "MACEVO : impossible de supprimer le commentaire.",
                error
            );

            showFeedback(
                "Impossible de supprimer le commentaire."
            );
        }
    }


    /* ======================================================
       AFFICHER / MASQUER LES COMMENTAIRES
       ====================================================== */

    function toggleComments() {
        setIsCommentsOpen(
            (current) => !current
        );
    }


    /* ======================================================
       RENDU
       ====================================================== */

    return (
        <>
            <RibbonGroup
                title="Commentaires"
                className="w-[170px] min-w-[170px]"
            >
                <div
                    className="
                        flex
                        items-center
                        justify-center
                        gap-1
                        h-full
                        w-full
                        px-1
                    "
                >

                    {/* ======================================
                        AJOUTER
                       ====================================== */}

                    <RibbonButton
                        icon={MessageSquarePlus}
                        label="Ajouter"
                        tooltip="Ajouter un commentaire sur la sélection"
                        onClick={
                            handleAddCommentClick
                        }
                    />


                    {/* ======================================
                        AFFICHER
                       ====================================== */}

                    <div className="relative">
                        <RibbonButton
                            icon={MessageSquare}
                            label="Afficher"
                            tooltip="Afficher ou masquer les commentaires"
                            active={
                                isCommentsOpen
                            }
                            onClick={
                                toggleComments
                            }
                        />

                        {comments.length > 0 && (
                            <span
                                className="
                                    absolute
                                    top-0
                                    right-0
                                    min-w-[15px]
                                    h-[15px]
                                    px-1
                                    rounded-full
                                    bg-blue-600
                                    text-white
                                    text-[9px]
                                    font-bold
                                    flex
                                    items-center
                                    justify-center
                                    pointer-events-none
                                "
                            >
                                {comments.length}
                            </span>
                        )}
                    </div>

                </div>
            </RibbonGroup>


            {/* ==================================================
               PANNEAU DES COMMENTAIRES
               ================================================== */}

            {isCommentsOpen &&
                createPortal(
                    <div
                        className="
                            fixed
                            top-[120px]
                            right-5
                            z-[99998]
                            w-[340px]
                            max-w-[calc(100vw-32px)]
                            bg-white
                            border
                            border-slate-300
                            rounded-xl
                            shadow-2xl
                            overflow-hidden
                        "
                    >

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                px-4
                                py-3
                                border-b
                                border-slate-200
                                bg-slate-50
                            "
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >
                                <MessageSquare
                                    className="
                                        w-4
                                        h-4
                                        text-blue-600
                                    "
                                />

                                <h3
                                    className="
                                        text-xs
                                        font-bold
                                        text-slate-800
                                    "
                                >
                                    Commentaires
                                </h3>

                                <span
                                    className="
                                        text-[10px]
                                        text-slate-500
                                    "
                                >
                                    ({comments.length})
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsCommentsOpen(
                                        false
                                    )
                                }
                                className="
                                    p-1
                                    rounded
                                    text-slate-400
                                    hover:text-slate-700
                                    hover:bg-slate-200
                                    transition-colors
                                "
                                aria-label="Fermer les commentaires"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>


                        <div
                            className="
                                max-h-[420px]
                                overflow-y-auto
                                p-3
                            "
                        >

                            {comments.length === 0 ? (
                                <div
                                    className="
                                        py-8
                                        text-center
                                        text-xs
                                        text-slate-500
                                    "
                                >
                                    Aucun commentaire.
                                </div>
                            ) : (
                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-2
                                    "
                                >
                                    {comments.map(
                                        (
                                            comment,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    comment.id ??
                                                    index
                                                }
                                                className="
                                                    rounded-lg
                                                    border
                                                    border-slate-200
                                                    bg-white
                                                    p-3
                                                "
                                            >

                                                <div
                                                    className="
                                                        flex
                                                        items-start
                                                        justify-between
                                                        gap-2
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            text-[10px]
                                                            font-semibold
                                                            text-blue-600
                                                        "
                                                    >
                                                        Commentaire{" "}
                                                        {index + 1}
                                                    </div>

                                                    {typeof onDeleteComment ===
                                                        "function" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteComment(
                                                                    comment
                                                                )
                                                            }
                                                            className="
                                                                p-1
                                                                rounded
                                                                text-slate-400
                                                                hover:text-red-600
                                                                hover:bg-red-50
                                                                transition-colors
                                                            "
                                                            title="Supprimer le commentaire"
                                                            aria-label="Supprimer le commentaire"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                </div>


                                                {comment.selectedText && (
                                                    <div
                                                        className="
                                                            mt-2
                                                            px-2
                                                            py-1.5
                                                            rounded
                                                            bg-slate-50
                                                            border-l-2
                                                            border-blue-400
                                                            text-[10px]
                                                            text-slate-500
                                                            italic
                                                        "
                                                    >
                                                        «{" "}
                                                        {
                                                            comment.selectedText
                                                        }{" "}
                                                        »
                                                    </div>
                                                )}


                                                <p
                                                    className="
                                                        mt-2
                                                        text-xs
                                                        leading-relaxed
                                                        text-slate-700
                                                        whitespace-pre-wrap
                                                    "
                                                >
                                                    {
                                                        comment.text
                                                    }
                                                </p>


                                                {comment.date && (
                                                    <div
                                                        className="
                                                            mt-2
                                                            text-[9px]
                                                            text-slate-400
                                                        "
                                                    >
                                                        {
                                                            comment.date
                                                        }
                                                    </div>
                                                )}

                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                        </div>

                    </div>,
                    document.body
                )}


            {/* ==================================================
               MODALE NOUVEAU COMMENTAIRE
               ================================================== */}

            {isInputOpen &&
                createPortal(
                    <div
                        className="
                            fixed
                            inset-0
                            z-[99999]
                            flex
                            items-center
                            justify-center
                            bg-black/50
                            backdrop-blur-[2px]
                            p-4
                        "
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setIsInputOpen(
                                    false
                                );
                            }
                        }}
                    >

                        <div
                            className="
                                w-[430px]
                                max-w-full
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border
                                border-slate-300
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
                                    px-5
                                    py-3
                                    border-b
                                    border-slate-200
                                    bg-slate-50
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <MessageSquarePlus
                                        className="
                                            w-4
                                            h-4
                                            text-blue-600
                                        "
                                    />

                                    <h3
                                        className="
                                            text-sm
                                            font-bold
                                            text-slate-800
                                        "
                                    >
                                        Nouveau commentaire
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsInputOpen(
                                            false
                                        )
                                    }
                                    className="
                                        p-1
                                        rounded
                                        text-slate-400
                                        hover:text-slate-700
                                        hover:bg-slate-200
                                    "
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                            </div>


                            <div className="p-5">

                                {pendingSelection?.selectedText && (
                                    <div
                                        className="
                                            mb-3
                                            rounded-lg
                                            bg-blue-50
                                            border
                                            border-blue-100
                                            px-3
                                            py-2
                                        "
                                    >
                                        <div
                                            className="
                                                text-[9px]
                                                uppercase
                                                tracking-wide
                                                font-bold
                                                text-blue-600
                                                mb-1
                                            "
                                        >
                                            Texte sélectionné
                                        </div>

                                        <div
                                            className="
                                                text-[11px]
                                                text-slate-600
                                                italic
                                                max-h-16
                                                overflow-y-auto
                                            "
                                        >
                                            «{" "}
                                            {
                                                pendingSelection.selectedText
                                            }{" "}
                                            »
                                        </div>
                                    </div>
                                )}


                                <textarea
                                    value={commentText}
                                    onChange={(event) =>
                                        setCommentText(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Saisissez votre commentaire..."
                                    className="
                                        w-full
                                        h-28
                                        p-3
                                        text-xs
                                        text-slate-700
                                        border
                                        border-slate-300
                                        rounded-lg
                                        resize-none
                                        outline-none
                                        focus:border-blue-500
                                        focus:ring-2
                                        focus:ring-blue-100
                                    "
                                    autoFocus
                                />

                            </div>


                            <div
                                className="
                                    flex
                                    items-center
                                    justify-end
                                    gap-2
                                    px-5
                                    py-3
                                    border-t
                                    border-slate-200
                                    bg-slate-50
                                "
                            >

                                <button
                                    type="button"
                                    onClick={() => {
                                        setCommentText("");
                                        setPendingSelection(
                                            null
                                        );
                                        setIsInputOpen(
                                            false
                                        );
                                    }}
                                    className="
                                        px-3
                                        py-1.5
                                        text-xs
                                        text-slate-600
                                        rounded-lg
                                        hover:bg-slate-200
                                    "
                                >
                                    Annuler
                                </button>


                                <button
                                    type="button"
                                    onClick={
                                        submitComment
                                    }
                                    disabled={
                                        !commentText.trim()
                                    }
                                    className="
                                        px-3
                                        py-1.5
                                        text-xs
                                        font-medium
                                        text-white
                                        bg-blue-600
                                        hover:bg-blue-700
                                        disabled:bg-slate-300
                                        disabled:cursor-not-allowed
                                        rounded-lg
                                        flex
                                        items-center
                                        gap-1.5
                                    "
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Valider
                                </button>

                            </div>

                        </div>

                    </div>,
                    document.body
                )}


            {/* ==================================================
               MODALE FEEDBACK
               ================================================== */}

            {isFeedbackOpen &&
                createPortal(
                    <div
                        className="
                            fixed
                            inset-0
                            z-[100000]
                            flex
                            items-center
                            justify-center
                            bg-black/60
                            backdrop-blur-[3px]
                            p-4
                        "
                    >

                        <div
                            className="
                                bg-white
                                rounded-xl
                                shadow-2xl
                                border
                                border-slate-300
                                w-[420px]
                                max-w-full
                                overflow-hidden
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    px-5
                                    py-3
                                    border-b
                                    border-slate-200
                                    bg-slate-50
                                "
                            >

                                <h3
                                    className="
                                        text-sm
                                        font-bold
                                        text-slate-800
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <AlertCircle
                                        className="
                                            w-4
                                            h-4
                                            text-blue-600
                                        "
                                    />

                                    Information
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsFeedbackOpen(
                                            false
                                        )
                                    }
                                    className="
                                        p-1
                                        rounded
                                        text-slate-400
                                        hover:text-slate-700
                                        hover:bg-slate-200
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
                                    bg-slate-50
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

                                <p
                                    className="
                                        text-xs
                                        text-slate-700
                                        font-medium
                                        leading-relaxed
                                    "
                                >
                                    {
                                        feedbackMessage
                                    }
                                </p>

                            </div>


                            <div
                                className="
                                    flex
                                    items-center
                                    justify-end
                                    px-5
                                    py-3
                                    border-t
                                    border-slate-200
                                    bg-slate-50
                                "
                            >

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsFeedbackOpen(
                                            false
                                        )
                                    }
                                    className="
                                        px-4
                                        py-1.5
                                        text-xs
                                        font-medium
                                        text-white
                                        bg-blue-600
                                        hover:bg-blue-700
                                        rounded-lg
                                        transition-colors
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