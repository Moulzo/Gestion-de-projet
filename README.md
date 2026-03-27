# Sunu Projets — Application de gestion de projet

Application web de gestion de projets, tâches, équipes et réunions, conçue pour un usage interne en entreprise.  
Le projet est développé avec Next.js App Router, TypeScript, Tailwind CSS + DaisyUI, Clerk pour l’authentification, Prisma avec PostgreSQL, Resend pour les emails transactionnels, et une intégration Jitsi V1 basée sur des liens externes de réunion.

---

## 1. Objectif du projet

L’objectif de l’application est de fournir une base de travail simple, claire et exploitable pour :

- structurer le suivi des projets ;
- répartir les tâches entre collaborateurs ;
- gérer des équipes / workspaces ;
- organiser des réunions d’équipe ou liées à un projet ;
- centraliser des comptes-rendus et des liens d’enregistrement ;
- conserver une UX responsive, notamment sur mobile.

L’application est déjà utilisable en interne, tout en restant en évolution active.

---

## 2. État actuel du projet

Le dépôt public reflète aujourd’hui une version plus avancée que la première base clonée :

- authentification Clerk et routes privées protégées ;
- synchronisation des utilisateurs Clerk dans la base applicative ;
- création de projets et jointure par code d’invitation ;
- rôles collaborateurs par projet (`OWNER`, `MANAGER`, `MEMBER`) ;
- historique d’activité projet ;
- gestion des tâches et de leur statut ;
- assignation de tâches avec notification email via Resend ;
- module équipes / workspaces ;
- rattachement d’un projet à une équipe ;
- module réunions ;
- réunions liées à une équipe, avec projet optionnel ;
- lien de réunion externe (V1 Jitsi) ;
- gestion des enregistrements via URL.

---

## 3. Stack technique

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- DaisyUI
- Lucide React
- React Toastify
- react-quill-new

### Backend / logique serveur
- Server Actions Next.js
- Clerk (`@clerk/nextjs`)
- Prisma ORM
- PostgreSQL
- Zod

### Services externes
- Clerk pour l’authentification
- Resend pour les emails
- Jitsi en V1 via lien externe de réunion

---

## 4. Dépendances importantes observées dans le dépôt

Le dépôt utilise notamment :

- `next`, `react`, `react-dom`
- `@clerk/nextjs`
- `@prisma/client`
- `resend`
- `zod`
- `react-toastify`
- `react-quill-new`

Scripts disponibles :

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

## 5. Modèle métier actuel

### Utilisateurs
L’utilisateur applicatif est synchronisé à partir de Clerk et sert de base aux relations métier.

### Équipes / workspaces
Le modèle `Team` permet de structurer les utilisateurs à un niveau supérieur au projet, avec des rôles d’équipe (`OWNER`, `MANAGER`, `MEMBER`).

### Projets
Un projet peut être autonome ou rattaché à une équipe.  
Les collaborateurs projet sont gérés via `ProjectUser`, avec rôles projet et portée (`INTERNAL` / `EXTERNAL`).

### Tâches
Une tâche appartient à un projet, peut être assignée à un utilisateur, possède un statut, une échéance éventuelle et une description de solution.

### Activité
Le modèle `ActivityLog` journalise plusieurs événements métier du projet.

### Réunions
Le modèle `TeamMeeting` gère les réunions d’équipe, avec :
- équipe obligatoire ;
- projet optionnel ;
- statut (`SCHEDULED`, `COMPLETED`, `CANCELLED`) ;
- provider (`NONE`, `JITSI`) ;
- `externalUrl` pour le lien externe de réunion.

### Enregistrements
Le modèle `MeetingRecording` permet d’attacher des liens d’enregistrement à une réunion.

---

## 6. Organisation actuelle du projet

