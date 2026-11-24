/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : EditingGroup.jsx
 * Description : Groupe Édition (Rechercher, Remplacer, Sélectionner)
 * ===========================================================
 */

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";
import { Search, Replace, MousePointerClick } from "lucide-react";

export default function EditingGroup({ editor, onSearchClick, onReplaceClick }) {
    return (
        <RibbonGroup title="Édition">
            <div className="flex flex-col gap-1 w-full">
                <RibbonButton 
                    size="small" 
                    icon={Search} 
                    label="Rechercher" 
                    onClick={onSearchClick} 
                />
                <RibbonButton 
                    size="small" 
                    icon={Replace} 
                    label="Remplacer" 
                    onClick={onReplaceClick} 
                />
                <RibbonButton 
                    size="small" 
                    icon={MousePointerClick} 
                    label="Sélectionner" 
                />
            </div>
        </RibbonGroup>
    );
}