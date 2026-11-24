from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from uuid import uuid4

from core.ai.contracts.request import AIRequest
from core.ai.models.task import AITask, TaskType
from core.ai.capabilities.resolver import CapabilityResolver