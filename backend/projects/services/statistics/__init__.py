"""
==========================================================
MACEVO IA
Statistics Services
==========================================================
"""

from .words import WordStatistics
from .pages import PageStatistics
from .readability import ReadabilityStatistics
from .charts import ChartStatistics

__all__ = [
    "WordStatistics",
    "PageStatistics",
    "ReadabilityStatistics",
    "ChartStatistics",
]