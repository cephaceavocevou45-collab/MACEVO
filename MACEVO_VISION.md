# MACEVO INTELLIGENCE — VISION ET CAHIER DES CHARGES GLOBAL

**Nom du projet :** MACEVO Intelligence  
**Nature :** Plateforme intelligente d'accompagnement à la recherche scientifique et à la rédaction académique  
**Vision :** Accompagner les étudiants et les chercheurs de la naissance d'une idée jusqu'à la production d'un document scientifique complet, cohérent, vérifiable et professionnel.  
**Langue principale :** Français  
**Langues complémentaires :** Anglais et autres langues selon les capacités des modèles  
**Architecture actuelle :** Frontend React + Backend Django REST Framework + PostgreSQL (cible) + Ollama pour l'intelligence artificielle  
**Statut :** Projet en développement continu

---

## 1. VISION GÉNÉRALE

MACEVO Intelligence a pour ambition de devenir une plateforme complète d'assistance scientifique capable d'accompagner un étudiant ou un chercheur tout au long de son travail académique.

La plateforme ne doit pas être un simple chatbot qui répond à des questions ou génère quelques paragraphes. Elle doit se comporter comme un véritable environnement de travail scientifique, capable de comprendre un projet, de conserver son contexte, de suivre son évolution, d'analyser les documents fournis, de guider les décisions méthodologiques et d'aider à produire un document final structuré.

L'utilisateur doit pouvoir commencer avec une simple idée, même imprécise, et être accompagné progressivement jusqu'à la finalisation de son travail.

MACEVO doit notamment permettre de :

- Comprendre et préciser le sujet de recherche.
- Identifier un problème scientifique pertinent.
- Construire une problématique cohérente.
- Formuler des questions de recherche.
- Définir des objectifs généraux et spécifiques.
- Formuler des hypothèses lorsque le type de recherche le justifie.
- Choisir une méthodologie adaptée.
- Construire un plan détaillé.
- Organiser les chapitres et les sections.
- Rechercher et vérifier des références scientifiques.
- Importer et analyser des documents existants.
- Rédiger progressivement chaque partie.
- Relire, corriger et améliorer les textes.
- Vérifier la cohérence scientifique de l'ensemble.
- Préparer les éléments préliminaires et les annexes.
- Générer des fichiers PDF, ZIP et LaTeX réellement exploitables.
- Reprendre un projet plusieurs jours ou plusieurs mois après sans perdre son historique ni son contexte.

L'objectif final est de fournir un accompagnement scientifique de bout en bout, sans supprimer le rôle essentiel de l'étudiant, du chercheur ou de son encadreur dans la validation des choix et des résultats.

---

## 2. TYPES DE DOCUMENTS À PRENDRE EN CHARGE

La plateforme doit pouvoir s'adapter à plusieurs catégories de travaux.

### 2.1 Travaux universitaires

- Mémoires de licence.
- Mémoires de master.
- Projets de fin d'études (PFE).
- Rapports de stage.
- Thèses de doctorat.
- Travaux de recherche.
- Articles scientifiques.
- Revues de littérature.
- Rapports techniques.
- Rapports professionnels.
- Documents de recherche interdisciplinaires.

### 2.2 Adaptation selon le niveau

La profondeur du contenu, le vocabulaire, les exigences méthodologiques et la structure doivent dépendre du niveau académique.

Un rapport de licence ne doit pas être traité exactement comme une thèse de doctorat.

La plateforme doit tenir compte :

- Du niveau d'étude.
- Du domaine scientifique.
- Du type de document.
- Du sujet.
- Des exigences de l'établissement.
- Des consignes de l'encadreur.
- De la langue de rédaction.
- Du volume attendu.
- Des contraintes méthodologiques propres au domaine.

### 2.3 Adaptation selon la discipline

MACEVO doit être conçu pour accueillir progressivement différentes disciplines :

