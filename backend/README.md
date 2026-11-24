# MACEVO backend

## API utilisée par le frontend

Django REST Framework est l'API principale et la source de vérité des rapports. Lance-le depuis ce dossier avec `python manage.py runserver 127.0.0.1:8001`. Le frontend Vite relaie `/api/*` vers ce serveur.

Les services Express (`server.js`) et FastAPI (`app/main.py`) sont des serveurs LaTeX autonomes distincts ; le frontend actuel appelle les routes Django `/api/latex/` et `/api/word-to-latex/`. Ils ne remplacent pas l'API Django et ne partagent ni son authentification ni sa base de données.

## Configuration

Copier `backend/.env.example` vers l'unique fichier `backend/.env`. Les deux services Django (backend principal et `MACEVO_IA`) lisent ce même fichier. En développement, régler `DJANGO_DEBUG=True`. En déploiement, fournir une clé `DJANGO_SECRET_KEY` stable et aléatoire, garder `DJANGO_DEBUG=False`, puis définir `DJANGO_ALLOWED_HOSTS` et `DJANGO_CORS_ALLOWED_ORIGINS` avec les domaines réels.

Après une mise à jour du backend, appliquer les migrations avec `python manage.py migrate`.

## Service IA MACEVO_IA

Le chat du frontend passe par `assistant/` dans Django principal, qui conserve les conversations et relaie la génération vers `MACEVO_IA`. Le moteur IA n'est plus appelé directement par l'assistant principal.

1. Depuis `backend/MACEVO_IA`, lancer `python manage.py runserver 127.0.0.1:8100` avec le même environnement Python que le backend principal.
2. Laisser le backend principal écouter sur `127.0.0.1:8001`.
3. Renseigner `MACEVO_IA_BASE_URL` et `MACEVO_IA_SERVICE_TOKEN` une seule fois dans `backend/.env`.
4. Définir le fournisseur et le modèle IA dans ce même fichier (`AI_PROVIDER`, `AI_MODEL`, `OLLAMA_MODEL` ou `OPENAI_MODEL`). Ollama doit être lancé et le modèle local téléchargé si le fournisseur choisi est Ollama.

En développement local, le service IA accepte l'appel sans jeton uniquement lorsque `DJANGO_DEBUG=True`. En production, il refuse toute requête sans le jeton interne.
