# MACEVO Intelligence — état de vérification locale

Vérification mise à jour le 13 octobre 2026. Ce document distingue les essais réels des capacités qui restent à construire.

## Bases de données

- Le backend principal et MACEVO_IA lisent la configuration partagée `backend/.env`. Le backend principal utilise encore SQLite dans l’environnement courant, car `DATABASE_URL` n’y est pas configurée. MACEVO_IA conserve également son SQLite isolé : ses anciennes tables `assistant_*` ne sont pas compatibles avec celles du backend principal.
- PostgreSQL 15 est installé et le service local du port 5432 accepte les connexions. Une connexion en lecture seule avec les identifiants système par défaut est refusée faute de mot de passe ; aucune valeur n’a été devinée et aucune modification n’a été faite sur cette instance.
- Le pilote `psycopg[binary]` est installé dans l’environnement du backend et demeure déclaré dans `requirements.txt`.
- Pour vérifier Django sans toucher au service ou aux bases locales, un cluster PostgreSQL UTF-8 jetable a été démarré sur le port 55432. Toutes les migrations Django et la suite backend ciblée y ont été exécutées. Ce résultat valide la compatibilité technique des migrations avec PostgreSQL, mais ne migre pas les données locales ni la production.
- Les données des deux SQLite demeurent préservées. Toute bascule réelle requiert un `DATABASE_URL` autorisé, une sauvegarde vérifiée de la base et des médias, un export/import contrôlé et une comparaison des comptes avant changement de trafic.
- Deux commandes de migration contrôlée sont disponibles : `python manage.py export_postgres_migration_bundle --output-dir <nouveau-dossier>` crée une copie SQLite, un fixture UTF-8, l’archive des médias et leurs empreintes ; `python manage.py import_postgres_migration_bundle <dossier-du-bundle> --confirm-empty-database` vérifie ces empreintes puis refuse toute cible PostgreSQL qui contient déjà des données applicatives ou tout fichier média en collision. L’export ne modifie pas la source. L’import restaure dans une transaction et nettoie les seuls médias créés si l’import échoue.
- Ces commandes ont été testées sur une base source de test et sur PostgreSQL jetable. Aucune n’a été lancée contre les bases utilisateur ou de production. Un bundle contient une sauvegarde complète et des fichiers personnels : son dossier de sortie doit être neuf, à accès restreint, stocké de façon chiffrée et conservé selon la politique de l’établissement. L’import réel devra être précédé d’une sauvegarde distincte de la cible et d’une vérification humaine des comptes/données.

## Ollama, MACEVO_IA et assistant

- L’API Ollama locale répond. Le modèle configuré `qwen3:1.7b` est installé. Un appel réel `/api/generate` a terminé avec la réponse `4` à la question `2+2`.
- Le client Django a effectué un appel réel à MACEVO_IA et reçu une réponse du modèle. Un parcours réel par l’API principale a également retourné HTTP 200 et le journal applicatif indique que la réponse a été enregistrée.
- Le streaming réel MACEVO_IA a émis 345 événements, dont des fragments de contenu, sans événement d’erreur.
- Une génération réelle de plan scientifique a retourné trois chapitres, les a sauvegardés à l’état `needs_review`, puis l’endpoint de validation a enregistré `validated` et son horodatage.
- Une réponse de conversation de suivi a dépassé le délai MACEVO_IA configuré à 120 secondes. Une réponse très courte du petit modèle a aussi ajouté une affirmation non demandée. La chaîne existe, mais sa latence et sa fiabilité scientifique ne sont pas encore garanties pour des échanges longs.
- L’accès sans jeton au endpoint MACEVO_IA a retourné HTTP 403 ; le jeton configuré n’a jamais été affiché.

## Mémoire, imports et recherche documentaire

