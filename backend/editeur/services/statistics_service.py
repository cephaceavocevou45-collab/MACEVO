"""
MACEVO — Statistiques scientifiques du document.
"""

import re

from .document_service import build_document


class DocumentStatisticsService:

    WORDS_PER_PAGE = 500
    WORDS_PER_MINUTE = 200

    def compute(self, report):
        document = build_document(
            report
        )

        statistics = dict(
            document["statistics"]
        )

        words = statistics["words"]

        statistics["estimated_pages"] = max(
            1,
            (words + self.WORDS_PER_PAGE - 1)
            // self.WORDS_PER_PAGE,
        )

        statistics["reading_time"] = max(
            1,
            (words + self.WORDS_PER_MINUTE - 1)
            // self.WORDS_PER_MINUTE,
        )

        statistics["figures"] = len(
            document["figures"]
        )

        statistics["equations"] = len(
            document["math"]
        )

        statistics["characters_without_spaces"] = len(
            re.sub(
                r"\s+",
                "",
                report.content or "",
            )
        )

        return statistics