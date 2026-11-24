/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : MainTexPanel.jsx
 * Description : Panneau principal du fichier main.tex
 * Version : 1.0.0
 * ==========================================================
 */

import LatexEditor from "../components/LatexEditor";

function MainTexPanel() {

    return (

        <div
            className="
                flex
                flex-col
                h-full
                w-full
                bg-white
            "
        >

            <LatexEditor />

        </div>

    );

}

export default MainTexPanel;