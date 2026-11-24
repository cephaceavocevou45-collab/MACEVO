/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : LayoutTab.jsx
 * Version : 5.0.0
 * Statut  : Fonctionnel (Standardisé sur InsertTab)
 * ===========================================================
 */

import RibbonDivider from "../components/RibbonDivider";

import BreaksGroup from "../groups/BreaksGroup";
import IndentGroup from "../groups/IndentGroup";
import SpacingGroup from "../groups/SpacingGroup";
import BackgroundGroup from "../groups/BackgroundGroup";
import WatermarkGroup from "../groups/WatermarkGroup";
import BordersGroup from "../groups/BordersGroup";
import LineNumbersGroup from "../groups/LineNumbersGroup";
import PaperGroup from "../groups/PaperGroup";
import OrientationGroup from "../groups/OrientationGroup";
import MarginsGroup from "../groups/MarginsGroup";
import ColumnsGroup from "../groups/ColumnsGroup";
import HeaderFooterGroup from "../groups/HeaderGroup";


function LayoutTab() {
    return (
        <div
            className="
                flex
                items-stretch
                overflow-x-auto
                px-2
                py-1
                bg-white
            "
        >
            <PaperGroup />

            <RibbonDivider />

            <OrientationGroup />

            <RibbonDivider />

            <MarginsGroup />

            <RibbonDivider />

            <ColumnsGroup />

            <RibbonDivider />

            <HeaderFooterGroup />

            <RibbonDivider />

            <BreaksGroup />

            <RibbonDivider />

            <IndentGroup />

            <RibbonDivider />

            <SpacingGroup />

            <RibbonDivider />

            <BackgroundGroup />

            <RibbonDivider />

            <WatermarkGroup />

            <RibbonDivider />

            <BordersGroup />

            <RibbonDivider />

            <LineNumbersGroup />
        </div>
    );
}


export default LayoutTab;
