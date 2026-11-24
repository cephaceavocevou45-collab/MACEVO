from __future__ import annotations

from typing import Any, Dict, List, Optional

from core.ai.memory.store import MemoryItem


class DjangoMemoryStore:
    """
    Store persistant des mémoires MACEVO IA.

    Cette classe relie le système de mémoire générique
    aux modèles Django de l'application assistant.
    """

    def __init__(self):
        pass

    @staticmethod
    def _model():
        from apps.assistant.models import Memory
        return Memory

    @staticmethod
    def _model_to_item(model) -> MemoryItem:
        return MemoryItem(
            id=str(model.id),
            content=model.content,
            memory_type=model.memory_type,
            importance=model.importance,
            user_id=model.user_id,
            project_id=model.project_id,
            metadata=dict(model.metadata or {}),
            created_at=model.created_at,
        )

    @staticmethod
    def _normalize_importance(importance: float) -> float:
        try:
            value = float(importance)
        except (TypeError, ValueError):
            value = 0.5

        return max(0.0, min(1.0, value))

    def create(
        self,
        content: str,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: str = "general",
        importance: float = 0.5,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryItem:
        if not isinstance(content, str):
            raise TypeError(
                "content doit être une chaîne de caractères."
            )

        content = content.strip()

        if not content:
            raise ValueError(
                "Le contenu de la mémoire ne peut pas être vide."
            )

        Memory = self._model()

        model = Memory.objects.create(
            user_id=user_id,
            project_id=project_id,
            memory_type=memory_type or "general",
            content=content,
            importance=self._normalize_importance(importance),
            metadata=dict(metadata or {}),
        )

        return self._model_to_item(model)

    def save(self, memory: MemoryItem) -> MemoryItem:
        if not isinstance(memory, MemoryItem):
            raise TypeError(
                "memory doit être une instance de MemoryItem."
            )

        Memory = self._model()

        model = Memory.objects.filter(
            id=memory.id
        ).first()

        if model is None:
            model = Memory(
                id=memory.id,
                user_id=memory.user_id,
                project_id=memory.project_id,
                memory_type=memory.memory_type,
                content=memory.content,
                importance=self._normalize_importance(
                    memory.importance
                ),
                metadata=dict(memory.metadata or {}),
            )
        else:
            model.user_id = memory.user_id
            model.project_id = memory.project_id
            model.memory_type = memory.memory_type
            model.content = memory.content
            model.importance = self._normalize_importance(
                memory.importance
            )
            model.metadata = dict(memory.metadata or {})

        model.save()

        return self._model_to_item(model)

    def get(
        self,
        memory_id: str,
    ) -> Optional[MemoryItem]:
        if not memory_id:
            return None

        Memory = self._model()

        model = Memory.objects.filter(
            id=memory_id
        ).first()

        if model is None:
            return None

        return self._model_to_item(model)

    def search(
        self,
        query: str = "",
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: Optional[str] = None,
        limit: int = 20,
    ) -> List[MemoryItem]:
        Memory = self._model()

        queryset = Memory.objects.all()

        if user_id is not None:
            queryset = queryset.filter(
                user_id=user_id
            )

        if project_id is not None:
            queryset = queryset.filter(
                project_id=project_id
            )

        if memory_type is not None:
            queryset = queryset.filter(
                memory_type=memory_type
            )

        query = (query or "").strip()

        if query:
            from django.db.models import Q

            queryset = queryset.filter(
                Q(content__icontains=query)
                | Q(memory_type__icontains=query)
            )

        queryset = queryset.order_by(
            "-importance",
            "-updated_at",
        )

        if limit > 0:
            queryset = queryset[:limit]

        return [
            self._model_to_item(model)
            for model in queryset
        ]

    def list(
        self,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: Optional[str] = None,
        limit: int = 100,
    ) -> List[MemoryItem]:
        return self.search(
            user_id=user_id,
            project_id=project_id,
            memory_type=memory_type,
            limit=limit,
        )

    def delete(self, memory_id: str) -> bool:
        if not memory_id:
            return False

        Memory = self._model()

        deleted, _ = Memory.objects.filter(
            id=memory_id
        ).delete()

        return deleted > 0

    def clear(
        self,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        memory_type: Optional[str] = None,
    ) -> int:
        Memory = self._model()

        queryset = Memory.objects.all()

        if user_id is not None:
            queryset = queryset.filter(
                user_id=user_id
            )

        if project_id is not None:
            queryset = queryset.filter(
                project_id=project_id
            )

        if memory_type is not None:
            queryset = queryset.filter(
                memory_type=memory_type
            )

        deleted, _ = queryset.delete()

        return deleted

    def count(
        self,
        *,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
    ) -> int:
        Memory = self._model()

        queryset = Memory.objects.all()

        if user_id is not None:
            queryset = queryset.filter(
                user_id=user_id
            )

        if project_id is not None:
            queryset = queryset.filter(
                project_id=project_id
            )

        return queryset.count()

    def exists(self, memory_id: str) -> bool:
        if not memory_id:
            return False

        Memory = self._model()

        return Memory.objects.filter(
            id=memory_id
        ).exists()