- Médecine et sciences de la santé.
- Pharmacie.
- Biologie et sciences de la vie.
- Informatique.
- Intelligence artificielle.
- Mathématiques.
- Physique.
- Chimie.
- Sciences de l'ingénieur.
- Sciences économiques.
- Gestion.
- Droit.
- Sciences humaines et sociales.
- Sciences de l'éducation.
- Agronomie.
- Environnement.
- Autres domaines scientifiques.

Les structures proposées doivent être adaptées au domaine. Une recherche expérimentale en médecine ne doit pas suivre automatiquement le même plan qu'une étude en économie ou qu'un projet informatique.

---

## 3. PRINCIPES FONDAMENTAUX

### 3.1 Qualité scientifique avant quantité

Les documents doivent être suffisamment développés pour répondre aux exigences académiques.

Pour les travaux concernés, MACEVO doit viser un volume d'au moins 30 pages lorsque les exigences institutionnelles et la nature du sujet le justifient.

Cependant, la plateforme ne doit jamais augmenter artificiellement le nombre de pages par des répétitions, des paragraphes vides ou des développements sans valeur scientifique.

Le volume doit résulter de la pertinence, de la profondeur et de la qualité du contenu.

Une thèse de doctorat peut nécessiter un volume beaucoup plus important qu'un mémoire de licence.

### 3.2 Progression étape par étape

La rédaction doit être progressive.

L'IA ne doit pas générer automatiquement un document entier sans validation de l'utilisateur.

Le processus privilégié est :

1. Compréhension du besoin.
2. Clarification du sujet.
3. Proposition de structure.
4. Validation du plan.
5. Rédaction progressive.
6. Révision et validation des sections.
7. Vérification de la cohérence.
8. Assemblage du document.
9. Contrôle qualité.
10. Exportation.

L'utilisateur doit pouvoir modifier les propositions de l'IA à chaque étape.

### 3.3 Continuité du travail

Un projet scientifique peut durer plusieurs mois.

MACEVO doit donc conserver les informations essentielles du projet et permettre sa reprise sans obliger l'utilisateur à tout expliquer de nouveau.

### 3.4 Transparence

La plateforme doit distinguer clairement :

- Les informations fournies par l'utilisateur.
- Les informations extraites de documents.
- Les propositions de l'IA.
- Les faits appuyés par des sources vérifiées.
- Les exemples hypothétiques.
- Les éléments qui nécessitent une validation humaine.

### 3.5 Fiabilité

MACEVO ne doit jamais prétendre avoir effectué une opération qui n'a pas réellement été réalisée.

Un fichier ne doit pas être présenté comme généré si sa création a échoué.

Une référence ne doit pas être déclarée vérifiée si aucune vérification n'a été effectuée.

Un document ne doit pas être annoncé comme complet si des sections essentielles sont absentes.

---

## 4. GESTION INTELLIGENTE DES PROJETS

Chaque utilisateur doit pouvoir créer plusieurs projets scientifiques indépendants.

Chaque projet doit disposer d'un espace de travail persistant contenant notamment :

- Identifiant du projet.
- Propriétaire.
- Titre.
- Domaine scientifique.
- Type de document.
- Niveau académique.
- Sujet.
- Problématique.
- Questions de recherche.
- Objectifs.
- Hypothèses, si pertinentes.
- Méthodologie.
- Pays et établissement.
- Consignes institutionnelles.
- Consignes de l'encadreur.
- Langue de rédaction.
- Plan validé.
- Chapitres et sections.
- Documents importés.
- Références bibliographiques.
- Conversations associées.
- Historique des modifications.
- Versions successives.
- État d'avancement.
- Fichiers exportés.
- Dates de création et de mise à jour.

### 4.1 Mémoire de projet

L'IA doit disposer d'une mémoire propre à chaque projet.

Elle doit pouvoir retrouver les décisions précédentes, les objectifs validés, les éléments méthodologiques et les informations pertinentes sans mélanger les projets de différents utilisateurs.

### 4.2 Suivi de progression

Chaque projet doit disposer d'un indicateur d'avancement fondé sur les tâches réellement accomplies.

L'interface peut présenter :

