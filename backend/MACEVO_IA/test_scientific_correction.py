from core.document.ir import Document
from core.validation.scientific_correction import (
    ScientificConsistencyCorrector,
)


def main():
    print("=" * 80)
    print("TEST — CORRECTION SCIENTIFIQUE MACEVO")
    print("=" * 80)

    document = Document()

    document.metadata.title = (
        "Document scientifique de test"
    )

    section = document.add_section(
        "Résultats",
        level=1,
    )

    # ---------------------------------------------------------
    # Deux figures avec le même label
    # ---------------------------------------------------------

    figure_1 = section.add_figure(
        source="resultat_1.png",
        caption="Premier résultat.",
        label="fig:resultat",
    )

    figure_2 = section.add_figure(
        source="resultat_2.png",
        caption="Deuxième résultat.",
        label="fig:resultat",
    )

    # ---------------------------------------------------------
    # Références internes
    # ---------------------------------------------------------

    paragraph = section.add_paragraph(
        (
            "Le premier résultat est présenté dans "
            "\\ref{fig:resultat}. "
            "Une autre figure est présentée dans "
            "\\ref{fig:inconnue}."
        )
    )

    # ---------------------------------------------------------
    # Bibliographie
    # ---------------------------------------------------------

    document.add_reference(
        title="Article scientifique de test",
        authors=["Dupont"],
        year=2024,
        citation_key="dupont2024",
    )

    paragraph_2 = section.add_paragraph(
        (
            "Cette analyse est également discutée dans "
            "\\cite{dupont2024} et "
            "\\cite{source_inexistante2026}."
        )
    )

    # ---------------------------------------------------------
    # Correction
    # ---------------------------------------------------------

    corrector = ScientificConsistencyCorrector()

    result = corrector.correct_document(
        document
    )

    print()
    print("RESULTAT")
    print("-" * 80)

    print("VALID       :", result.valid)
    print(
        "CORRECTIONS :",
        result.correction_count,
    )
    print(
        "NON RÉSOLUES:",
        result.unresolved_count,
    )
    print(
        "AVERTISSEMENTS:",
        result.warning_count,
    )

    print()
    print("STATISTIQUES")
    print(result.statistics)

    print()
    print("CORRECTIONS")
    print("-" * 80)

    for correction in result.corrections:
        print(
            f"[{correction.severity.value.upper()}] "
            f"{correction.action.value} : "
            f"{correction.message}"
        )

    print()
    print("NON RÉSOLUES")
    print("-" * 80)

    for correction in result.unresolved:
        print(
            f"[{correction.severity.value.upper()}] "
            f"{correction.action.value} : "
            f"{correction.message}"
        )

    print()
    print("LABELS FINAUX")
    print("-" * 80)

    print(
        "Figure 1 :",
        figure_1.label,
    )

    print(
        "Figure 2 :",
        figure_2.label,
    )

    print()
    print("PARAGRAPHES")
    print("-" * 80)

    print(paragraph.content)
    print(paragraph_2.content)

    print()
    print("TEST TERMINÉ")
    print("=" * 80)


if __name__ == "__main__":
    main()