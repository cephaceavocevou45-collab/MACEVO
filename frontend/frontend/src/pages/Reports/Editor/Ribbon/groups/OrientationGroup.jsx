/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : OrientationGroup.jsx
 * Version : 5.0.0
 * Statut  : Orientation Portrait / Paysage
 * ===========================================================
 */

import {
    RectangleVertical,
    RectangleHorizontal,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useLayoutContext } from "../../LayoutContext";

function OrientationGroup() {
    const layoutContext = useLayoutContext() || {};

    const {
        layout,
        setOrientation,
    } = layoutContext;

    const currentOrientation =
        layout?.orientation || "portrait";

    const handleOrientationChange = (orientation) => {
        if (typeof setOrientation !== "function") {
            return;
        }

        if (
            orientation !== "portrait" &&
            orientation !== "landscape"
        ) {
            return;
        }

        setOrientation(orientation);
    };

    return (
        <RibbonGroup
            title="Orientation"
            className="w-[145px] min-w-[145px]"
        >
            <div className="grid w-full grid-cols-2 gap-1">
                <RibbonButton
                    icon={RectangleVertical}
                    label="Portrait"
                    tooltip="Orienter les pages en portrait"
                    active={
                        currentOrientation ===
                        "portrait"
                    }
                    onClick={() =>
                        handleOrientationChange(
                            "portrait"
                        )
                    }
                />

                <RibbonButton
                    icon={RectangleHorizontal}
                    label="Paysage"
                    tooltip="Orienter les pages en paysage"
                    active={
                        currentOrientation ===
                        "landscape"
                    }
                    onClick={() =>
                        handleOrientationChange(
                            "landscape"
                        )
                    }
                />
            </div>
        </RibbonGroup>
    );
}

export default OrientationGroup;