- Étapes terminées.
- Étapes en cours.
- Étapes à valider.
- Sections incomplètes.
- Documents manquants.
- Prochaines actions recommandées.

Le pourcentage d'avancement ne doit pas être arbitraire : il doit être calculé à partir d'étapes définies.

---

## 5. ASSISTANT SCIENTIFIQUE INTELLIGENT

L'assistant constitue le cœur fonctionnel de MACEVO.

Il doit dépasser le fonctionnement d'une conversation classique en utilisant le contexte du projet, les documents fournis, les outils disponibles et les étapes de rédaction.

### 5.1 Capacités attendues

L'assistant doit pouvoir :

- Expliquer des concepts scientifiques.
- Aider à choisir ou préciser un sujet.
- Identifier les ambiguïtés d'une problématique.
- Proposer des plans argumentés.
- Expliquer les avantages et limites de différentes méthodologies.
- Aider à construire des questionnaires et des guides d'entretien.
- Aider à organiser des données fournies par l'utilisateur.
- Améliorer la rédaction académique.
- Corriger les fautes de langue.
- Reformuler sans modifier le sens.
- Résumer des documents.
- Comparer plusieurs textes.
- Identifier des contradictions.
- Expliquer des tableaux et des résultats fournis.
- Proposer des pistes d'amélioration.
- Préparer des éléments de soutenance.
- Répondre aux questions sur le projet en cours.

### 5.2 Comportement scientifique

L'assistant doit adopter une posture rigoureuse.

Il doit signaler les informations manquantes plutôt que les inventer.

Il doit poser des questions de clarification lorsque les données fournies sont insuffisantes.

Il doit distinguer les recommandations méthodologiques des faits scientifiques établis.

Il doit éviter les affirmations catégoriques lorsqu'il ne dispose pas de preuves suffisantes.

### 5.3 Architecture évolutive

Ollama est actuellement la solution privilégiée pour l'exécution locale des modèles.

L'architecture doit cependant permettre de remplacer ou de compléter le modèle actuel sans réécrire toute l'application.

Les fournisseurs d'IA doivent être isolés derrière une couche d'abstraction.

Les capacités réelles du modèle actif doivent être connues et prises en compte : taille du contexte, longueur de sortie, multimodalité, temps de réponse et ressources matérielles disponibles.

---

## 6. IMPORTATION ET ANALYSE DES DOCUMENTS

L'utilisateur doit pouvoir fournir ses propres documents afin que MACEVO les analyse et les utilise comme contexte de travail.

### 6.1 Formats souhaités

- PDF.
- DOCX.
- TXT.
- JPG et JPEG.
- PNG.
- PPTX.
- XLSX.
- Fichiers LaTeX.
- Archives ZIP contenant les sources d'un projet.

La prise en charge de chaque format doit être vérifiée techniquement avant d'être annoncée comme opérationnelle.

### 6.2 Analyse documentaire

La plateforme doit pouvoir :

- Extraire le texte.
- Identifier les titres et sous-titres.
- Reconnaître les chapitres et les sections.
- Préserver les informations de page lorsque cela est possible.
- Repérer les tableaux.
- Extraire les métadonnées disponibles.
- Identifier les références bibliographiques.
- Résumer le contenu.
- Répondre à des questions sur le document.
- Comparer plusieurs documents.
- Identifier les passages pertinents pour une section donnée.

### 6.3 Traçabilité

Lorsque l'assistant s'appuie sur un document importé, il doit pouvoir indiquer la page, la section ou le passage concerné lorsque cette information est disponible.

Il doit signaler les limites d'extraction, notamment pour les tableaux complexes, les formules, les images et les documents numérisés.

### 6.4 OCR et documents numérisés

L'OCR doit être amélioré pour les documents en français.

Les limites des moteurs OCR doivent être prises en compte, particulièrement pour les formules mathématiques, les graphiques, les tableaux et les documents de mauvaise qualité.

La plateforme ne doit pas prétendre avoir compris visuellement un élément qu'elle n'a pas réellement analysé.

---

## 7. RECHERCHE SCIENTIFIQUE ET RÉFÉRENCES

