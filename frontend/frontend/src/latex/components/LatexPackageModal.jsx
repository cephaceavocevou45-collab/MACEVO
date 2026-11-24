
/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : LatexPackageModal.jsx
 * Description : Interface du gestionnaire de packages LaTeX
 * Version : 1.0.0
 * ============================================================
 */

import {
    useEffect,
    useState,
} from "react";

import Modal
    from "../../components/UI/Modal";

import latexPackageManager
    from "../LatexPackageManager";


function LatexPackageModal({

    isOpen,

    onClose,

}) {

    const [
        packages,
        setPackages
    ] = useState([]);


    /* ======================================================
       CHARGEMENT DES PACKAGES
    ====================================================== */

    useEffect(() => {

        if (!isOpen) {
            return;
        }

        setPackages(

            latexPackageManager
                .list()

        );

    }, [isOpen]);


    /* ======================================================
       SUPPRIMER UN PACKAGE
    ====================================================== */

    function handleRemove(name) {

        latexPackageManager.remove(name);

        setPackages(

            latexPackageManager
                .list()

        );

    }


    /* ======================================================
       RÉINITIALISER
    ====================================================== */

    function handleReset() {

        latexPackageManager.reset();

        setPackages(

            latexPackageManager
                .list()

        );

    }


    return (

        <Modal

            isOpen={
                isOpen
            }

            onClose={
                onClose
            }

            title="Gestionnaire de packages LaTeX"

            size="lg"

        >

            <div
                className="
                    flex
                    flex-col
                    gap-6
                "
            >

                {/* ==================================================
                    INTRODUCTION
                ================================================== */}

                <div
                    className="
                        rounded-lg
                        bg-gray-50
                        border
                        border-gray-200
                        p-4
                    "
                >

                    <p
                        className="
                            text-sm
                            text-gray-600
                        "
                    >

                        Packages actuellement utilisés
                        par le document LaTeX.

                    </p>

                </div>


                {/* ==================================================
                    LISTE
                ================================================== */}

                <div
                    className="
                        border
                        border-gray-200
                        rounded-lg
                        overflow-hidden
                    "
                >

                    <div
                        className="
                            px-4
                            py-3
                            bg-gray-50
                            border-b
                            border-gray-200
                            font-semibold
                        "
                    >

                        Packages installés

                    </div>


                    {

                        packages.length === 0

                            ? (

                                <div
                                    className="
                                        p-6
                                        text-center
                                        text-gray-500
                                    "
                                >

                                    Aucun package.

                                </div>

                            )

                            : (

                                <div
                                    className="
                                        divide-y
                                        divide-gray-200
                                    "
                                >

                                    {

                                        packages.map(

                                            name => (

                                                <div
                                                    key={name}
                                                    className="
                                                        flex
                                                        items-center
                                                        justify-between
                                                        px-4
                                                        py-3
                                                    "
                                                >

                                                    <div>

                                                        <div
                                                            className="
                                                                font-mono
                                                                text-sm
                                                            "
                                                        >

                                                            {name}

                                                        </div>

                                                        <div
                                                            className="
                                                                text-xs
                                                                text-gray-500
                                                            "
                                                        >

                                                            {
                                                                latexPackageManager
                                                                    .get(name)
                                                            }

                                                        </div>

                                                    </div>


                                                    <button

                                                        type="button"

                                                        onClick={() =>
                                                            handleRemove(name)
                                                        }

                                                        className="
                                                            px-3
                                                            py-1.5
                                                            text-sm
                                                            rounded-md
                                                            text-red-600
                                                            hover:bg-red-50
                                                        "

                                                    >

                                                        Supprimer

                                                    </button>

                                                </div>

                                            )

                                        )

                                    }

                                </div>

                            )

                    }

                </div>


                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div
                    className="
                        flex
                        justify-between
                        items-center
                        pt-2
                    "
                >

                    <button

                        type="button"

                        onClick={
                            handleReset
                        }

                        className="
                            px-4
                            py-2
                            rounded-md
                            border
                            border-gray-300
                            hover:bg-gray-50
                        "

                    >

                        Restaurer les packages
                        par défaut

                    </button>


                    <button

                        type="button"

                        onClick={
                            onClose
                        }

                        className="
                            px-4
                            py-2
                            rounded-md
                            bg-gray-900
                            text-white
                            hover:bg-gray-800
                        "

                    >

                        Fermer

                    </button>

                </div>

            </div>

        </Modal>

    );

}


export default LatexPackageModal;
