This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# App Gestion de Projets — Documentation

## Objectif

Application web de gestion de projets et de tâches.

## Stack technique

- **Framework**: Next.js (App Router)
- **UI**: Tailwind CSS v4 + DaisyUI
- **Auth**: Clerk (`@clerk/nextjs`)
- **Base de données**: SQLite via Prisma
- **Langage**: TypeScript

## Structure du projet

- **`app/`**
  - **`layout.tsx`**: layout racine + `ClerkProvider`
  - **`page.tsx`**: page d’accueil (actuellement un exemple)
  - **`globals.css`**: import Tailwind + configuration DaisyUI
  - **`sign-in/[[...sign-in]]/page.tsx`**: page de connexion Clerk
  - **`sign-up/[[...sign-up]]/page.tsx`**: page d’inscription Clerk
  - **`components/`**
    - **`Wrapper.tsx`**: wrapper de page (inclut `Navbar` + padding)
    - **`Navbar.tsx`**: barre de navigation (en cours de construction)
    - **`AuthWrapper.tsx`**: wrapper visuel pour pages auth

- **`lib/`**
  - **`prisma.ts`**: singleton `PrismaClient` (évite les multiples instances en dev)

- **`prisma/`**
  - **`schema.prisma`**: modèle de données
  - **`migrations/`**: migrations Prisma
  - **`dev.db`**: base SQLite locale (développement)

## Authentification (Clerk)

Le projet utilise Clerk pour la gestion de session.

- Les pages publiques:
  - `/sign-in`
  - `/sign-up`

- Les autres routes sont prévues pour être protégées par le middleware Clerk.
  - Le fichier actuel s’appelle **`proxy.ts`** et contient une configuration `clerkMiddleware` avec un `matcher`.

## Base de données (Prisma)

### Configuration

- Prisma est configuré via **`prisma.config.ts`**.
- La datasource utilise `DATABASE_URL`.
- Base locale par défaut: SQLite.

### Modèle de données (résumé)

Le schéma est défini dans `prisma/schema.prisma`.

- **`User`**
  - `id`, `name`, `email`
  - relations: tâches assignées (`tasks`), tâches créées (`createdTasks`), projets créés (`projects`), appartenance projet (`userProjects`)

- **`Project`**
  - `id`, `name`, `description?`, `createdAt`, `updatedAt`, `inviteCode`
  - créateur: `createdById` → `User`
  - relations: `tasks`, `users` (via `ProjectUser`)

- **`Task`**
  - `id`, `name`, `description`, `status` (défaut: "To Do"), `dueDate?`, `solutionDescription?`
  - appartient à: `projectId` → `Project`
  - assignée à: `userId?` → `User` (optionnel)
  - créée par: `createdById` → `User`

- **`ProjectUser`** (table de jointure)
  - `userId` + `projectId` unique

## Variables d’environnement

Définies dans **`.env`** (ne pas committer de clés réelles en production).

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (ex: `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (ex: `/sign-up`)
- `DATABASE_URL` (ex: `file:./dev.db`)

## Installation & démarrage

1. Installer les dépendances

```bash
npm install
```

2. Appliquer les migrations (ou créer la DB)

```bash
npx prisma migrate dev
```

3. Générer le client Prisma

```bash
npx prisma generate
```

4. Lancer en développement

```bash
npm run dev
```

## Scripts npm

- `npm run dev`: lance Next.js en mode dev
- `npm run build`: build de production
- `npm run start`: démarre le serveur Next.js (après build)
- `npm run lint`: ESLint

## Notes importantes

- **Thèmes DaisyUI**: configurés dans `app/globals.css` via la directive `@plugin "daisyui"`.
- **Next React Compiler**: activé dans `next.config.ts` (`reactCompiler: true`).