La recherche bibliographique est une composante essentielle de la qualité scientifique de MACEVO.

### 7.1 Sources envisagées

Selon le domaine, la plateforme pourra exploiter :

- Crossref.
- OpenAlex.
- PubMed.
- Semantic Scholar.
- Des dépôts institutionnels.
- Des revues scientifiques.
- Des sources officielles et universitaires.

L'utilisation de ces services doit respecter leurs conditions d'accès, leurs limites techniques et leurs politiques de données.

### 7.2 Vérification des références

Chaque référence présentée comme vérifiée doit correspondre à des métadonnées réellement récupérées.

Lorsque disponibles, les éléments à contrôler comprennent :

- Titre.
- Auteurs.
- Année de publication.
- Revue ou éditeur.
- DOI.
- URL.
- Type de publication.

### 7.3 Interdiction des références inventées

L'IA ne doit jamais fabriquer :

- Un auteur.
- Un titre d'article.
- Un DOI.
- Une revue.
- Une date de publication.
- Une donnée expérimentale.
- Un résultat de recherche.
- Une citation présentée comme authentique.

Si une référence ne peut pas être vérifiée, elle doit être signalée comme non vérifiée.

Les exemples fictifs doivent être explicitement étiquetés comme tels.

### 7.4 Bibliographie

Le système doit pouvoir construire une bibliographie à partir des références enregistrées et appliquer différents styles bibliographiques selon les exigences du document.

---

## 8. GÉNÉRATION PROGRESSIVE DES DOCUMENTS

MACEVO doit permettre de construire un document scientifique complet, de la page de couverture à la conclusion, en passant par les éléments préliminaires et les annexes.

### 8.1 Éléments préliminaires possibles

Selon le type de document et les consignes de l'établissement :

- Page de couverture.
- Page de titre.
- Dédicace.
- Remerciements.
- Épigraphe.
- Résumé.
- Abstract.
- Mots-clés.
- Liste des sigles et abréviations.
- Liste des tableaux.
- Liste des figures.
- Table des matières.

Tous ces éléments ne sont pas obligatoires pour chaque document. Leur présence doit dépendre des exigences applicables.

### 8.2 Corps du document

Le système doit proposer une structure adaptée au sujet et au domaine.

Il doit pouvoir organiser le contenu en :

- Parties.
- Chapitres.
- Sections.
- Sous-sections.
- Paragraphes.
- Tableaux.
- Figures.
- Équations.
- Encadrés.
- Notes.

### 8.3 Éléments finaux

Selon le document :

- Discussion.
- Conclusion générale.
- Recommandations.
- Perspectives.
- Références bibliographiques.
- Bibliographie complémentaire.
- Annexes.

### 8.4 Validation du plan

Avant de générer de longs contenus, l'assistant doit proposer un plan détaillé que l'utilisateur peut modifier et valider.

Le plan validé doit servir de référence pendant toute la rédaction.

### 8.5 Génération par étapes

La génération doit être réalisée chapitre par chapitre ou section par section.

Chaque partie doit pouvoir être :

- Générée.
- Modifiée.
- Régénérée.
- Validée.
- Enregistrée.
- Comparée à une version antérieure.

Les opérations longues doivent être sauvegardées progressivement et pouvoir être reprises après une interruption.

---

## 9. COHÉRENCE SCIENTIFIQUE ET CONTRÔLE QUALITÉ

MACEVO doit intégrer un mécanisme de vérification du document dans son ensemble.

Il doit notamment rechercher :

- Les contradictions entre chapitres.
- Les répétitions excessives.
- Les objectifs non traités.
- Les questions de recherche sans réponse.
- Les hypothèses non examinées.
- Les incohérences méthodologiques.
- Les résultats qui ne correspondent pas aux données fournies.
- Les conclusions qui dépassent les résultats.
- Les affirmations sans source lorsque celle-ci est nécessaire.
- Les références absentes de la bibliographie.
- Les sections incomplètes.
- Les erreurs de numérotation.
- Les problèmes de structure.
- Les défauts de langue et de présentation.

