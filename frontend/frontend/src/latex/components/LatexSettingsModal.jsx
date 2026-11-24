/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexSettingsModal.jsx
 * Description : Fenêtre des paramètres LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

import Modal from "../../components/UI/Modal";

function LatexSettingsModal({
    isOpen,
    onClose,
}) {

    return (

        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Paramètres LaTeX"
            size="md"
        >

            <div className="space-y-6">

                {/* ==================================================
                    COMPILATEUR
                ================================================== */}

                <section>

                    <h3 className="font-semibold text-gray-800 mb-2">
                        Compilation
                    </h3>

                    <div
                        className="
                            border
                            rounded-lg
                            p-4
                            bg-gray-50
                        "
                    >

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="font-medium">
                                    Moteur LaTeX
                                </p>

                                <p className="text-sm text-gray-500">
                                    Moteur utilisé pour générer le PDF.
                                </p>

                            </div>

                            <span
                                className="
                                    px-3
                                    py-1
                                    rounded-md
                                    bg-white
                                    border
                                    text-sm
                                "
                            >
                                LaTeX
                            </span>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    ÉDITEUR
                ================================================== */}

                <section>

                    <h3 className="font-semibold text-gray-800 mb-2">
                        Éditeur
                    </h3>

                    <div
                        className="
                            border
                            rounded-lg
                            p-4
                            bg-gray-50
                        "
                    >

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="font-medium">
                                    Synchronisation automatique
                                </p>

                                <p className="text-sm text-gray-500">
                                    Synchronisation entre l'éditeur et le code LaTeX.
                                </p>

                            </div>

                            <span
                                className="
                                    px-3
                                    py-1
                                    rounded-md
                                    bg-green-100
                                    text-green-700
                                    text-sm
                                "
                            >
                                Active
                            </span>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    FERMER
                ================================================== */}

                <div className="flex justify-end pt-2">

                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            px-4
                            py-2
                            rounded-md
                            bg-gray-100
                            hover:bg-gray-200
                            text-gray-700
                        "
                    >
                        Fermer
                    </button>

                </div>

            </div>

        </Modal>

    );

}

export default LatexSettingsModal;