# App Gestion de Projets

Application web de gestion de projets et de tâches, pensée pour permettre à une équipe de suivre l’avancement de ses projets, organiser les tâches, gérer les membres impliqués et visualiser l’état global de l’activité.

## Objectif du projet

L’objectif est de proposer une application web simple à utiliser, claire et adaptée à un usage quotidien, notamment sur mobile, pour permettre :

- le suivi des projets ;
- l’organisation des tâches ;
- l’affectation des utilisateurs ;
- la gestion des accès via authentification ;
- l’évolution vers une interface moderne inspirée d’une application de référence validée avec le directeur.

## Stack technique

- **Framework** : Next.js (App Router)
- **Langage** : TypeScript
- **UI** : Tailwind CSS v4 + DaisyUI
- **Authentification** : Clerk (`@clerk/nextjs`)
- **Base de données** : SQLite via Prisma
- **ORM** : Prisma

## Fonctionnalités prévues

### Déjà en place ou amorcées
- structure Next.js App Router ;
- intégration Clerk ;
- pages d’authentification (`/sign-in`, `/sign-up`) ;
- configuration Prisma ;
- base SQLite locale ;
- composants de layout de base (`Wrapper`, `Navbar`, `AuthWrapper`) ;
- base de navigation en cours de construction.

### Fonctionnalités métier visées
- gestion des projets ;
- gestion des tâches ;
- affectation des tâches à des utilisateurs ;
- suivi des membres d’un projet ;
- états d’avancement ;
- interface responsive, avec priorité mobile ;
- interface entièrement en français.

## Structure du projet

```text
app/
├── layout.tsx
├── page.tsx
├── globals.css
├── sign-in/[[...sign-in]]/page.tsx
├── sign-up/[[...sign-up]]/page.tsx
├── components/
│   ├── Wrapper.tsx
│   ├── Navbar.tsx
│   └── AuthWrapper.tsx

lib/
└── prisma.ts

prisma/
├── schema.prisma
├── migrations/
└── dev.db


Description des dossiers principaux
app/

Contient les routes et layouts de l’application via l’App Router de Next.js.

layout.tsx : layout racine de l’application, avec intégration du ClerkProvider.

page.tsx : page d’accueil actuelle, encore à remplacer par la vraie page d’entrée produit.

globals.css : styles globaux, Tailwind et DaisyUI.

sign-in/[[...sign-in]]/page.tsx : page de connexion.

sign-up/[[...sign-up]]/page.tsx : page d’inscription.

components/ :

Wrapper.tsx : wrapper générique de page avec structure commune.

Navbar.tsx : barre de navigation principale.

AuthWrapper.tsx : composant d’habillage des pages d’authentification.

lib/

prisma.ts : singleton Prisma pour éviter les multiples instances en développement.

prisma/

Contient la configuration et le schéma de base de données.

schema.prisma : modèle des entités du projet.

migrations/ : historique des migrations Prisma.

dev.db : base SQLite locale utilisée en développement.

Authentification

L’authentification est gérée avec Clerk.

Pages publiques

/sign-in

/sign-up

Protection des routes

Les routes privées sont prévues pour être protégées via le middleware Clerk.

Le projet contient actuellement une configuration middleware dans un fichier nommé :

proxy.ts

Ce fichier contient une logique clerkMiddleware avec un matcher pour filtrer les routes concernées.

Base de données

La persistance des données repose actuellement sur SQLite via Prisma.

Configuration

Prisma est configuré via prisma.config.ts

La datasource dépend de DATABASE_URL

En local, la base utilise SQLite

Modèle de données
User

Représente un utilisateur de l’application.

Champs principaux :

id

name

email

Relations :

tâches assignées ;

tâches créées ;

projets créés ;

appartenance aux projets via la table de jointure.

Project

Représente un projet.

Champs principaux :

id

name

description

createdAt

updatedAt

inviteCode

Relations :

créateur (createdById)

tâches associées

utilisateurs associés via ProjectUser

Task

Représente une tâche liée à un projet.

Champs principaux :

id

name

description

status

dueDate

solutionDescription

Relations :

projet (projectId)

utilisateur assigné (userId)

utilisateur créateur (createdById)

ProjectUser

Table de jointure entre utilisateurs et projets.

Champs principaux :

userId

projectId

Contrainte :

unicité sur le couple utilisateur/projet

Variables d’environnement

Les variables sont définies dans le fichier .env.

Exemple :

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
DATABASE_URL="file:./dev.db"
Installation
1. Installer les dépendances
npm install
2. Appliquer les migrations Prisma
npx prisma migrate dev
3. Générer le client Prisma
npx prisma generate
4. Lancer le serveur de développement
npm run dev

L’application sera accessible sur :

http://localhost:3000
Scripts disponibles

npm run dev : lance le projet en mode développement

npm run build : génère le build de production

npm run start : lance le build en mode production

npm run lint : exécute ESLint

Choix techniques
Next.js App Router

Permet une structure moderne et claire du projet, adaptée aux layouts, aux pages imbriquées et à l’évolution de l’application.

Clerk

Permet de mettre en place rapidement une authentification robuste avec une bonne intégration dans Next.js.

Prisma + SQLite

Convient très bien pour une phase de démarrage et de prototypage, avec possibilité d’évolution vers PostgreSQL plus tard.

Tailwind CSS + DaisyUI

Permet de construire rapidement une interface propre, responsive et réutilisable.

Contraintes produit

Les orientations validées à ce stade sont les suivantes :

interface entièrement en français ;

design responsive, avec attention particulière à l’usage sur téléphone ;

navigation simple et claire ;

base visuelle inspirée d’une application de référence validée avec le directeur ;

évolution progressive à partir de cette base technique, sans repartir de zéro.

Prochaines étapes

Les prochaines étapes probables du projet sont :

remplacer la page d’accueil actuelle par une vraie interface métier ;

finaliser la navbar ;

créer les pages principales de l’application :

tableau de bord

projets

tâches

membres

rapports

brancher les données réelles avec Prisma ;

protéger les routes privées ;

harmoniser complètement l’interface en français ;

adapter le design à la référence choisie avec le directeur.

État actuel du projet

Le projet dispose déjà d’un socle technique solide, mais l’interface métier principale reste encore à construire ou à refactorer pour coller à la direction produit validée récemment.

Auteur

Projet réalisé par Moulaye Cheikh Oumar KOUNTA.

Remarques

Le projet est en cours de structuration.

Le README sera amené à évoluer avec l’avancement des fonctionnalités.

Certaines parties visibles aujourd’hui sont encore des bases techniques ou des écrans temporaires.