Les contrôles automatiques doivent produire des recommandations explicables, et non modifier silencieusement des résultats ou des conclusions validés par l'utilisateur.

---

## 10. EXPORTATION ET FICHIERS RÉELLEMENT EXPLOITABLES

L'exportation est une fonctionnalité centrale de MACEVO.

Les fichiers proposés doivent être réellement créés, contrôlés et téléchargeables.

### 10.1 PDF

Le PDF doit être un document exploitable, avec :

- Une mise en page professionnelle.
- Une pagination cohérente.
- Des titres hiérarchisés.
- Une table des matières lorsque nécessaire.
- Des tableaux et figures correctement intégrés.
- Une bibliographie.
- Une présentation adaptée au type de travail.

La génération doit être suivie d'un contrôle d'existence, de taille et de validité du fichier.

### 10.2 LaTeX

La plateforme doit produire les fichiers sources LaTeX nécessaires à la reconstruction du document.

Selon le projet, cela peut inclure :

- Fichier principal `.tex`.
- Fichiers de chapitres.
- Fichier de bibliographie `.bib`.
- Fichiers de configuration.
- Dossier des images.
- Ressources complémentaires.

Le code généré doit être cohérent et, lorsque la compilation est demandée, testé avec un compilateur disponible.

Les erreurs de compilation doivent être remontées clairement à l'utilisateur.

### 10.3 ZIP

L'archive ZIP doit contenir les éléments utiles au projet, par exemple :

- PDF final.
- Sources LaTeX.
- Bibliographie.
- Images et ressources.
- Fichiers complémentaires.
- README expliquant la structure et la reconstruction du document.

L'archive doit être vérifiée avant d'être proposée au téléchargement.

### 10.4 Conversion Word vers LaTeX et PDF vers LaTeX

Les conversions doivent préserver autant que possible :

- Le texte.
- La hiérarchie des titres.
- Les tableaux.
- Les images.
- Les équations.
- Les références.
- La structure du document.

Les limites de reconstruction doivent être indiquées. Une conversion ne doit pas être présentée comme parfaitement fidèle si des éléments ont été perdus ou altérés.

---

## 11. INTERFACE UTILISATEUR

L'interface doit être professionnelle, claire, moderne et adaptée à un environnement de travail scientifique.

Elle doit éviter l'apparence d'un prototype ou d'une simple démonstration.

### 11.1 Principes UX

- Navigation intuitive.
- Hiérarchie visuelle claire.
- Design responsive.
- Accessibilité.
- Messages d'erreur compréhensibles.
- États de chargement visibles.
- Confirmation des opérations importantes.
- Sauvegarde clairement indiquée.
- Progression des tâches visible.
- Gestion simple des documents et des versions.

### 11.2 Espace de travail scientifique

L'utilisateur doit pouvoir accéder facilement à :

- Ses projets.
- Son assistant.
- Ses documents importés.
- Son plan.
- Ses chapitres.
- Ses références.
- Son historique.
- Ses exports.
- Ses paramètres.

### 11.3 Édition

L'éditeur doit faciliter la rédaction et la révision des contenus.

Il doit permettre, progressivement, la modification du texte, la gestion des titres, l'insertion de tableaux et figures, la visualisation des versions et la sauvegarde des modifications.

Les fonctionnalités affichées doivent correspondre à des capacités réellement opérationnelles.

---

## 12. SÉCURITÉ ET CONFIDENTIALITÉ

Les documents scientifiques peuvent contenir des données personnelles, institutionnelles ou confidentielles.

La sécurité doit donc être intégrée dès la conception.

Exigences :

- Authentification fiable.
- Autorisation côté serveur.
- Isolation stricte des données entre utilisateurs.
- Contrôle de propriété sur chaque projet et chaque fichier.
- Validation des fichiers importés.
- Limitation des tailles et types de fichiers.
- Protection contre les chemins de fichiers malveillants.
- Protection des secrets et clés d'API.
- Journalisation des erreurs sans divulgation de données sensibles.
- Suppression contrôlée des fichiers et projets.
- Sauvegardes adaptées.
- Protection contre les accès non autorisés aux exports.

