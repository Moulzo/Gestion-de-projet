# Workflow actuel — Sunu Projets

## Objectif du document

Ce document décrit le fonctionnement réel actuellement implémenté dans le dépôt : parcours utilisateur, logique métier et flux techniques principaux.

Il ne décrit pas la cible future idéale, mais l’état présent du projet.

---

## 1. Vue d’ensemble

Le workflow actuel peut se résumer ainsi :

1. l’utilisateur s’authentifie via Clerk ;
2. son identité est synchronisée dans la base applicative ;
3. il accède à ses projets et collaborations ;
4. il peut créer ou rejoindre un projet ;
5. il peut gérer des tâches dans un projet ;
6. il peut gérer des équipes / workspaces ;
7. il peut créer et suivre des réunions d’équipe ;
8. il peut exploiter un lien Jitsi externe et référencer des enregistrements.

---

## 2. Workflow utilisateur

### Étape 1 — Authentification
- les routes `/sign-in` et `/sign-up` sont publiques ;
- les autres routes sont protégées par le middleware Clerk défini dans `proxy.ts` ;
- un utilisateur non authentifié est bloqué sur les routes privées.

### Étape 2 — Synchronisation de l’utilisateur applicatif
Après connexion Clerk :
- l’application récupère les informations de l’utilisateur ;
- l’utilisateur est vérifié / créé dans la base locale ;
- cette entrée locale sert ensuite aux relations Prisma.

### Étape 3 — Accès aux projets
L’utilisateur peut :
- consulter ses projets ;
- consulter ses collaborations ;
- créer un projet ;
- rejoindre un projet via code d’invitation.

### Étape 4 — Gestion des rôles projet
Dans un projet, les membres sont gérés avec des rôles :
- `OWNER`
- `MANAGER`
- `MEMBER`

Les rôles conditionnent certaines actions sensibles.

### Étape 5 — Gestion des tâches
Dans un projet, l’utilisateur peut :
- créer une tâche ;
- l’assigner à un collaborateur du projet ;
- suivre son statut ;
- consulter son détail ;
- la clôturer avec une description de solution ;
- voir l’activité associée au projet.

### Étape 6 — Notification email d’assignation
Lorsqu’une tâche est assignée à un autre utilisateur :
- l’application envoie un email via Resend ;
- le lien inclus pointe vers le projet via `APP_BASE_URL`.

### Étape 7 — Gestion des équipes
L’utilisateur peut :
- créer une équipe ;
- rejoindre / gérer une équipe ;
- voir les projets liés à une équipe ;
- administrer les membres d’équipe selon son rôle.

### Étape 8 — Gestion des réunions
L’utilisateur peut :
- créer une réunion rattachée à une équipe ;
- lier éventuellement la réunion à un projet ;
- définir un statut de réunion ;
- enregistrer des notes / compte-rendus ;
- consulter la liste et le détail des réunions.

### Étape 9 — Jitsi V1
Pour certaines réunions :
- un lien externe de réunion est généré / stocké ;
- le provider peut être `JITSI` ;
- la réunion n’est pas encore une intégration vidéo embarquée complète.

### Étape 10 — Enregistrements
Sur une réunion :
- des enregistrements sont ajoutés par URL ;
- ils sont listés sur le détail de réunion ;
- l’application ne stocke pas encore les fichiers vidéo elle-même.

---

## 3. Workflow technique simplifié

```text
[Utilisateur]
    ↓
[Clerk]
    ↓
[proxy.ts protège les routes privées]
    ↓
[getCurrentDbUser / sync utilisateur]
    ↓
[Prisma + PostgreSQL]
    ↓
Projets
    ├── création
    ├── jointure par code
    ├── gestion membres / rôles
    └── historique d’activité
    ↓
Tâches
    ├── création
    ├── assignation
    ├── email Resend
    ├── détail
    └── mise à jour de statut
    ↓
Équipes
    ├── création
    ├── membres
    └── projets liés
    ↓
Réunions
    ├── création
    ├── notes / statut
    ├── lien externe Jitsi
    └── enregistrements par URL
```

---

## 4. Principaux éléments techniques

### Authentification / protection
- `proxy.ts` applique `clerkMiddleware(...)` ;
- seules les routes `/sign-in(.*)` et `/sign-up(.*)` sont explicitement publiques.

### Permissions
Les helpers de permissions servent de base aux contrôles d’accès :
- `getCurrentDbUser()`
- `assertTeamMember(teamId)`
- `assertProjectMember(projectId)`
- `assertProjectOwner(projectId)`
- `assertTaskAccess(taskId)`

### Gestion des rôles
Le projet dispose de helpers dédiés pour les rôles projet :
- `getProjectMembership(projectId)`
- `assertHasProjectRole(projectId, allowedRoles)`
- `canManageProject(projectId)`
- `canAdminProject(projectId)`

### Actions métier
Les server actions sont désormais structurées dans `app/actions/`, avec des domaines dédiés :
- `activity`
- `members`
- `meetings`
- `projects`
- `tasks`
- `teams`
- `users`

### Emails
`lib/email.ts` :
- construit un client Resend à partir de `RESEND_API_KEY` ;
- utilise `EMAIL_FROM` ;
- génère des liens vers l’application à partir de `APP_BASE_URL`.

---

## 5. Modèle de données observé

### Entités principales
- `User`
- `Team`
- `TeamMember`
- `Project`
- `Task`
- `ProjectUser`
- `ActivityLog`
- `TeamMeeting`
- `MeetingRecording`

### Enums métier
- `ProjectRole`
- `TeamRole`
- `ProjectCollaboratorScope`
- `MeetingStatus`
- `MeetingProvider`
- `ActivityType`

---

## 6. Flux détaillé par module

### Module Projets
- un utilisateur crée un projet ;
- un code d’invitation est généré ;
- le créateur devient `OWNER` ;
- des collaborateurs peuvent rejoindre le projet ;
- le projet peut être lié à une équipe.

### Module Tâches
- la tâche est liée à un projet ;
- elle peut être assignée à un membre du projet ;
- si l’assignation vise un autre utilisateur, un email est envoyé ;
- la clôture d’une tâche impose une description de solution.

### Module Équipes
- une équipe possède ses propres membres et rôles ;
- un projet appartient éventuellement à une équipe ;
- la gestion équipe et la gestion projet restent distinctes.

### Module Réunions
- une réunion appartient à une équipe ;
- elle peut référencer un projet ;
- elle gère statut, date, durée, notes et lien externe ;
- elle peut contenir plusieurs enregistrements liés.

---

## 7. Ce que ce workflow implique pour la mise en production

Pour un usage réel :
- Clerk doit être configuré pour le domaine final ;
- PostgreSQL doit être externalisé hors du Docker local ;
- Resend doit être configuré avec un domaine d’envoi réel ;
- `APP_BASE_URL` doit pointer vers l’URL publique finale ;
- il faut tester les flux projet, tâche, équipe, réunion et email.

---

## 8. Limites connues du workflow actuel

- le module commentaires de tâches n’est pas encore présent ;
- l’intégration Jitsi est légère et dépend d’un lien externe ;
- certaines actions méritent encore un durcissement supplémentaire côté permissions ;
- certaines parties UI restent à polir.

---

## 9. Résumé

Le projet n’est plus une simple V1 “projets + tâches”.  
Le workflow réel actuel couvre déjà :

- auth ;
- projets ;
- rôles et membres ;
- tâches ;
- emails ;
- équipes ;
- réunions ;
- enregistrements.

C’est donc déjà une base métier sérieuse pour une mise en ligne interne, sous réserve d’une configuration de production propre.