```text
app/
  actions/
  components/
  general-projects/
  meetings/
  new-tasks/[projectId]/
  project/[projectId]/
  sign-in/[[...sign-in]]/
  sign-up/[[...sign-up]]/
  task-details/[taskId]/
  teams/
lib/
  email.ts
  permissions.ts
  prisma.ts
  project-role-labels.ts
  project-roles.ts
  task-status.ts
  team-role-labels.ts
  team-roles.ts
  validations.ts
prisma/
  migrations/
  schema.prisma
public/
proxy.ts
type.ts
```

La logique métier n’est plus centralisée dans un unique `app/actions.ts` : elle est désormais découpée en dossier `app/actions/`.

---

## 7. Variables d’environnement

### Variables obligatoires

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

DATABASE_URL=

RESEND_API_KEY=
EMAIL_FROM=
APP_BASE_URL=
```

### Recommandations
- ne jamais committer les secrets ;
- utiliser des valeurs différentes entre local, staging et production ;
- définir les variables `NEXT_PUBLIC_*` avant le build de l’application ;
- garder `EMAIL_FROM` cohérent avec le domaine vérifié dans Resend ;
- définir `APP_BASE_URL` sur l’URL publique réelle de l’application.

---

## 8. Lancement en local

### 1. Cloner le dépôt

```bash
git clone https://github.com/Moulzo/Gestion-de-projet.git
cd Gestion-de-projet
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Démarrer PostgreSQL local via Docker

```bash
docker compose up -d
```

### 4. Configurer l’environnement

Créer un fichier `.env.local` à la racine du projet et y renseigner les variables nécessaires.

Exemple local :

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

DATABASE_URL="postgresql://app_user@127.0.0.1:5434/app_gestion_projets?schema=public"

RESEND_API_KEY=
EMAIL_FROM="Sunu Projets <onboarding@resend.dev>"
APP_BASE_URL="http://localhost:3000"
```

### 5. Appliquer les migrations Prisma

```bash
npx prisma migrate dev
npx prisma generate
```

### 6. Lancer l’application

```bash
npm run dev
```

L’application est alors disponible sur :

```text
http://localhost:3000
```

---

## 9. Notes importantes sur les services externes

### Clerk
Le projet utilise Clerk pour protéger les routes privées et pour récupérer l’utilisateur authentifié côté serveur.

### Resend
Les emails d’assignation de tâche passent par `lib/email.ts`.  
Si `RESEND_API_KEY` est absente, l’envoi est simplement ignoré avec un warning, ce qui évite de casser le flux métier.

### Jitsi
L’intégration actuelle est une V1 légère : la réunion stocke un `provider` et une `externalUrl`.  
Le projet ne gère pas encore un hébergement Jitsi dédié ni une intégration iframe poussée.

---

## 10. Déploiement — vue rapide

Pour la mise en ligne, il faut prévoir au minimum :

1. un hébergement Node.js / Next.js ;
2. une base PostgreSQL de production ;
3. une instance Clerk configurée pour le domaine de production ;
4. un domaine d’envoi vérifié dans Resend ;
5. les variables d’environnement de production ;
6. l’application des migrations Prisma sur la base de production ;
7. une vérification fonctionnelle complète.

Une checklist détaillée est fournie dans `CHECKLIST_MISE_EN_PRODUCTION.md`.

---

## 11. Limites connues / points d’attention

Le projet est déjà exploitable, mais plusieurs points restent à consolider :

- le schéma de tâche utilise encore un statut stocké en chaîne ;
- certaines permissions restent à durcir sur certaines actions ;
- l’UI est fonctionnelle mais encore perfectible sur certains flux ;
- le module commentaires sur les tâches n’est pas encore intégré ;
- la partie Jitsi reste volontairement légère en V1.

---

## 12. Documentation associée

Le dépôt contient également :

- `Workflow_Gestion_de_Projet.md`
- `CHECKLIST_MISE_EN_PRODUCTION.md`
- `Roadmap_Gestion_de_Projet.md`

---

## 13. Auteur

Projet réalisé par **Moulaye Cheikh Oumar KOUNTA**.