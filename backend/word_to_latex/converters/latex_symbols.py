"""Normalize Unicode symbols for portable pdfLaTeX output."""

import unicodedata

UNICODE_LATEX_SYMBOLS = {
    "α": r"\ensuremath{\alpha}", "β": r"\ensuremath{\beta}",
    "γ": r"\ensuremath{\gamma}", "δ": r"\ensuremath{\delta}",
    "ε": r"\ensuremath{\epsilon}", "θ": r"\ensuremath{\theta}",
    "λ": r"\ensuremath{\lambda}", "μ": r"\ensuremath{\mu}",
    "π": r"\ensuremath{\pi}", "ρ": r"\ensuremath{\rho}",
    "σ": r"\ensuremath{\sigma}", "τ": r"\ensuremath{\tau}",
    "φ": r"\ensuremath{\phi}", "χ": r"\ensuremath{\chi}",
    "ψ": r"\ensuremath{\psi}", "ω": r"\ensuremath{\omega}",
    "Γ": r"\ensuremath{\Gamma}", "Δ": r"\ensuremath{\Delta}",
    "Θ": r"\ensuremath{\Theta}", "Λ": r"\ensuremath{\Lambda}",
    "Π": r"\ensuremath{\Pi}", "Σ": r"\ensuremath{\Sigma}",
    "Φ": r"\ensuremath{\Phi}", "Ψ": r"\ensuremath{\Psi}",
    "Ω": r"\ensuremath{\Omega}",
    "±": r"\ensuremath{\pm}", "×": r"\ensuremath{\times}",
    "÷": r"\ensuremath{\div}", "≤": r"\ensuremath{\leq}",
    "≥": r"\ensuremath{\geq}", "≠": r"\ensuremath{\neq}",
    "≈": r"\ensuremath{\approx}", "≡": r"\ensuremath{\equiv}",
    "∞": r"\ensuremath{\infty}", "∑": r"\ensuremath{\sum}",
    "∏": r"\ensuremath{\prod}", "∫": r"\ensuremath{\int}",
    "√": r"\ensuremath{\sqrt{}}", "∂": r"\ensuremath{\partial}",
    "∈": r"\ensuremath{\in}", "∉": r"\ensuremath{\notin}",
    "∝": r"\ensuremath{\propto}", "∇": r"\ensuremath{\nabla}",
    "→": r"\ensuremath{\rightarrow}", "←": r"\ensuremath{\leftarrow}",
    "↔": r"\ensuremath{\leftrightarrow}", "−": r"\ensuremath{-}",
    "•": r"\textbullet{}", "°": r"\ensuremath{^\circ}",
    "²": r"\ensuremath{^2}", "³": r"\ensuremath{^3}",
    "⁰": r"\ensuremath{^0}", "¹": r"\ensuremath{^1}",
    "₀": r"\ensuremath{_0}", "₁": r"\ensuremath{_1}",
    "₂": r"\ensuremath{_2}", "₃": r"\ensuremath{_3}",
    "½": r"\ensuremath{\frac{1}{2}}", "¼": r"\ensuremath{\frac{1}{4}}",
    "¾": r"\ensuremath{\frac{3}{4}}", "€": r"\texteuro{}",
    "©": r"\textcopyright{}", "®": r"\textregistered{}",
    "™": r"\texttrademark{}",
    "…": r"\ldots{}",
    "–": "--",
    "—": "---",
    "‘": "'",
    "’": "'",
    "“": "``",
    "”": "''",
    "\u00a0": "~",
    "\u00ad": "",
    "\ufe0e": "",
    "\ufe0f": "",
    "\u200d": "",
}


def replace_latex_symbols(value: str) -> str:
    value = unicodedata.normalize("NFC", value)
    output = []
    for char in value:
        replacement = UNICODE_LATEX_SYMBOLS.get(char)
        if replacement is not None:
            output.append(replacement)
            continue
        category = unicodedata.category(char)
        if ord(char) > 0xFFFF or category in {"So", "Co", "Cn"}:
            output.append(f"[U+{ord(char):04X}]")
            continue
        output.append(char)
    return "".join(output)
