import React, { useState } from "react";

import scientificCommands from "../scientificCommands";

const ScientificToolbar = ({ editor }) => {
    const [openMenu, setOpenMenu] = useState(null);

    if (!editor) return null;

    const toggleMenu = (menu) => {
        setOpenMenu(
            openMenu === menu ? null : menu
        );
    };

    const runCommand = (command) => {
        command(editor);
        setOpenMenu(null);
    };

    return (
        <div className="macevo-scientific-toolbar">

            {/* =================================================
                TEXTE
            ================================================= */}

            <div className="scientific-toolbar-group">

                <button
                    type="button"
                    onClick={() =>
                        runCommand(
                            scientificCommands.insertParagraph
                        )
                    }
                >
                    ¶ Texte
                </button>

                <button
                    type="button"
                    onClick={() =>
                        runCommand(
                            scientificCommands.insertQuote
                        )
                    }
                >
                    ❝ Citation
                </button>

                <button
                    type="button"
                    onClick={() =>
                        runCommand(
                            scientificCommands.insertNote
                        )
                    }
                >
                    📝 Note
                </button>

                <button
                    type="button"
                    onClick={() =>
                        runCommand(
                            scientificCommands.insertWarning
                        )
                    }
                >
                    ⚠️ Avertissement
                </button>

            </div>

            {/* =================================================
                MATHÉMATIQUES
            ================================================= */}

            <div className="scientific-toolbar-dropdown">

                <button
                    type="button"
                    onClick={() =>
                        toggleMenu("math")
                    }
                >
                    ∑ Mathématiques ▾
                </button>

                {openMenu === "math" && (
                    <div className="scientific-dropdown-menu">

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertEquation
                                )
                            }
                        >
                            ∑ Équation
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertEquationSystem
                                )
                            }
                        >
                            {`{ }`} Système d'équations
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertMatrix
                                )
                            }
                        >
                            ⬚ Matrice
                        </button>

                    </div>
                )}

            </div>

            {/* =================================================
                DONNÉES
            ================================================= */}

            <div className="scientific-toolbar-dropdown">

                <button
                    type="button"
                    onClick={() =>
                        toggleMenu("data")
                    }
                >
                    📊 Données ▾
                </button>

                {openMenu === "data" && (
                    <div className="scientific-dropdown-menu">

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertFigure
                                )
                            }
                        >
                            🖼️ Figure
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertTable
                                )
                            }
                        >
                            📋 Tableau
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertChart
                                )
                            }
                        >
                            📈 Graphique
                        </button>

                    </div>
                )}

            </div>

            {/* =================================================
                MATHS AVANCÉES
            ================================================= */}

            <div className="scientific-toolbar-dropdown">

                <button
                    type="button"
                    onClick={() =>
                        toggleMenu("proof")
                    }
                >
                    ∴ Preuves ▾
                </button>

                {openMenu === "proof" && (
                    <div className="scientific-dropdown-menu">

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertTheorem
                                )
                            }
                        >
                            Théorème
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertDefinition
                                )
                            }
                        >
                            Définition
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertLemma
                                )
                            }
                        >
                            Lemme
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertProposition
                                )
                            }
                        >
                            Proposition
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertCorollary
                                )
                            }
                        >
                            Corollaire
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertRemark
                                )
                            }
                        >
                            Remarque
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertExample
                                )
                            }
                        >
                            Exemple
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertProof
                                )
                            }
                        >
                            Démonstration
                        </button>

                    </div>
                )}

            </div>

            {/* =================================================
                PROGRAMMATION
            ================================================= */}

            <div className="scientific-toolbar-dropdown">

                <button
                    type="button"
                    onClick={() =>
                        toggleMenu("programming")
                    }
                >
                    💻 Programmation ▾
                </button>

                {openMenu === "programming" && (
                    <div className="scientific-dropdown-menu">

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertAlgorithm
                                )
                            }
                        >
                            ⚙️ Algorithme
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertCode
                                )
                            }
                        >
                            {"</>"} Code source
                        </button>

                    </div>
                )}

            </div>

            {/* =================================================
                RÉFÉRENCES
            ================================================= */}

            <div className="scientific-toolbar-dropdown">

                <button
                    type="button"
                    onClick={() =>
                        toggleMenu("references")
                    }
                >
                    🔗 Références ▾
                </button>

                {openMenu === "references" && (
                    <div className="scientific-dropdown-menu">

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertCitation
                                )
                            }
                        >
                            📚 Citation bibliographique
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                runCommand(
                                    scientificCommands.insertCrossReference
                                )
                            }
                        >
                            🔗 Référence croisée
                        </button>

                    </div>
                )}

            </div>

        </div>
    );
};

export default ScientificToolbar;