### Compilation LaTeX

La compilation de documents doit être isolée dans un environnement sécurisé, avec :

- Limites de temps.
- Limites de mémoire et de ressources.
- Répertoires temporaires contrôlés.
- Protection contre les accès au système de fichiers.
- Interdiction d'exécuter du code arbitraire non autorisé.
- Nettoyage des fichiers temporaires.

---

## 13. ARCHITECTURE TECHNIQUE ET ÉVOLUTIVITÉ

L'architecture doit rester modulaire et maintenable.

### 13.1 Frontend

Technologies actuelles :

- React.
- Vite.
- Tailwind CSS.
- React Router.
- Axios.
- Bibliothèques d'interface et d'animation déjà présentes dans le projet.

Le frontend doit rester séparé du backend.

### 13.2 Backend

Technologies actuelles :

- Python.
- Django.
- Django REST Framework.
- SimpleJWT.
- PostgreSQL comme base de données cible.

Les fonctionnalités doivent être organisées en modules cohérents, avec des API documentées et des responsabilités clairement séparées.

### 13.3 Intelligence artificielle

Ollama est actuellement privilégié pour les tests et l'exécution locale.

L'architecture doit permettre :

- Le changement de modèle.
- La configuration des paramètres.
- La gestion des délais d'attente.
- Le suivi des erreurs.
- La limitation des sorties.
- La gestion du contexte.
- L'ajout futur de fournisseurs externes.
- L'intégration d'outils de recherche et de vérification.

### 13.4 Recherche documentaire et RAG

Une architecture de récupération de contexte (RAG) doit être envisagée pour exploiter efficacement les documents importés et les connaissances propres à chaque projet.

Elle doit inclure :

- Découpage intelligent des documents.
- Conservation des références de page et de section.
- Recherche pertinente.
- Filtrage par utilisateur et projet.
- Gestion des mises à jour et suppressions.
- Prévention des mélanges de contexte.
- Traçabilité des passages utilisés.

### 13.5 Maintenabilité

Le code doit être :

- Lisible.
- Modulaire.
- Testable.
- Documenté lorsque nécessaire.
- Cohérent avec l'architecture existante.
- Facile à faire évoluer.

Toute modification doit préserver les fonctionnalités existantes qui fonctionnent, sauf décision explicite et justifiée.

---

## 14. TESTS ET VALIDATION

Une fonctionnalité ne doit pas être considérée comme terminée simplement parce que son interface est visible.

Elle doit être testée dans des conditions réelles.

Les tests doivent couvrir progressivement :

- Inscription et connexion.
- Permissions et isolation des utilisateurs.
- Création et modification de projets.
- Sauvegarde et reprise.
- Conversations et historique.
- Importation de fichiers.
- Extraction de texte.
- OCR.
- Recherche documentaire.
- Mémoire de projet.
- Génération de plans.
- Génération progressive de chapitres.
- Vérification bibliographique.
- Export PDF.
- Export LaTeX.
- Création et ouverture des ZIP.
- Gestion des erreurs.
- Résistance aux interruptions.
- Sécurité des fichiers.
- Performance.

Les résultats des tests doivent être rapportés honnêtement, en distinguant les tests réussis, échoués, non exécutés et bloqués par une dépendance.

---

## 15. SCÉNARIO DE VALIDATION GLOBAL

Le scénario suivant doit servir de référence pour évaluer la maturité de MACEVO.

Un étudiant :

