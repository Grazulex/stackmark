---
id: 3
title: Dashboard web local pour commandes status/list
status: Done
priority: medium
assignees:
  - '@claude'
labels:
  - feature
  - web
subtasks: []
dependencies: []
blocked_by: []
created_date: '2025-12-18T01:22:20.707Z'
updated_date: '2025-12-18T01:32:10.321Z'
closed_date: '2025-12-18T01:32:10.321Z'
changelog:
  - timestamp: '2025-12-18T01:22:20.707Z'
    action: created
    details: Task created
    user: system
  - timestamp: '2025-12-18T01:23:45.551Z'
    action: modified
    details: Task updated
    user: AI
  - timestamp: '2025-12-18T01:23:53.289Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:23:53.905Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:23:54.536Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:23:55.156Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:23:55.781Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:23:56.412Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:23:57.046Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:24:03.041Z'
    action: updated
    details: 'status: To Do → In Progress'
    user: user
  - timestamp: '2025-12-18T01:31:42.811Z'
    action: modified
    details: Task updated
    user: AI
  - timestamp: '2025-12-18T01:31:49.313Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:31:49.946Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:31:50.578Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:31:51.185Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:31:51.818Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:31:52.437Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:31:53.076Z'
    action: modified
    details: Task updated
    user: user
  - timestamp: '2025-12-18T01:32:04.785Z'
    action: modified
    details: Task updated
    user: AI
  - timestamp: '2025-12-18T01:32:10.321Z'
    action: updated
    details: 'status: In Progress → Done'
    user: user
acceptance_criteria:
  - text: Commande stackmark web lance un serveur local
    checked: true
  - text: Dashboard affiche liste des stacks avec statut
    checked: true
  - text: Ports forwarded visibles pour chaque stack
    checked: true
  - text: URLs cliquables
    checked: true
  - text: Rafraîchissement automatique
    checked: true
  - text: Option --port pour port personnalisé
    checked: true
  - text: Option --open pour ouvrir le navigateur
    checked: true
ai_plan: >-
  ## Plan d'implémentation


  ### Objectif

  Ajouter une commande `stackmark web` qui lance un dashboard web local
  affichant l'état de toutes les stacks avec leurs ports forwarded.


  ### Étapes

  1. Créer le serveur HTTP natif (sans dépendances)

  2. Implémenter les endpoints API REST

  3. Créer l'interface HTML/CSS/JS inline

  4. Ajouter la commande CLI `web`

  5. Tester l'ensemble


  ### Fichiers à créer

  - `src/server/index.ts` - Serveur HTTP Node natif

  - `src/server/api.ts` - Routes API REST

  - `src/server/html.ts` - Template HTML inline

  - `src/commands/web.ts` - Commande CLI


  ### Fichiers à modifier

  - `src/index.ts` - Ajouter import de la commande web


  ### Fonctionnalités affichées

  - Liste des stacks avec statut (running/stopped/partial)

  - **Ports forwarded** pour chaque stack (IMPORTANT)

  - URLs cliquables

  - Containers par stack

  - Autostart status

  - Rafraîchissement automatique (polling 3s)


  ### Approche technique

  - Node `http` natif (0 dépendance ajoutée)

  - API REST JSON pour les données

  - HTML single-file avec CSS/JS inline

  - Polling côté client pour updates temps réel

  - Réutilisation de `getStackStatus()` et `loadConfig()`
ai_notes: >
  **2025-12-18T01:31:42.810Z** - **02:32** - PROGRESS: Implémentation terminée.
  4 fichiers créés :

  - src/server/index.ts (serveur HTTP natif)

  - src/server/api.ts (API REST)

  - src/server/html.ts (template HTML inline)

  - src/commands/web.ts (commande CLI)

  - Modification de src/index.ts pour intégrer la commande


  **02:32** - TESTS: Dashboard testé avec succès. API retourne toutes les stacks
  avec ports forwarded. Interface affiche correctement les données avec refresh
  auto.
ai_review: |-
  ## Self-Review

  ### Complété
  - [x] Serveur HTTP natif sans dépendances externes
  - [x] API REST endpoint /api/stacks
  - [x] Interface HTML/CSS/JS inline
  - [x] Affichage des ports forwarded (actualPorts)
  - [x] URLs cliquables vers les services
  - [x] Rafraîchissement automatique (3 secondes)
  - [x] Option --port pour port personnalisé
  - [x] Option --open pour ouvrir le navigateur
  - [x] Indicateur de statut (running/stopped/partial)
  - [x] Badge autostart/manual
  - [x] Liste des containers avec état

  ### Tests effectués
  - Build TypeScript : OK
  - Commande help : OK
  - Démarrage serveur : OK
  - API /api/stacks : OK (JSON valide avec toutes les données)
  - Interface web : OK (testé via Playwright)
  - Ports forwarded visibles : OK

  ### Limitations connues
  - Version lecture seule (pas d'actions start/stop/restart)
  - Pas de WebSocket (polling 3s)
  - Pas de filtrage/recherche

  ### Améliorations futures possibles
  - Actions interactives (start/stop/restart)
  - Streaming des logs
  - Filtrage par statut
  - Tri par nom/statut
---

