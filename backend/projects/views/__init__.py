"""
==========================================================
MACEVO IA
Projects Views
==========================================================
"""

from .create import ProjectCreateView
from .list import ProjectListView
from .detail import ProjectDetailView
from .update import ProjectUpdateView
from .delete import ProjectDeleteView
from .search import ProjectSearchView
from .export import ProjectExportView
from .statistics import ProjectStatisticsView

__all__ = [
    "ProjectCreateView",
    "ProjectListView",
    "ProjectDetailView",
    "ProjectUpdateView",
    "ProjectDeleteView",
    "ProjectSearchView",
    "ProjectExportView",
    "ProjectStatisticsView",
]