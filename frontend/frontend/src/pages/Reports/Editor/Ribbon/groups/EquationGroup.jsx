/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : EquationGroup.jsx
 * Description : Catalogue complet et massif d'équations et symboles scientifiques
 * ===========================================================
 */

import React, { useState, useRef, useEffect } from "react";
import RibbonGroup from "../components/RibbonGroup";
import { 
  Divide, Pi, Sigma, Infinity as InfinityIcon, 
  ArrowRight, ChevronDown 
} from "lucide-react";

export default function EquationGroup({ editor }) {
    const [isSymbolsOpen, setIsSymbolsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const symbolsBtnRef = useRef(null);
    const dropdownRef = useRef(null);

    // Catalogue massif et ultra-complet pour rapports scientifiques
    const scientificSymbols = [
        { 
            category: "Calcul & Analyse Avancée", 
            symbols: [
                { name: "Somme", latex: "\\sum_{i=1}^{n}", symbol: "∑" },
                { name: "Produit", latex: "\\prod_{i=1}^{n}", symbol: "∏" },
                { name: "Intégrale simple", latex: "\\int_{a}^{b} f(x) dx", symbol: "∫" },
                { name: "Intégrale double", latex: "\\iint_{D}", symbol: "∬" },
                { name: "Intégrale triple", latex: "\\iiint_{V}", symbol: "∭" },
                { name: "Intégrale curviligne", latex: "\\oint_{C}", symbol: "∮" },
                { name: "Dérivée partielle", latex: "\\frac{\\partial f}{\\partial x}", symbol: "∂" },
                { name: "Nabla / Gradient", latex: "\\nabla f", symbol: "∇" },
                { name: "Limite", latex: "\\lim_{x \\to \\infty}", symbol: "lim" },
                { name: "Infini", latex: "\\infty", symbol: "∞" },
                { name: "Radical / Racine", latex: "\\sqrt{x}", symbol: "√" },
                { name: "Racine n-ième", latex: "\\sqrt[n]{x}", symbol: "∜" }
            ]
        },
        { 
            category: "Algèbre Linéaire & Matrices", 
            symbols: [
                { name: "Matrice 2x2", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", symbol: "[M]" },
                { name: "Vecteur colonne", latex: "\\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}", symbol: "𝐕" },
                { name: "Produit scalaire", latex: "\\langle u, v \\rangle", symbol: "⟨⟩" },
                { name: "Norme de vecteur", latex: "\\| x \\|", symbol: "‖x‖" },
                { name: "Transposée", latex: "A^{T}", symbol: "Aᵀ" },
                { name: "Déterminant", latex: "\\det(A)", symbol: "det" },
                { name: "Somme directe", latex: "\\oplus", symbol: "⊕" },
                { name: "Produit tensoriel", latex: "\\otimes", symbol: "⊗" }
            ]
        },
        { 
            category: "Lettres Grecques (Complètes)", 
            symbols: [
                { name: "Alpha", latex: "\\alpha", symbol: "α" },
                { name: "Beta", latex: "\\beta", symbol: "β" },
                { name: "Gamma", latex: "\\gamma", symbol: "γ" },
                { name: "Delta", latex: "\\delta", symbol: "δ" },
                { name: "Epsilon", latex: "\\epsilon", symbol: "ε" },
                { name: "Zeta", latex: "\\zeta", symbol: "ζ" },
                { name: "Eta", latex: "\\eta", symbol: "η" },
                { name: "Theta", latex: "\\theta", symbol: "θ" },
                { name: "Kappa", latex: "\\kappa", symbol: "κ" },
                { name: "Lambda", latex: "\\lambda", symbol: "λ" },
                { name: "Mu", latex: "\\mu", symbol: "μ" },
                { name: "Nu", latex: "\\nu", symbol: "ν" },
                { name: "Xi", latex: "\\xi", symbol: "ξ" },
                { name: "Pi", latex: "\\pi", symbol: "π" },
                { name: "Rho", latex: "\\rho", symbol: "ρ" },
                { name: "Sigma", latex: "\\sigma", symbol: "σ" },
                { name: "Tau", latex: "\\tau", symbol: "τ" },
                { name: "Phi", latex: "\\phi", symbol: "φ" },
                { name: "Chi", latex: "\\chi", symbol: "χ" },
                { name: "Psi", latex: "\\psi", symbol: "ψ" },
                { name: "Omega", latex: "\\omega", symbol: "ω" },
                { name: "Gamma Maj.", latex: "\\Gamma", symbol: "Γ" },
                { name: "Delta Maj.", latex: "\\Delta", symbol: "Δ" },
                { name: "Theta Maj.", latex: "\\Theta", symbol: "Θ" },
                { name: "Lambda Maj.", latex: "\\Lambda", symbol: "Λ" },
                { name: "Xi Maj.", latex: "\\Xi", symbol: "Ξ" },
                { name: "Pi Maj.", latex: "\\Pi", symbol: "Π" },
                { name: "Sigma Maj.", latex: "\\Sigma", symbol: "Σ" },
                { name: "Phi Maj.", latex: "\\Phi", symbol: "Φ" },
                { name: "Psi Maj.", latex: "\\Psi", symbol: "Ψ" },
                { name: "Omega Maj.", latex: "\\Omega", symbol: "Ω" }
            ]
        },
        { 
            category: "Logique, Ensembles & Relations", 
            symbols: [
                { name: "Appartient", latex: "\\in", symbol: "∈" },
                { name: "N'appartient pas", latex: "\\notin", symbol: "∉" },
                { name: "Inclus (sous-ensemble)", latex: "\\subset", symbol: "⊂" },
                { name: "Inclus ou égal", latex: "\\subseteq", symbol: "⊆" },
                { name: "Union", latex: "\\cup", symbol: "∪" },
                { name: "Intersection", latex: "\\cap", symbol: "∩" },
                { name: "Ensemble vide", latex: "\\emptyset", symbol: "∅" },
                { name: "Ensembles usuels", latex: "\\mathbb{R}", symbol: "ℝ" },
                { name: "Quel que soit", latex: "\\forall", symbol: "∀" },
                { name: "Il existe", latex: "\\exists", symbol: "∃" },
                { name: "Implique", latex: "\\implies", symbol: "⟹" },
                { name: "Équivaut", latex: "\\iff", symbol: "⟺" },
                { name: "Par conséquent", latex: "\\therefore", symbol: "∴" },
                { name: "Parce que / Car", latex: "\\because", symbol: "∵" }
            ]
        },
        { 
            category: "Relations & Opérateurs Divers", 
            symbols: [
                { name: "Différent", latex: "\\neq", symbol: "≠" },
                { name: "Inférieur ou égal", latex: "\\leq", symbol: "≤" },
                { name: "Supérieur ou égal", latex: "\\geq", symbol: "≥" },
                { name: "Environ égal", latex: "\\approx", symbol: "≈" },
                { name: "Identique / Congru", latex: "\\equiv", symbol: "≡" },
                { name: "Proportionnel", latex: "\\propto", symbol: "∝" },
                { name: "Flèche droite", latex: "\\rightarrow", symbol: "→" },
                { name: "Flèche gauche", latex: "\\leftarrow", symbol: "←" },
                { name: "Flèche double", latex: "\\leftrightarrow", symbol: "↔" }
            ]
        }
    ];

    const toggleSymbolsMenu = () => {
        if (!isSymbolsOpen && symbolsBtnRef.current) {
            const rect = symbolsBtnRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 4, left: rect.left });
        }
        setIsSymbolsOpen(!isSymbolsOpen);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                symbolsBtnRef.current && !symbolsBtnRef.current.contains(event.target)
            ) {
                setIsSymbolsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Insertion via le nœud Tiptap personnalisé (MathNode) pour un rendu visuel immédiat
    const insertLatex = (latexCode) => {
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'mathNode',
            attrs: { latex: latexCode }
        }).run();
        setIsSymbolsOpen(false);
    };

    const insertStructure = (type) => {
        if (!editor) return;
        let latexTemplate = "";
        switch (type) {
            case 'fraction':
                latexTemplate = "\\frac{num}{den}";
                break;
            case 'pi':
                latexTemplate = "\\pi";
                break;
            case 'integrale':
                latexTemplate = "\\int_{0}^{1} f(x) dx";
                break;
            case 'somme':
                latexTemplate = "\\sum_{i=1}^{n} x_i";
                break;
            case 'infini':
                latexTemplate = "\\infty";
                break;
            default:
                latexTemplate = "";
        }
        if (latexTemplate) {
            editor.chain().focus().insertContent({
                type: 'mathNode',
                attrs: { latex: latexTemplate }
            }).run();
        }
    };

    return (
        <div className="flex items-center gap-4">
            {/* --- SECTION ÉQUATIONS RAPIDES --- */}
            <RibbonGroup title="Équations" width="w-auto">
                <div className="flex items-center gap-1 h-full px-1">
                    <button
                        type="button"
                        onClick={() => insertStructure('fraction')}
                        className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded border border-transparent hover:border-slate-300 transition-all cursor-pointer"
                        title="Insérer une Fraction"
                    >
                        <span className="text-base font-bold text-blue-600">÷</span>
                        <span className="text-[10px] text-slate-700 mt-0.5">Fraction</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => insertStructure('pi')}
                        className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded border border-transparent hover:border-slate-300 transition-all cursor-pointer"
                        title="Insérer Pi"
                    >
                        <span className="text-sm font-serif font-bold text-blue-600">π</span>
                        <span className="text-[10px] text-slate-700 mt-0.5">Pi</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => insertStructure('integrale')}
                        className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded border border-transparent hover:border-slate-300 transition-all cursor-pointer"
                        title="Insérer une Intégrale"
                    >
                        <span className="text-sm font-serif font-bold text-blue-600">∫</span>
                        <span className="text-[10px] text-slate-700 mt-0.5">Intégrale</span>
                    </button>
                </div>
            </RibbonGroup>

            <div className="h-10 w-[1px] bg-slate-200"></div>

            {/* --- SECTION SYMBOLES SCIENTIFIQUES --- */}
            <RibbonGroup title="Symboles" width="w-auto">
                <div className="flex items-center gap-1 h-full px-1 relative">
                    <button
                        type="button"
                        onClick={() => insertStructure('somme')}
                        className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded border border-transparent hover:border-slate-300 transition-all cursor-pointer"
                        title="Somme (Sigma)"
                    >
                        <span className="text-base font-bold text-slate-700">∑</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Somme</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => insertStructure('infini')}
                        className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded border border-transparent hover:border-slate-300 transition-all cursor-pointer"
                        title="Infini"
                    >
                        <span className="text-base font-bold text-slate-700">∞</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Infini</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => insertLatex("\\rightarrow")}
                        className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded border border-transparent hover:border-slate-300 transition-all cursor-pointer"
                        title="Flèche de transition"
                    >
                        <span className="text-base font-bold text-slate-700">→</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Flèche</span>
                    </button>

                    {/* Bouton catalogue géant */}
                    <div className="relative">
                        <button
                            ref={symbolsBtnRef}
                            type="button"
                            onClick={toggleSymbolsMenu}
                            className="flex flex-col items-center justify-center p-1.5 hover:bg-blue-50 rounded border border-transparent hover:border-blue-300 transition-all cursor-pointer bg-slate-50"
                            title="Catalogue massif de symboles scientifiques"
                        >
                            <div className="flex items-center gap-0.5">
                                <span className="text-sm font-bold text-blue-600">Ω ∑ ∫</span>
                                <ChevronDown size={10} className="text-slate-500" />
                            </div>
                            <span className="text-[10px] text-slate-700 mt-0.5">Catalogue</span>
                        </button>

                        {/* Fenêtre modale / Panneau déroulant massif et scrollable */}
                        {isSymbolsOpen && (
                            <div
                                ref={dropdownRef}
                                style={{ position: 'fixed', top: `${coords.top}px`, left: `${coords.left}px` }}
                                className="w-[440px] max-h-[500px] overflow-y-auto bg-white border border-slate-300 rounded-xl shadow-2xl z-[99999] p-4 text-xs flex flex-col gap-4 scrollbar-thin"
                            >
                                <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 flex justify-between items-center sticky top-0 bg-white z-10">
                                    <span>Catalogue Massif de Symboles & Équations</span>
                                    <span className="text-[10px] text-blue-600 font-normal">Mode Académique MACEVO</span>
                                </div>

                                {scientificSymbols.map((cat, idx) => (
                                    <div key={idx} className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cat.category}</span>
                                        <div className="grid grid-cols-6 gap-1.5">
                                            {cat.symbols.map((item, sIdx) => (
                                                <button
                                                    key={sIdx}
                                                    type="button"
                                                    onClick={() => insertLatex(item.latex)}
                                                    className="h-10 flex flex-col items-center justify-center text-xs font-serif bg-slate-50 hover:bg-blue-600 hover:text-white rounded border border-slate-200 transition-colors cursor-pointer shadow-sm group"
                                                    title={`${item.name} (${item.latex})`}
                                                >
                                                    <span className="text-sm font-bold">{item.symbol}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </RibbonGroup>
        </div>
    );
}