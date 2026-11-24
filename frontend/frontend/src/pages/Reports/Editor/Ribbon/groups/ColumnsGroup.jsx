/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : ColumnsGroup.jsx
 * Description : Gestion des colonnes de la mise en page.
 * Version : 4.0.0
 * Statut  : Fonctionnel — frontend sécurisé
 * ===========================================================
 */

import {
    Columns,
    Columns2,
    Columns3,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useLayoutContext } from "../../LayoutContext";


function ColumnsGroup() {
    const layoutContext = useLayoutContext();

    const layout = layoutContext?.layout;
    const setColumns = layoutContext?.setColumns;

    const currentColumns =
        Number(layout?.columns) || 1;


    /* ======================================================
       CHANGEMENT DU NOMBRE DE COLONNES
       ====================================================== */

    function handleColumnsChange(value) {
        if (typeof setColumns !== "function") {
            console.warn(
                "MACEVO : setColumns n'est pas disponible dans LayoutContext."
            );

            return;
        }

        setColumns(value);
    }


    /* ======================================================
       RENDU
       ====================================================== */

    return (
        <RibbonGroup
            title="Colonnes"
            className="w-[190px] min-w-[190px]"
        >
            <div className="grid w-full grid-cols-3 gap-1">

                <RibbonButton
                    icon={Columns}
                    label="Une"
                    tooltip="Utiliser une colonne"
                    active={currentColumns === 1}
                    onClick={() =>
                        handleColumnsChange(1)
                    }
                />

                <RibbonButton
                    icon={Columns2}
                    label="Deux"
                    tooltip="Utiliser deux colonnes"
                    active={currentColumns === 2}
                    onClick={() =>
                        handleColumnsChange(2)
                    }
                />

                <RibbonButton
                    icon={Columns3}
                    label="Trois"
                    tooltip="Utiliser trois colonnes"
                    active={currentColumns === 3}
                    onClick={() =>
                        handleColumnsChange(3)
                    }
                />

            </div>
        </RibbonGroup>
    );
}


export default ColumnsGroup;