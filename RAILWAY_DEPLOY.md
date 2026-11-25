# Déploiement Railway de MACEVO

Le dépôt contient un frontend Vite/React et deux applications Django
distinctes. Les trois applications et PostgreSQL sont hébergés dans le même
projet Railway.

## Services

Créer un projet Railway relié au dépôt GitHub `cephaceavocevou45-collab/MACEVO`,
branche `main`, puis ajouter les services suivants. Pour les deux services
Django, choisir le répertoire racine `backend` et le builder Dockerfile.

| Service | Commande de démarrage | Domaine public |
| --- | --- | --- |
| `macevo-api` | `sh scripts/start-main.sh` | Oui |
| `macevo-ia` | `sh scripts/start-macevo-ia.sh` | Non, accès privé uniquement |
| `macevo-frontend` | `npm start` | Oui |
| PostgreSQL | Modèle PostgreSQL Railway | Non |

Racines de service : `/backend` pour les deux services Django et
`/frontend/frontend` pour le frontend Vite. Le service PostgreSQL doit être
référencé depuis `macevo-api` dans la variable `DATABASE_URL`. Le frontend
utilise `VITE_API_BASE_URL` pour joindre l’API publique Railway.

## Variables à configurer dans Railway

Régler ces variables depuis les paramètres Railway. Ne pas les ajouter au dépôt.

### `macevo-api`

- `ENVIRONMENT=production`
- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY` : secret généré pour Django
- `DJANGO_ALLOWED_HOSTS` : domaine Railway du service et domaine API personnalisé éventuel
- `DJANGO_CORS_ALLOWED_ORIGINS` : origine HTTPS exacte du frontend Railway
- `DATABASE_URL` : référence Railway vers le PostgreSQL de ce projet
- `MACEVO_IA_BASE_URL` : URL privée du service `macevo-ia`
- `MACEVO_IA_SERVICE_TOKEN` : jeton interne partagé avec `macevo-ia`
- `MACEVO_IA_TIMEOUT=120`
- `AI_PROVIDER` et la configuration du fournisseur choisi (`OLLAMA_BASE_URL`,
  `OLLAMA_MODEL`, ou nom et clé du fournisseur distant configuré)

### `macevo-ia`

- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY` : secret Django dédié
- `DJANGO_ALLOWED_HOSTS` : domaine privé Railway de `macevo-ia`
- `MACEVO_IA_SERVICE_TOKEN` : même jeton interne que celui utilisé par l’API
- `AI_PROVIDER` et la configuration du fournisseur IA choisi

### `macevo-frontend`

- `VITE_API_BASE_URL` : URL publique du backend suivie de `/api/`, par exemple
  `https://macevo-production.up.railway.app/api/`
- `VITE_GOOGLE_CLIENT_ID` : seulement si l’authentification Google est activée

Après avoir généré le domaine public du frontend, ajouter son origine HTTPS à
`DJANGO_CORS_ALLOWED_ORIGINS` sur `macevo-api`.

Les valeurs de secrets ne doivent être saisies que dans les paramètres Railway.
Ne pas les communiquer dans le dépôt, les journaux ou une conversation.

## Données et limites à régler avant la mise en production

- Le PostgreSQL Railway créé ici sera neuf. La base SQLite locale contient des
  données qui ne sont pas incluses dans GitHub ; ce déploiement ne les importe
  pas. Un transfert doit être planifié et vérifié séparément avant de basculer
  des utilisateurs.
- Attacher un volume Railway au service `macevo-api` sur `/app/media` pour
  conserver les pièces jointes, documents et fichiers générés entre les
  déploiements. Sans volume ou stockage objet, ces fichiers sont temporaires.
- MACEVO_IA n’a pas de stockage PostgreSQL partagé : ses anciennes tables ne
  doivent pas être fusionnées avec celles du backend principal.
- Le service IA ne répondra pas avec Ollama tant que `OLLAMA_BASE_URL` ne pointe
  pas vers un serveur Ollama accessible depuis Railway. Un Ollama local sur le
  PC n’est pas joignable depuis Railway. Sinon, configurer un fournisseur API.
- Le Dockerfile installe TeX Live, Biber et Tesseract. Cela augmente la durée de
  build, la taille de l’image et la consommation Railway. Vérifier le plan et le
  coût estimé avant d’activer les services.
- Vérifier `/api/health/`, l’authentification, les téléversements et les exports
  avec le domaine Railway du frontend avant de retirer l’ancien hébergement.
