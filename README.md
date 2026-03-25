# Gestion de projet

Application web de gestion de projets et de tâches destinée au suivi de l’avancement des projets d’une équipe de développement.

Le projet repose sur une base fonctionnelle déjà exploitable : création de projets, ajout de collaborateurs via code d’invitation, consultation des projets personnels et collaboratifs, création de tâches, consultation du détail d’une tâche et mise à jour de son statut. La pile actuelle s’appuie sur Next.js App Router, TypeScript, Clerk, Prisma et SQLite. 

## Objectif

L’objectif de l’application est de proposer un outil simple à prendre en main pour suivre l’évolution des projets de l’équipe, répartir les tâches et visualiser l’état d’avancement sans alourdir le flux de travail. Cette orientation correspond aussi au besoin initial formulé pour le stage : une application facile d’utilisation, mais pas trop simpliste. 

## État actuel du projet

À ce stade, l’application permet déjà de couvrir un premier workflow métier :

- authentification via Clerk ;
- synchronisation de l’utilisateur en base locale ;
- création d’un projet avec génération d’un code d’invitation ;
- consultation des projets créés par l’utilisateur ;
- jointure à un projet via un code d’invitation ;
- consultation des projets collaboratifs ;
- affichage du détail d’un projet avec ses tâches et ses membres ;
- création de tâches ;
- consultation du détail d’une tâche ;
- mise à jour du statut d’une tâche ;
- suppression de projets et de tâches. 

Le README initial du dépôt décrivait surtout une base encore en construction, avec une navigation “en cours” et plusieurs pages métier encore annoncées comme à créer. Or le projet actuel expose déjà un socle métier plus avancé que cette description.

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript
- **UI** : Tailwind CSS v4 + DaisyUI
- **Authentification** : Clerk (`@clerk/nextjs`)
- **ORM** : Prisma
- **Base de données** : PostgreSQL
- **Notifications UI** : React Toastify
- **Icônes** : Lucide React
- **Éditeur riche** : `react-quill-new` 

## Fonctionnalités actuelles

### Authentification et accès
- pages de connexion et d’inscription gérées avec Clerk ;
- protection des routes privées prévue via `proxy.ts` ;
- création ou vérification de l’utilisateur en base grâce à `checkAndAddUser(email, name)`. 

### Gestion des projets
- création d’un projet ;
- génération automatique d’un code d’invitation unique ;
- récupération des projets créés par l’utilisateur ;
- récupération des projets auxquels l’utilisateur participe ;
- suppression d’un projet. 

### Collaboration
- ajout d’un utilisateur à un projet via un code d’invitation ;
- prévention des doublons d’association entre utilisateur et projet via la contrainte `@@unique([userId, projectId])` dans `ProjectUser` ;
- récupération de la liste des membres d’un projet. 

### Gestion des tâches
- création d’une tâche dans un projet ;
- affectation facultative à un utilisateur, ou par défaut au créateur ;
- récupération du détail complet d’une tâche ;
- mise à jour du statut d’une tâche ;
- enregistrement d’une description de solution si la tâche est marquée comme terminée ;
- suppression d’une tâche.

## Modèle de données actuel

Le schéma Prisma actuel repose sur quatre entités principales :

### `User`
Représente un utilisateur de l’application.

Champs notables :
- `id`
- `name`
- `email`

Relations :
- tâches assignées ;
- tâches créées ;
- projets créés ;
- appartenance aux projets via `ProjectUser`. 

### `Project`
Représente un projet suivi dans l’application.

Champs notables :
- `id`
- `name`
- `description`
- `createdAt`
- `updatedAt`
- `inviteCode`
- `createdById`

Relations :
- créateur ;
- tâches ;
- utilisateurs associés. 
### `Task`
Représente une tâche liée à un projet.

Champs notables :
- `id`
- `name`
- `description`
- `status`
- `dueDate`
- `solutionDescription`
- `projectId`
- `userId`
- `createdById` 

### `ProjectUser`
Table de jointure entre utilisateurs et projets.

Rôle actuel :
- gérer l’association collaborateur/projet ;
- empêcher les doublons via une contrainte d’unicité. 

## Organisation du projet

Structure logique actuelle décrite par le dépôt :

```text
app/
  actions.ts
  components/
  general-projects/
  new-tasks/[projectId]/
  project/[projectId]/
  sign-in/[[...sign-in]]/
  sign-up/[[...sign-up]]/
  task-details/[taskId]/
lib/
  prisma.ts
prisma/
  schema.prisma
public/
proxy.ts
```

Le cœur de la logique métier est aujourd’hui centralisé dans `app/actions.ts`, ce qui est pratique pour une première version mais constitue aussi un axe de refactorisation évident à moyen terme.

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Moulzo/Gestion-de-projet.git
cd Gestion-de-projet
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d’environnement

Créer un fichier `.env` à la racine du projet :

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
DATABASE_URL="postgresql://app_user@127.0.0.1:5434/app_gestion_projets?schema=public"
```

### 4. Démarrer PostgreSQL avec Docker

```bash
docker compose up -d
```

### 5. Appliquer les migrations Prisma

```bash
npx prisma migrate dev
```

### 6. Générer le client Prisma

```bash
npx prisma generate
```

### 7. Lancer l’application

```bash
npm run dev
```

L’application sera disponible sur :

http://localhost:3000

## Base de données

Le projet utilise désormais **PostgreSQL** en développement local.

Le service PostgreSQL est défini dans `docker-compose.yml` et exposé localement sur le port `5434` afin d’éviter les conflits avec d’autres projets pouvant déjà utiliser PostgreSQL.

Commandes utiles :

```bash
docker compose up -d
docker compose down
docker compose ps
```

## Workflow conseillé à partir de maintenant

Pour lancer le projet proprement :

```bash
docker compose up -d
npx prisma migrate dev
npm run dev
```

Et pour arrêter la base :

```bash
docker compose down
```

## Limites actuelles

Le projet est déjà fonctionnel, mais plusieurs améliorations sont encore nécessaires pour le rendre plus robuste :

- contrôle d’autorisation métier insuffisant sur certaines actions sensibles ;
- validation des entrées encore limitée ;
- logique serveur très centralisée dans un seul fichier ;
- statuts de tâche encore gérés en chaînes de caractères ;
- rôles de projet non encore présents ;
- UI encore perfectible sur certains flux et sur le responsive.

## Feuille de route

Les axes d’évolution prioritaires sont les suivants :

- sécuriser les actions serveur ;
- améliorer la gestion des tâches ;
- renforcer la collaboration ;
- améliorer l’UX ;
- refactoriser progressivement la structure du code ;
- ajouter une ou deux fonctionnalités différenciantes. 

## Auteur

Projet réalisé par **Moulaye Cheikh Oumar KOUNTA**.

## Remarque

Cette application est actuellement à un stade de **base fonctionnelle avancée**. Elle n’est plus seulement au niveau “mise en place du squelette”, mais elle reste dans une phase de consolidation avant d’évoluer vers une version plus robuste et plus différenciante.