- `ProjectMemory` distingue les faits utilisateur/extraits, décisions validées, suggestions IA, contraintes, tâches et contexte. Les échanges projet injectent les seules mémoires validées/actives du propriétaire et du projet attaché. Les tests vérifient que les mémoires d’un autre projet ne sont pas incluses et que l’accès d’un autre utilisateur est refusé.
- `DocumentService` accepte actuellement PDF, DOCX, TXT, JPG, JPEG et PNG pour les pièces jointes et le dépôt projet. Les pièces jointes envoyées directement dans une conversation servent encore au seul message courant ; l’index persistant décrit ci-dessous passe par l’API documentaire du projet.
- Un dépôt documentaire persistant par projet vient d’être ajouté : `POST /api/projects/<project_id>/documents/` accepte le champ multipart `file`, applique les validations de `DocumentService`, calcule une empreinte SHA‑256, extrait le texte et conserve le fichier, le texte et des fragments avec offsets. Un même fichier n’est pas indexé deux fois dans le même projet. `GET /api/projects/<project_id>/documents/` liste les documents ; `GET .../documents/?q=<termes>` retourne des extraits avec nom du document, identifiant du fragment et offsets ; `GET .../documents/<document_id>/download/` sert le fichier en pièce jointe après contrôle d’accès ; `DELETE .../documents/<document_id>/` supprime le document du projet. La recherche lexicale est initiale (pas vectorielle) ; les pages/sections restent nulles lorsque l’extracteur ne les fournit pas.
- Les questions d’une conversation rattachée à un projet récupèrent jusqu’à quatre passages lexicaux de ce même projet et les transmettent comme contexte système avec leur provenance documentaire. Les tests valident l’upload TXT, la recherche, l’idempotence des doublons, l’accès refusé à un autre utilisateur et l’absence de fuite d’un autre projet. À la date de cette mise à jour, l’interface frontend n’est pas encore raccordée au dépôt documentaire ; l’API est disponible mais l’expérience d’import/recherche n’est pas encore exposée dans l’application.
- La migration `projects.0006_projectdocument_projectdocumentchunk_and_more` a été créée et appliquée dans les tests SQLite. Les quatre tests documentaires ciblés passent ; la suite backend ciblée élargie a passé 37 tests sur SQLite (2 ignorés selon le moteur). La migration 0006 n’a pas encore été rejouée sur le cluster PostgreSQL temporaire utilisé dans la vérification précédente.
- Tesseract est installé, mais les langues françaises ne sont pas disponibles dans cet environnement ; la reconnaissance OCR française reste à installer/vérifier. PPTX, XLSX, LaTeX et ZIP ne font pas partie des formats actuellement acceptés par `DocumentService`.

## Génération, références, cohérence et progression

- Le projet persiste le profil scientifique et le plan. La génération du plan et sa validation sont vérifiées. Les chapitres et sections détaillés ne sont pas encore synchronisés dans les modèles enfants `ProjectChapter` / `ProjectSection` par ce parcours ; la génération section par section, ses états de reprise, ses versions et la validation de contenu restent à implémenter.
- `ProjectReference` fournit une entité locale, mais aucune vérification réelle Crossref/OpenAlex/PubMed/Semantic Scholar n’a été validée dans ce lot ; aucune référence n’est donc annoncée comme vérifiée par un service externe.
- Le contrôle global de cohérence scientifique et le calcul d’avancement basé sur les tâches réelles ne sont pas encore raccordés à un workflow persistant complet.

## Exports

- La génération du document structurée par `DocumentBuilder` échouait car le builder d’instance était appelé comme une méthode de classe. Cette invocation a été corrigée.
- La vue d’export transmettait un argument `export_format` non accepté par `ExportService.export`; elle transmet maintenant `format`.
- L’export ZIP du projet produit `main.tex`, les figures enregistrées disponibles, `preview.pdf` et `README.md`. Le README précise que le PDF d’aperçu est rendu par le moteur PDF MACEVO et n’est pas présenté comme le résultat d’une compilation du source.
- Un ZIP réel a été ouvert et contrôlé (`testzip` sans erreur). Son source, avec une figure relative incluse, a été compilé localement par MiKTeX/pdfLaTeX avec `-no-shell-escape` : PDF créé, 5 pages, 114 521 octets. La compilation n’est pas encore proposée par l’API de production : un service sûr doit imposer un bac à sable système, un timeout et des limites de ressources.
- Le préambule LaTeX utilise désormais le paquet de base `url` au lieu de `xurl`, absent de l’installation MiKTeX vérifiée.

## Sécurité et limites de cette vérification

- Les tests d’API vérifient l’ownership des projets, des conversations/mémoires et des exports. Les archives sont créées avec des noms internes contrôlés et remplacées atomiquement.
- Les essais qui créaient des utilisateurs/projets de test étaient exécutés dans des transactions annulées. Le cluster PostgreSQL temporaire ne contenait pas de données de l’utilisateur.
- Aucun import, transfert, suppression ou basculement de base existante n’a été effectué. Aucun déploiement ou push n’a été exécuté.
- Les interfaces frontend ne présentent pas encore l’ensemble des états backend pour la génération de sections, les références vérifiées, la mémoire documentaire, la cohérence et les exports de projet.
