/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : FontGroup.jsx
 * Description : Groupe Police avec menus de couleurs et polices améliorés
 * ===========================================================
 */

import React, { useState, useRef, useEffect } from "react";
import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";
import { 
    Bold, Italic, Underline, Strikethrough, 
    Subscript, Superscript, Highlighter, 
    CaseUpper, RemoveFormatting, Palette,
    ChevronDown, Check
} from "lucide-react";

export default function FontGroup({ editor }) {
    const [isFontOpen, setIsFontOpen] = useState(false);
    const [isHighlightOpen, setIsHighlightOpen] = useState(false);
    const [isColorOpen, setIsColorOpen] = useState(false);

    const [fontCoords, setFontCoords] = useState({ top: 0, left: 0 });
    const [highlightCoords, setHighlightCoords] = useState({ top: 0, left: 0 });
    const [colorCoords, setColorCoords] = useState({ top: 0, left: 0 });

    const fontBtnRef = useRef(null);
    const fontDropdownRef = useRef(null);

    const highlightBtnRef = useRef(null);
    const highlightDropdownRef = useRef(null);

    const colorBtnRef = useRef(null);
    const colorDropdownRef = useRef(null);

    const currentFont = editor.getAttributes('textStyle').fontFamily || 'Calibri';
    const currentSize = editor.getAttributes('textStyle').fontSize?.replace('px', '') || '12';

    const fontCategories = [
        {
            title: "Polices de thème & Classiques",
            fonts: [
                "Aptos", "Aptos Display", "Aptos Narrow", 
                "Calibri", "Calibri Light", 
                "Arial", "Arial Black", "Arial Narrow", 
                "Times New Roman", "Georgia", "Garamond", 
                "Cambria", "Book Antiqua", "Palatino Linotype"
            ]
        },
        {
            title: "Sans-Serif & Modernes",
            fonts: [
                "Segoe UI", "Tahoma", "Verdana", "Trebuchet MS", 
                "Helvetica", "Century Gothic", "Franklin Gothic Medium", 
                "Bahnschrift", "Gill Sans MT", "Candara"
            ]
        },
        {
            title: "Chasse fixe (Code & Technique)",
            fonts: [
                "Courier New", "Consolas", "Cascadia Code", 
                "Lucida Console", "Monaco", "DejaVu Sans Mono"
            ]
        },
        {
            title: "Fantaisie & Manuscrites",
            fonts: [
                "Comic Sans MS", "Lucida Handwriting", "Bradley Hand ITC", 
                "Brush Script MT", "Papyrus", "Impact"
            ]
        }
    ];

    const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

    const colorsPalette = [
        "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
        "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
        "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
        "#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd",
        "#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0",
        "#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#0b5394", "#351c75", "#741b47",
        "#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130"
    ];

    const highlightColors = [
        "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#0000ff", 
        "#ff9900", "#e06666", "#b6d7a8", "#a4c2f4", "#d5a6bd", "#ffffff"
    ];

    // Gestion de l'ouverture des menus positionnés en fixed
    const toggleFontMenu = () => {
        if (!isFontOpen && fontBtnRef.current) {
            const rect = fontBtnRef.current.getBoundingClientRect();
            setFontCoords({ top: rect.bottom + 2, left: rect.left });
        }
        setIsFontOpen(!isFontOpen);
        setIsHighlightOpen(false);
        setIsColorOpen(false);
    };

    const toggleHighlightMenu = () => {
        if (!isHighlightOpen && highlightBtnRef.current) {
            const rect = highlightBtnRef.current.getBoundingClientRect();
            setHighlightCoords({ top: rect.bottom + 2, left: rect.left });
        }
        setIsHighlightOpen(!isHighlightOpen);
        setIsFontOpen(false);
        setIsColorOpen(false);
    };

    const toggleColorMenu = () => {
        if (!isColorOpen && colorBtnRef.current) {
            const rect = colorBtnRef.current.getBoundingClientRect();
            setColorCoords({ top: rect.bottom + 2, left: rect.left });
        }
        setIsColorOpen(!isColorOpen);
        setIsFontOpen(false);
        setIsHighlightOpen(false);
    };

    // Fermeture globale au clic extérieur
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                fontDropdownRef.current && !fontDropdownRef.current.contains(event.target) &&
                fontBtnRef.current && !fontBtnRef.current.contains(event.target) &&
                highlightDropdownRef.current && !highlightDropdownRef.current.contains(event.target) &&
                highlightBtnRef.current && !highlightBtnRef.current.contains(event.target) &&
                colorDropdownRef.current && !colorDropdownRef.current.contains(event.target) &&
                colorBtnRef.current && !colorBtnRef.current.contains(event.target)
            ) {
                setIsFontOpen(false);
                setIsHighlightOpen(false);
                setIsColorOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectFont = (font) => {
        editor.chain().focus().setFontFamily(font).run();
        setIsFontOpen(false);
    };

    const handleSelectHighlight = (color) => {
        editor.chain().focus().toggleHighlight({ color }).run();
        setIsHighlightOpen(false);
    };

    const handleSelectColor = (color) => {
        editor.chain().focus().setColor(color).run();
        setIsColorOpen(false);
    };

    return (
        <RibbonGroup title="Police" width="w-[285px]" hasDialogLauncher={true}>
            {/* Ligne 1 : Sélecteur de police + Taille + Options */}
            <div className="flex items-center gap-1 w-full mb-1 relative">
                
                {/* SÉLECTEUR DE POLICE */}
                <div className="relative">
                    <button
                        ref={fontBtnRef}
                        type="button"
                        onClick={toggleFontMenu}
                        className="h-[22px] w-[110px] text-xs border border-slate-300 rounded px-1 bg-white flex items-center justify-between focus:outline-none hover:border-slate-400"
                    >
                        <span className="truncate" style={{ fontFamily: currentFont }}>{currentFont}</span>
                        <ChevronDown size={12} className="text-slate-500 shrink-0 ml-1" />
                    </button>

                    {isFontOpen && (
                        <div 
                            ref={fontDropdownRef}
                            style={{ position: 'fixed', top: `${fontCoords.top}px`, left: `${fontCoords.left}px` }}
                            className="w-[240px] max-h-[320px] overflow-y-auto bg-white border border-slate-300 rounded shadow-2xl z-[99999] py-1 text-xs scrollbar-thin"
                        >
                            {fontCategories.map((cat, idx) => (
                                <div key={idx}>
                                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 select-none sticky top-0 z-10 backdrop-blur-sm bg-opacity-90">
                                        {cat.title}
                                    </div>
                                    {cat.fonts.map((font) => (
                                        <div
                                            key={font}
                                            onClick={() => handleSelectFont(font)}
                                            style={{ fontFamily: font }}
                                            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between text-sm ${currentFont === font ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                                        >
                                            <span className="truncate">{font}</span>
                                            {currentFont === font && <Check size={12} />}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sélecteur de taille */}
                <select 
                    className="h-[22px] w-[45px] text-xs border border-slate-300 rounded px-1 bg-white focus:outline-none"
                    value={currentSize}
                    onChange={(e) => editor.chain().focus().setMark('textStyle', { fontSize: `${e.target.value}px` }).run()}
                >
                    {fontSizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>

                <RibbonButton size="small" icon={CaseUpper} tooltip="Modifier la casse" />
                
                <RibbonButton 
                    size="small" 
                    icon={RemoveFormatting} 
                    tooltip="Effacer la mise en forme" 
                    onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} 
                />
            </div>

            {/* Ligne 2 : Boutons de formatage du texte */}
            <div className="flex items-center gap-0.5 relative">
                <RibbonButton size="small" icon={Bold} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
                <RibbonButton size="small" icon={Italic} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
                <RibbonButton size="small" icon={Underline} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
                <RibbonButton size="small" icon={Strikethrough} active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
                <RibbonButton size="small" icon={Subscript} active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()} />
                <RibbonButton size="small" icon={Superscript} active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()} />
                
                {/* SURLIGNAGE PERSONNALISÉ */}
                <div className="relative">
                    <div ref={highlightBtnRef}>
                        <RibbonButton 
                            size="small" 
                            icon={Highlighter} 
                            tooltip="Couleur de surbrillance du texte" 
                            onClick={toggleHighlightMenu} 
                        />
                    </div>

                    {isHighlightOpen && (
                        <div
                            ref={highlightDropdownRef}
                            style={{ position: 'fixed', top: `${highlightCoords.top}px`, left: `${highlightCoords.left}px` }}
                            className="bg-white border border-slate-300 rounded shadow-2xl z-[99999] p-2 w-[160px]"
                        >
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Couleurs de surbrillance</div>
                            <div className="grid grid-cols-4 gap-1">
                                {highlightColors.map((color) => (
                                    <div
                                        key={color}
                                        onClick={() => handleSelectHighlight(color)}
                                        style={{ backgroundColor: color }}
                                        className="w-7 h-6 rounded border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                                        title={color}
                                    />
                                ))}
                            </div>
                            <button 
                                onClick={() => { editor.chain().focus().unsetHighlight().run(); setIsHighlightOpen(false); }}
                                className="w-full mt-2 text-[11px] text-slate-600 hover:bg-slate-100 py-1 rounded border border-slate-200"
                            >
                                Aucune couleur
                            </button>
                        </div>
                    )}
                </div>

                {/* COULEUR DE POLICE PERSONNALISÉE */}
                <div className="relative">
                    <div ref={colorBtnRef}>
                        <RibbonButton 
                            size="small" 
                            icon={Palette} 
                            tooltip="Couleur de police" 
                            onClick={toggleColorMenu} 
                        />
                    </div>

                    {isColorOpen && (
                        <div
                            ref={colorDropdownRef}
                            style={{ position: 'fixed', top: `${colorCoords.top}px`, left: `${colorCoords.left}px` }}
                            className="bg-white border border-slate-300 rounded shadow-2xl z-[99999] p-3 w-[220px]"
                        >
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Couleurs standard & thème</div>
                            <div className="grid grid-cols-10 gap-1 mb-2">
                                {colorsPalette.map((color, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectColor(color)}
                                        style={{ backgroundColor: color }}
                                        className="w-4 h-4 rounded-sm border border-slate-300 cursor-pointer hover:scale-125 transition-transform"
                                        title={color}
                                    />
                                ))}
                            </div>
                            {/* Input natif discret en option additionnelle pour choisir une couleur sur mesure */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
                                <span>Personnalisée :</span>
                                <input 
                                    type="color" 
                                    className="w-6 h-6 border-0 cursor-pointer bg-transparent" 
                                    onChange={(e) => handleSelectColor(e.target.value)}
                                    title="Choisir une autre couleur"
                                />
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </RibbonGroup>
    );
}