1. Crée un compte.
2. Se connecte.
3. Crée un nouveau projet de mémoire.
4. Indique son niveau, son domaine, son établissement et son sujet.
5. Fournit les consignes de son encadreur.
6. Importe des documents de référence.
7. Demande à l'assistant d'analyser ces documents.
8. Reçoit une proposition de problématique.
9. Modifie et valide la problématique.
10. Reçoit une proposition d'objectifs et de méthodologie.
11. Valide ces éléments.
12. Obtient un plan détaillé adapté à son domaine.
13. Valide le plan.
14. Rédige progressivement les chapitres.
15. Consulte et modifie chaque section.
16. Retrouve les informations pertinentes des documents importés.
17. Vérifie les références bibliographiques.
18. Suit l'avancement de son travail.
19. Ferme la plateforme.
20. Revient plusieurs jours plus tard et retrouve son projet dans son état exact.
21. Lance une vérification globale de cohérence.
22. Corrige les problèmes identifiés.
23. Assemble le document.
24. Génère un PDF.
25. Génère les sources LaTeX.
26. Télécharge une archive ZIP.
27. Vérifie que les fichiers existent et sont exploitables.
28. Peut reprendre son travail sans perdre les versions précédentes.

Ce scénario doit être testé progressivement et servir de référence pour les futures évolutions.

---

## 16. PRINCIPES DE DÉVELOPPEMENT POUR CODEX ET LES AUTRES OUTILS

Tout agent de développement intervenant sur MACEVO doit respecter les règles suivantes :

1. Lire ce document avant toute intervention importante.
2. Examiner l'architecture réelle du dépôt avant de proposer des modifications.
3. Ne jamais supposer qu'une fonctionnalité existe sans vérifier son implémentation.
4. Ne pas réécrire inutilement des modules fonctionnels.
5. Ne pas supprimer une fonctionnalité existante sans justification et validation.
6. Commencer par un audit lorsqu'une demande touche plusieurs modules.
7. Proposer un plan d'intervention avant les modifications importantes.
8. Travailler par lots cohérents et testables.
9. Préserver la compatibilité avec les fonctionnalités existantes.
10. Signaler les migrations de base de données nécessaires.
11. Fournir les commandes d'installation, de lancement et de test.
12. Ne pas masquer les erreurs.
13. Ne pas inventer des résultats de tests.
14. Ne pas déclarer une fonctionnalité terminée sans preuve de fonctionnement.
15. Expliquer les limites techniques et les dépendances externes.
16. Documenter les décisions architecturales importantes.
17. Privilégier la sécurité, la fiabilité et la qualité scientifique à la rapidité apparente.
18. Fournir un bilan précis des fichiers créés, modifiés ou supprimés.
19. Vérifier que les changements ne cassent pas les fonctionnalités précédentes.
20. Garder ce document à jour lorsque la vision du projet évolue.

---

## 17. VISION À LONG TERME

MACEVO Intelligence doit évoluer vers une plateforme scientifique complète, capable de réunir dans un même environnement :

- Assistant conversationnel spécialisé.
- Gestion de projets de recherche.
- Mémoire persistante.
- Analyse documentaire avancée.
- Recherche bibliographique vérifiable.
- Aide méthodologique.
- Rédaction scientifique progressive.
- Éditeur de documents.
- Vérification de cohérence.
- Gestion des versions.
- Génération PDF, LaTeX et ZIP.
- Outils de préparation de soutenance.
- Collaboration encadrant-étudiant, si cette évolution est retenue.
- Outils spécialisés par discipline.
- Automatisation des tâches répétitives de rédaction et de mise en forme.

La plateforme doit rester évolutive : les fonctionnalités futures doivent pouvoir être ajoutées sans fragiliser les fonctionnalités déjà opérationnelles.

---

## CONCLUSION

MACEVO Intelligence n'est pas conçu comme un simple générateur de texte, mais comme un **environnement intelligent de recherche, de rédaction et de production scientifique**.

Sa valeur repose sur quatre piliers indissociables :

1. **L'intelligence :** comprendre, guider, analyser et accompagner.
2. **La continuité :** mémoriser le contexte et suivre les projets dans le temps.
3. **La rigueur :** produire des contenus cohérents, traçables et scientifiquement responsables.
4. **La réalisation :** transformer le travail effectué en documents réels, professionnels et exploitables.

Toute décision technique ou fonctionnelle concernant MACEVO doit être évaluée à la lumière de ces quatre piliers.
