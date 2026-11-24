from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import RLock
from typing import Any, Dict, List, Optional
from uuid import uuid4


@dataclass
class MemoryItem:
    """
    Élément de mémoire de MACEVO_IA.

    La mémoire n'est pas limitée aux messages.
    Elle peut contenir une préférence, une décision, une contrainte,
    une information de projet ou un élément scientifique.
    """

    content: str
    memory_type: str = "general"
    importance: float = 0.5
    id: str = field(default_factory=lambda: str(uuid4()))
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def __post_init__(self) -> None:
        self.content = str(self.content).strip()

        if not self.content:
            raise ValueError(
                "Memory content cannot be empty"
            )

        self.memory_type = (
            str(self.memory_type).strip().lower()
            or "general"
        )

        self.importance = max(
            0.0,
            min(1.0, float(self.importance)),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "memory_type": self.memory_type,
            "importance": self.importance,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
        }


class MemoryStore:
    """
    Stockage de mémoire temporaire.

    Il sera ensuite possible de brancher :
        PostgreSQL
        Redis
        vector database
        recherche sémantique
        embeddings

    sans changer l'interface utilisée par le Context Engine.
    """

    def __init__(self, max_items: int = 500):
        if max_items <= 0:
            raise ValueError(
                "max_items must be greater than zero"
            )

        self.max_items = max_items

        self._items: Dict[str, MemoryItem] = {}

        self._lock = RLock()

    def save(
        self,
        memory: MemoryItem,
    ) -> MemoryItem:
        if not isinstance(memory, MemoryItem):
            raise TypeError(
                "memory must be a MemoryItem instance"
            )

        with self._lock:

            if (
                len(self._items) >= self.max_items
                and memory.id not in self._items
            ):
                oldest_id = min(
                    self._items,
                    key=lambda key: self._items[key].created_at,
                )

                del self._items[oldest_id]

            self._items[memory.id] = memory

        return memory

    def create(
        self,
        content: str,
        memory_type: str = "general",
        importance: float = 0.5,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryItem:

        memory = MemoryItem(
            content=content,
            memory_type=memory_type,
            importance=importance,
            user_id=user_id,
            project_id=project_id,
            metadata=metadata or {},
        )

        return self.save(memory)

    def get(
        self,
        memory_id: str,
    ) -> Optional[MemoryItem]:

        with self._lock:
            return self._items.get(memory_id)

    def delete(
        self,
        memory_id: str,
    ) -> None:

        with self._lock:
            self._items.pop(
                memory_id,
                None,
            )

    def search(
        self,
        query: str,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        limit: int = 10,
    ) -> List[MemoryItem]:
        """
        Recherche textuelle simple.

        Une recherche vectorielle pourra remplacer cette méthode
        ultérieurement.
        """

        query = str(query).strip().lower()

        if not query:
            return []

        if limit <= 0:
            return []

        with self._lock:
            candidates = list(
                self._items.values()
            )

        results = []

        for memory in candidates:

            if user_id is not None:
                if memory.user_id != user_id:
                    continue

            if project_id is not None:
                if memory.project_id != project_id:
                    continue

            content = memory.content.lower()

            if query in content:
                results.append(memory)

        results.sort(
            key=lambda item: (
                -item.importance,
                -item.created_at.timestamp(),
            )
        )

        return results[:limit]

    def list(
        self,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[MemoryItem]:

        with self._lock:
            items = list(
                self._items.values()
            )

        if user_id is not None:
            items = [
                item
                for item in items
                if item.user_id == user_id
            ]

        if project_id is not None:
            items = [
                item
                for item in items
                if item.project_id == project_id
            ]

        items.sort(
            key=lambda item: item.created_at,
            reverse=True,
        )

        return items[:limit]

    def clear(self) -> None:
        with self._lock:
            self._items.clear()