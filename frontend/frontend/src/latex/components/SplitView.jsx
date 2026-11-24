/**
 * ============================================================
 * MACEVO
 *
 * Fichier : SplitView.jsx
 * Description : Vue divisée éditeur / aperçu LaTeX
 * Version : 1.0.0
 * ============================================================
 */

import React from "react";


function SplitView({

    left,
    right,

    leftWidth = "50%",

    className = "",

}) {

    return (

        <div
            className={`
                flex
                w-full
                h-full
                min-h-0
                overflow-hidden
                ${className}
            `}
        >

            <div
                className="
                    h-full
                    min-h-0
                    overflow-hidden
                "
                style={{
                    width: leftWidth
                }}
            >

                {left}

            </div>


            <div
                className="
                    h-full
                    min-h-0
                    flex-1
                    overflow-hidden
                    border-l
                    border-gray-300
                "
            >

                {right}

            </div>

        </div>

    );

}


export default SplitView;