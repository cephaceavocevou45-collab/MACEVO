# Déploiement Railway de MACEVO

Le dépôt contient deux applications Django distinctes. Le frontend actuel reste
hébergé sur Vercel pendant le déploiement du backend.

## Services

Créer un projet Railway relié au dépôt GitHub `cephaceavocevou45-collab/MACEVO`,
branche `main`, puis ajouter les services suivants. Pour les deux services
Django, choisir le répertoire racine `backend` et le builder Dockerfile.

| Service | Commande de démarrage | Domaine public |
| --- | --- | --- |
| `macevo-api` | `sh scripts/start-main.sh` | Oui |
| `macevo-ia` | `sh scripts/start-macevo-ia.sh` | Non, accès privé uniquement |
| PostgreSQL | Modèle PostgreSQL Railway | Non |

Le service PostgreSQL doit être référencé depuis `macevo-api` dans la variable
`DATABASE_URL`. Le service principal appelle l’IA avec l’URL privée Railway,
par exemple `http://${{macevo-ia.RAILWAY_PRIVATE_DOMAIN}}:${{macevo-ia.PORT}}`.

## Variables à configurer dans Railway

Régler ces variables depuis les paramètres Railway. Ne pas les ajouter au dépôt.

### `macevo-api`

- `ENVIRONMENT=production`
- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY` : secret généré pour Django
- `DJANGO_ALLOWED_HOSTS` : domaine Railway du service et domaine API personnalisé éventuel
- `DJANGO_CORS_ALLOWED_ORIGINS` : URL(s) HTTPS exacte(s) du frontend Vercel
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
- Garder le frontend Vercel actif jusqu’à ce que `/api/health/`, les connexions,
  les téléversements et les exports aient été vérifiés sur l’API Railway.
