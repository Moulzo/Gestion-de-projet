# Workflow actuel — App Gestion de Projets

## Objectif du document
Ce document décrit le **workflow réel actuel** de l’application, c’est-à-dire le parcours utilisateur et le flux technique tel qu’il ressort du dépôt aujourd’hui.

Il ne s’agit pas du workflow cible futur, mais bien du fonctionnement actuellement implémenté.

---

## 1. Vue d’ensemble
L’application suit un flux simple :
1. authentifier l’utilisateur ;
2. le synchroniser dans la base locale ;
3. afficher ses projets ;
4. créer un projet ou rejoindre un projet ;
5. gérer les tâches d’un projet ;
6. consulter et mettre à jour le détail d’une tâche.

---

## 2. Workflow utilisateur

### Étape 1 — Authentification
L’utilisateur arrive sur l’application.

- les pages publiques sont `/sign-in` et `/sign-up` ;
- les autres routes sont protégées par le middleware Clerk défini dans `proxy.ts` ;
- un utilisateur non authentifié est redirigé vers le flux d’authentification.

### Étape 2 — Création/synchronisation de l’utilisateur applicatif
Une fois connecté, la navbar récupère les informations de l’utilisateur Clerk.

Si l’email et le nom sont disponibles, elle appelle `checkAndAddUser(email, name)`.

But :
- vérifier si l’utilisateur existe déjà dans la base SQLite ;
- sinon, le créer.

Résultat :
l’utilisateur peut ensuite être relié à des projets et à des tâches via Prisma.

### Étape 3 — Accès à “Mes projets”
La page `/` sert actuellement de dashboard personnel.

Au chargement :
- l’email de l’utilisateur connecté est récupéré via Clerk ;
- la page appelle `getProjectsCreatedByUSer(email)` ;
- les projets créés par l’utilisateur sont affichés.

Actions disponibles :
- créer un projet ;
- consulter un projet ;
- supprimer un projet.

### Étape 4 — Création d’un projet
Depuis la page d’accueil, l’utilisateur ouvre une modale de création.

Champs saisis :
- nom du projet ;
- description.

Traitement :
- appel à `createProject(name, description, email)` ;
- génération d’un code d’invitation unique ;
- récupération de l’utilisateur créateur ;
- insertion du projet en base avec `createdById`.

Résultat :
- le projet est créé ;
- la liste est rechargée ;
- un message de succès est affiché.

### Étape 5 — Accès à “Collaborations”
Depuis la navbar, l’utilisateur peut accéder à `/general-projects`.

Cette page sert à gérer la participation à des projets créés par d’autres utilisateurs.

Actions disponibles :
- entrer un code d’invitation ;
- rejoindre un projet ;
- visualiser les projets associés à l’utilisateur.

### Étape 6 — Rejoindre un projet via code
L’utilisateur saisit un code d’invitation.

Traitement côté serveur :
- appel à `addUserToProject(email, inviteCode)` ;
- recherche du projet par `inviteCode` ;
- recherche de l’utilisateur par email ;
- vérification qu’il n’existe pas déjà une entrée `ProjectUser` pour ce couple utilisateur/projet ;
- création du lien dans `ProjectUser`.

Résultat :
- l’utilisateur est ajouté au projet ;
- le projet apparaît dans ses collaborations.

### Étape 7 — Consultation d’un projet
Depuis “Mes projets” ou “Collaborations”, l’utilisateur peut ouvrir `/project/[projectId]`.

Au chargement :
- la page récupère l’identifiant du projet dans les paramètres ;
- elle appelle `getProjectInfo(projectId, true)` ;
- les détails du projet, les tâches, les membres et le créateur sont récupérés.

La page affiche notamment :
- les informations du projet ;
- les membres ;
- les tâches ;
- les compteurs par statut ;
- les filtres.

### Étape 8 — Filtrage des tâches
Dans la page projet, l’utilisateur peut filtrer les tâches :
- toutes ;
- à faire ;
- en cours ;
- terminées ;
- tâches assignées à l’utilisateur connecté.

Le filtrage est actuellement géré côté client à partir des tâches déjà chargées.

### Étape 9 — Création d’une tâche
Depuis la page projet, l’utilisateur peut aller sur `/new-tasks/[projectId]`.

Le formulaire permet de définir :
- nom ;
- description ;
- date limite éventuelle ;
- utilisateur assigné.

Traitement :
- appel à `createTask(...)` ;
- récupération de l’utilisateur créateur ;
- recherche éventuelle de l’utilisateur assigné ;
- création de la tâche reliée au projet et à l’utilisateur assigné.

Résultat :
- la tâche est ajoutée au projet.

