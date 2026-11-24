from __future__ import annotations

import os

from core.ai.models.config import AIModelConfig
from core.ai.models.registry import ModelRegistry


def register_default_models() -> None:
    """
    Enregistre les modèles par défaut disponibles dans MACEVO IA.

    Providers actuellement pris en charge :
        - Ollama : modèle local
        - OpenAI  : modèle distant via API

    Ollama reste le modèle local principal par défaut.
    OpenAI est enregistré uniquement comme modèle disponible ;
    son utilisation effective dépend de la configuration de
    OPENAI_API_KEY.
    """

    # ============================================================
    # OLLAMA
    # ============================================================

    ollama_model = os.getenv(
        "OLLAMA_MODEL",
        "qwen3:1.7b",
    ).strip()

    if not ollama_model:
        ollama_model = "qwen3:1.7b"

    primary_config = AIModelConfig(
        model=ollama_model,
        provider="ollama",
        temperature=0.4,
        max_tokens=4096,
        top_p=0.9,
        supports_streaming=True,
        supports_tools=True,
        supports_vision=False,
        supports_reasoning=True,
        timeout=120,
        metadata={
            "role": "primary",
            "source": "ollama",
            "local": True,
        },
    )

    ModelRegistry.register(primary_config)

    # ------------------------------------------------------------
    # Modèle local de secours
    # ------------------------------------------------------------

    if ollama_model != "qwen3:1.7b":
        fallback_config = AIModelConfig(
            model="qwen3:1.7b",
            provider="ollama",
            temperature=0.4,
            max_tokens=4096,
            top_p=0.9,
            supports_streaming=True,
            supports_tools=True,
            supports_vision=False,
            supports_reasoning=True,
            timeout=120,
            metadata={
                "role": "fallback",
                "source": "ollama",
                "local": True,
            },
        )

        ModelRegistry.register(fallback_config)

    # ============================================================
    # OPENAI
    # ============================================================

    openai_model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    ).strip()

    if not openai_model:
        openai_model = "gpt-5.6-luna"

    openai_config = AIModelConfig(
        model=openai_model,
        provider="openai",
        temperature=0.4,
        max_tokens=4096,
        top_p=0.9,
        supports_streaming=True,
        supports_tools=True,
        supports_vision=True,
        supports_reasoning=True,
        timeout=120,
        metadata={
            "role": "cloud",
            "source": "openai",
            "local": False,
            "api_configured": bool(
                os.getenv("OPENAI_API_KEY", "").strip()
            ),
        },
    )

    ModelRegistry.register(openai_config)