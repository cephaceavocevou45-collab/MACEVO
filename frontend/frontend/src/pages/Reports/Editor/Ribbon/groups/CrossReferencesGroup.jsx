/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : CrossReferencesGroup.jsx
 * Description : Gestion des renvois croisés scientifiques.
 * Version : 5.0.0
 * Statut : Professionnel — frontend sécurisé
 * ===========================================================
 */

import {
    useEffect,
    useState,
} from "react";

import { createPortal } from "react-dom";

import {
    ArrowRightLeft,
    Link,
    RefreshCw,
    X,
    Check,
    FileText,
    Bookmark,
    Trash2,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";


function CrossReferencesGroup({
    editor,
}) {
    const [activeModal, setActiveModal] =
        useState(null);

    const [refCategory, setRefCategory] =
        useState("Figure");

    const [refTargetName, setRefTargetName] =
        useState("");

    const [targetIdName, setTargetIdName] =
        useState("");

    const [targetCustomText, setTargetCustomText] =
        useState("");

    const [
        documentReferences,
        setDocumentReferences,
    ] = useState([]);


    /* ======================================================
       ESCAPE
       ====================================================== */

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setActiveModal(null);
            }
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
       UTILITAIRES
       ====================================================== */

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function escapeAttribute(value) {
        return escapeHtml(value);
    }


    function normalizeTargetId(value) {
        return String(value)
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .replace(/^[-_]+/, "")
            .slice(0, 100);
    }


    function extractReferences() {
        if (!editor?.view?.dom) {
            return [];
        }

        const references =
            editor.view.dom.querySelectorAll(
                ".macevo-cross-ref"
            );

        return Array.from(
            references
        ).map((ref, index) => ({
            id: index,

            category:
                ref.getAttribute(
                    "data-category"
                ) || "Renvoi",

            target:
                ref.getAttribute(
                    "data-target"
                ) || "",

            fullText:
                ref.textContent?.trim() ||
                "",
        }));
    }


    /* ======================================================
       INSÉRER UN RENVOI
       ====================================================== */

    function openInsertModal() {
        if (!editor) {
            return;
        }

        setRefCategory("Figure");
        setRefTargetName("");
        setActiveModal("insert");
    }


    function handleConfirmInsert(event) {
        event.preventDefault();

        if (!editor) {
            return;
        }

        const target =
            refTargetName.trim();

        if (!target) {
            return;
        }

        const displayLabel =
            `${refCategory} ${target}`;

        editor
            .chain()
            .focus()
            .insertContent(
                `<span
                    class="macevo-cross-ref"
                    data-category="${escapeAttribute(
                        refCategory
                    )}"
                    data-target="${escapeAttribute(
                        target
                    )}"
                    style="
                        color:#2563eb;
                        text-decoration:underline;
                        cursor:pointer;
                        font-weight:500;
                    "
                >Voir : ${escapeHtml(
                    displayLabel
                )}</span>&nbsp;`
            )
            .run();

        setActiveModal(null);
    }


    /* ======================================================
       CRÉER UNE CIBLE
       ====================================================== */

    function openCreateModal() {
        if (!editor) {
            return;
        }

        const {
            from,
            to,
        } = editor.state.selection;

        const selectionText =
            from !== to
                ? editor.state.doc.textBetween(
                      from,
                      to,
                      " "
                  )
                : "";

        setTargetCustomText(
            selectionText || ""
        );

        setTargetIdName("");

        setActiveModal("create");
    }


    function handleConfirmCreate(event) {
        event.preventDefault();

        if (!editor) {
            return;
        }

        const normalizedId =
            normalizeTargetId(
                targetIdName
            ) ||
            `target_${Date.now()}`;

        const contentText =
            targetCustomText.trim() ||
            "Élément cible";

        editor
            .chain()
            .focus()
            .insertContent(
                `<span
                    id="macevo-target-${escapeAttribute(
                        normalizedId
                    )}"
                    class="macevo-ref-target"
                    data-target-id="${escapeAttribute(
                        normalizedId
                    )}"
                    style="
                        background-color:#eff6ff;
                        padding:2px 6px;
                        border-radius:4px;
                        border:1px dashed #bfdbfe;
                    "
                >${escapeHtml(
                    contentText
                )}</span>&nbsp;`
            )
            .run();

        setActiveModal(null);
    }


    /* ======================================================
       GESTION DES RENVOIS
       ====================================================== */

    function openUpdateModal() {
        if (!editor) {
            return;
        }

        const references =
            extractReferences();

        if (references.length === 0) {
            window.alert(
                "Aucun renvoi actif n'a été trouvé dans le document."
            );

            return;
        }

        setDocumentReferences(
            references
        );

        setActiveModal("update");
    }


    function handleDeleteReference(
        indexToDelete
    ) {
        if (!editor) {
            return;
        }

        const references =
            editor.view.dom.querySelectorAll(
                ".macevo-cross-ref"
            );

        const target =
            references[indexToDelete];

        if (!target) {
            return;
        }

        /*
         * Nous supprimons uniquement le nœud
         * correspondant au renvoi.
         */

        target.remove();

        /*
         * Tiptap reprend ensuite le HTML
         * comme nouveau contenu.
         */

        editor.commands.setContent(
            editor.view.dom.innerHTML
        );

        const remaining =
            extractReferences();

        setDocumentReferences(
            remaining
        );

        if (remaining.length === 0) {
            setActiveModal(null);
        }
    }


    function handleConfirmUpdateAll() {
        if (!editor) {
            return;
        }

        const references =
            editor.view.dom.querySelectorAll(
                ".macevo-cross-ref"
            );

        references.forEach(
            (reference) => {
                const category =
                    reference.getAttribute(
                        "data-category"
                    ) || "Figure";

                const target =
                    reference.getAttribute(
                        "data-target"
                    ) || "1";

                reference.textContent =
                    `Voir : ${category} ${target}`;
            }
        );

        editor.commands.setContent(
            editor.view.dom.innerHTML
        );

        setDocumentReferences(
            extractReferences()
        );

        setActiveModal(null);
    }


    /* ======================================================
       RENDU
       ====================================================== */

    return (
        <>
            <RibbonGroup
                title="Renvois"
                className="w-[210px] min-w-[210px]"
            >
                <RibbonButton
                    icon={ArrowRightLeft}
                    label="Renvoi"
                    tooltip="Insérer un renvoi vers une cible"
                    onClick={
                        openInsertModal
                    }
                />

                <RibbonButton
                    icon={Link}
                    label="Créer"
                    tooltip="Créer une cible de renvoi"
                    onClick={
                        openCreateModal
                    }
                />

                <RibbonButton
                    icon={RefreshCw}
                    label="Mettre à jour"
                    tooltip="Gérer et synchroniser les renvois"
                    onClick={
                        openUpdateModal
                    }
                />
            </RibbonGroup>


            {/* ==================================================
               INSERTION
               ================================================== */}

            {activeModal === "insert" &&
                createPortal(
                    <Modal
                        title="Insérer un renvoi"
                        icon={ArrowRightLeft}
                        onClose={() =>
                            setActiveModal(
                                null
                            )
                        }
                    >
                        <form
                            onSubmit={
                                handleConfirmInsert
                            }
                            className="flex flex-col gap-4"
                        >
                            <Field label="Type d'élément référencé">
                                <select
                                    value={
                                        refCategory
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setRefCategory(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className="input"
                                >
                                    <option value="Figure">
                                        Figure
                                    </option>
                                    <option value="Tableau">
                                        Tableau
                                    </option>
                                    <option value="Équation">
                                        Équation
                                    </option>
                                    <option value="Annexe">
                                        Annexe
                                    </option>
                                    <option value="Section">
                                        Section / Chapitre
                                    </option>
                                </select>
                            </Field>

                            <Field label="Numéro ou identifiant de la cible">
                                <input
                                    type="text"
                                    required
                                    value={
                                        refTargetName
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setRefTargetName(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Ex. : 1, 2.3, A..."
                                    className="input"
                                />
                            </Field>

                            <Actions
                                onCancel={() =>
                                    setActiveModal(
                                        null
                                    )
                                }
                                label="Insérer le renvoi"
                            />
                        </form>
                    </Modal>,
                    document.body
                )}


            {/* ==================================================
               CRÉATION DE CIBLE
               ================================================== */}

            {activeModal === "create" &&
                createPortal(
                    <Modal
                        title="Créer une cible de renvoi"
                        icon={Bookmark}
                        onClose={() =>
                            setActiveModal(
                                null
                            )
                        }
                    >
                        <form
                            onSubmit={
                                handleConfirmCreate
                            }
                            className="flex flex-col gap-4"
                        >
                            <Field label="Identifiant technique">
                                <input
                                    type="text"
                                    required
                                    value={
                                        targetIdName
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setTargetIdName(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Ex. : fig1, chap2, section_intro"
                                    className="input font-mono"
                                />
                            </Field>

                            <Field label="Texte affiché">
                                <input
                                    type="text"
                                    required
                                    value={
                                        targetCustomText
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setTargetCustomText(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Ex. : Figure 1 — Architecture"
                                    className="input"
                                />
                            </Field>

                            <Actions
                                onCancel={() =>
                                    setActiveModal(
                                        null
                                    )
                                }
                                label="Créer la cible"
                            />
                        </form>
                    </Modal>,
                    document.body
                )}


            {/* ==================================================
               GESTION
               ================================================== */}

            {activeModal === "update" &&
                createPortal(
                    <Modal
                        title="Gestionnaire des renvois"
                        icon={RefreshCw}
                        width="w-[560px]"
                        onClose={() =>
                            setActiveModal(
                                null
                            )
                        }
                    >
                        <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
                            {documentReferences.map(
                                (
                                    reference,
                                    index
                                ) => (
                                    <div
                                        key={
                                            reference.id ??
                                            index
                                        }
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-2
                                            p-3
                                            bg-white
                                            border
                                            border-slate-200
                                            rounded-lg
                                        "
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="
                                                shrink-0
                                                px-2
                                                py-0.5
                                                rounded
                                                bg-blue-100
                                                text-blue-700
                                                text-[10px]
                                                font-bold
                                            ">
                                                {
                                                    reference.category
                                                }
                                            </span>

                                            <span className="
                                                truncate
                                                text-xs
                                                italic
                                                text-slate-600
                                            ">
                                                {
                                                    reference.fullText
                                                }
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDeleteReference(
                                                    index
                                                )
                                            }
                                            className="
                                                shrink-0
                                                p-1.5
                                                rounded
                                                text-slate-400
                                                hover:text-red-600
                                                hover:bg-red-50
                                            "
                                            title="Supprimer le renvoi"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() =>
                                    setActiveModal(
                                        null
                                    )
                                }
                                className="secondary-button"
                            >
                                Fermer
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleConfirmUpdateAll
                                }
                                className="primary-button"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Synchroniser
                            </button>
                        </div>
                    </Modal>,
                    document.body
                )}
        </>
    );
}


/* ==========================================================
   COMPOSANTS UI INTERNES
   ========================================================== */

function Modal({
    title,
    icon: Icon,
    width = "w-[500px]",
    onClose,
    children,
}) {
    return (
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
        >
            <div
                className={`
                    ${width}
                    max-w-full
                    bg-white
                    rounded-xl
                    shadow-2xl
                    border
                    border-slate-300
                    overflow-hidden
                `}
            >
                <div className="
                    flex
                    items-center
                    justify-between
                    px-5
                    py-3
                    border-b
                    border-slate-200
                    bg-slate-50
                ">
                    <h3 className="
                        text-sm
                        font-bold
                        text-slate-800
                        flex
                        items-center
                        gap-2
                    ">
                        <Icon className="w-4 h-4 text-blue-600" />
                        {title}
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
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

                <div className="
                    p-5
                    bg-slate-50
                ">
                    {children}
                </div>
            </div>
        </div>
    );
}


function Field({
    label,
    children,
}) {
    return (
        <div>
            <label className="
                block
                text-xs
                font-semibold
                text-slate-700
                mb-1
            ">
                {label}
            </label>

            {children}
        </div>
    );
}


function Actions({
    onCancel,
    label,
}) {
    return (
        <div className="
            flex
            justify-end
            gap-2
            pt-3
            border-t
            border-slate-200
        ">
            <button
                type="button"
                onClick={onCancel}
                className="secondary-button"
            >
                Annuler
            </button>

            <button
                type="submit"
                className="primary-button"
            >
                <Check className="w-3.5 h-3.5" />
                {label}
            </button>
        </div>
    );
}


export default CrossReferencesGroup;