### Étape 10 — Suppression d’une tâche
Depuis la page projet, une action permet de supprimer une tâche.

Traitement :
- appel à `deleteTaskById(taskId)` ;
- suppression directe en base ;
- rechargement des informations du projet.

### Étape 11 — Consultation du détail d’une tâche
L’utilisateur peut ouvrir `/task-details/[taskId]`.

Traitement :
- appel à `getTaskDetails(taskId)` ;
- récupération de la tâche avec son projet, son utilisateur assigné et son créateur.

La page affiche notamment :
- le titre ;
- la description ;
- le statut ;
- la date limite ;
- l’utilisateur assigné ;
- le créateur ;
- la solution si elle existe.

### Étape 12 — Mise à jour du statut d’une tâche
Depuis la page détail tâche, l’utilisateur peut faire évoluer le statut.

Traitement :
- appel à `updateTaskStatus(taskId, newStatus, solutionDescription?)` ;
- mise à jour simple du champ `status` ;
- si le statut devient `Done` et qu’une solution est saisie, mise à jour simultanée de `solutionDescription`.

Résultat :
- la tâche reflète son nouvel état d’avancement.

---

## 3. Workflow technique simplifié

```text
[Utilisateur]
    ↓
[Clerk Auth]
    ↓
[Middleware proxy.ts protège les routes privées]
    ↓
[Navbar]
    ↓
checkAndAddUser(email, name)
    ↓
[Base Prisma / SQLite]
    ↓
Page /
    ├── getProjectsCreatedByUSer(email)
    ├── createProject(...)
    └── deleteProjectById(projectId)
    ↓
Page /general-projects
    ├── addUserToProject(email, inviteCode)
    └── getProjectsAssociatedWithUser(email)
    ↓
Page /project/[projectId]
    ├── getProjectInfo(projectId, true)
    ├── deleteTaskById(taskId)
    └── navigation vers création tâche
    ↓
Page /new-tasks/[projectId]
    └── createTask(...)
    ↓
Page /task-details/[taskId]
    ├── getTaskDetails(taskId)
    └── updateTaskStatus(taskId, newStatus, solutionDescription)
```

---

## 4. Rôle des principaux fichiers

### `proxy.ts`
- protège les routes privées ;
- laisse publiques les routes d’authentification ;
- applique `auth.protect()` sur le reste.

### `app/actions.ts`
- centralise la logique serveur ;
- contient les opérations métier principales liées aux utilisateurs, projets et tâches.

### `app/page.tsx`
- dashboard personnel actuel ;
- permet de créer et supprimer ses projets ;
- charge les projets créés par l’utilisateur.

### `app/general-projects/page.tsx`
- gère l’ajout à un projet par code ;
- affiche les projets collaboratifs de l’utilisateur.

### `app/project/[projectId]/page.tsx`
- affiche le projet et ses tâches ;
- gère les filtres ;
- permet la suppression de tâche ;
- sert de point d’entrée vers la création de tâche.

### `app/new-tasks/[projectId]/page.tsx`
- formulaire de création de tâche.

### `app/task-details/[taskId]/page.tsx`
- affiche le détail complet d’une tâche ;
- permet la mise à jour du statut.

### `app/components/*`
- composants d’interface réutilisables :
  - navbar ;
  - cartes projet ;
  - cartes tâche ;
  - wrapper global ;
  - état vide ;
  - informations utilisateur.

### `lib/prisma.ts`
- singleton Prisma pour éviter les instances multiples en développement.

### `prisma/schema.prisma`
- décrit les entités `User`, `Project`, `Task`, `ProjectUser`.

---

## 5. Limites actuelles du workflow
Le workflow actuel est cohérent pour une V1, mais plusieurs limites existent :
- les autorisations métier ne sont pas encore assez strictes ;
- les statuts sont encore des chaînes libres ;
- certaines erreurs remontées côté serveur sont trop génériques ;
- certaines modales reposent encore sur de la manipulation DOM directe ;
- beaucoup de logique serveur est concentrée dans un seul fichier ;
- il n’existe pas encore de rôles projet (`owner`, `manager`, `member`).

---

## 6. Résumé du fonctionnement actuel
L’application suit aujourd’hui un flux clair :
- un utilisateur s’authentifie ;
- il est créé/synchronisé localement ;
- il gère ses propres projets ;
- il peut rejoindre des projets via invitation ;
- il crée et suit des tâches ;
- il met à jour leur état d’avancement.

C’est donc déjà un workflow complet de base pour une application de gestion de projets et tâches, même si plusieurs améliorations restent à faire pour le rendre plus robuste et plus riche.
