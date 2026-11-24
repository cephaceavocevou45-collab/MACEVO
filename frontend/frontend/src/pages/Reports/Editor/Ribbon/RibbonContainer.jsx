/**
 * ===========================================================
 * MACEVO
 *
 * -----------------------------------------------------------
 * Fichier : RibbonContainer.jsx
 * Description : Conteneur principal du ruban MACEVO
 *               avec organisation de type Microsoft Word.
 * Version : 4.0.0
 * Statut  : Réorganisation interface
 * ===========================================================
 */

import RibbonTabs from "./RibbonTabs";
import Ribbon from "./Ribbon";

/* ============================================================
   CONTENEUR PRINCIPAL DU RUBAN
============================================================ */

function RibbonContainer() {

    return (

            <section
                className="
                    relative

                    z-50

                    flex
                    w-full
                    flex-col

                    bg-white

                    text-slate-900

                    border-b
                    border-slate-200

                    shadow-[0_1px_3px_rgba(15,23,42,0.08)]
                "
            >

                {/* ==================================================
                    BARRE DES ONGLETS
                ================================================== */}

                <div
                    className="
                        relative

                        z-20

                        flex
                        w-full
                        shrink-0

                        items-end

                        border-b
                        border-slate-200

                        bg-white
                    "
                >

                    <RibbonTabs />

                </div>


                {/* ==================================================
                    RUBAN
                ================================================== */}

                <div
                    className="
                        relative

                        z-10

                        w-full

                        overflow-hidden

                        bg-white
                    "
                >

                    <Ribbon />

                </div>

            </section>

    );

}


/* ============================================================
   EXPORT
============================================================ */

export default RibbonContainer;
