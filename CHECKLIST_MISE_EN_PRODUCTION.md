# Checklist de mise en production — Sunu Projets

## Objectif

Cette checklist est destinée au tuteur / administrateur technique qui doit mettre en ligne l’application dans un contexte réel.

Elle couvre :

- l’application Next.js ;
- la base PostgreSQL ;
- Clerk ;
- Resend ;
- Jitsi V1 ;
- les vérifications fonctionnelles avant ouverture.

---

## 1. Décisions d’infrastructure à valider

Avant toute mise en ligne, fixer les choix suivants :

- URL finale de l’application ;
- hébergement de l’application Next.js ;
- hébergement de la base PostgreSQL ;
- stratégie de sauvegarde ;
- environnement de staging éventuel ;
- personne responsable du DNS.

### Recommandation
Pour une première mise en ligne interne :
- 1 environnement de production ;
- 1 base PostgreSQL managée ou correctement sauvegardée ;
- 1 domaine / sous-domaine applicatif stable ;
- 1 sous-domaine dédié pour l’envoi email.

---

## 2. Préparer l’application Next.js

### Vérifications locales
- [ ] `npm install` fonctionne sans erreur
- [ ] `npm run build` passe
- [ ] `npm run start` démarre correctement
- [ ] les variables d’environnement sont lues correctement

### Variables d’environnement à fournir

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

### Points d’attention
- `NEXT_PUBLIC_*` doit être défini avant le build ;
- `APP_BASE_URL` doit être l’URL publique réelle ;
- `EMAIL_FROM` doit correspondre à un domaine réellement vérifié dans Resend ;
- ne jamais réutiliser des clés de développement en production.

---

## 3. Base de données PostgreSQL

## Ce qu’on observe dans le dépôt
Le Docker Compose actuel sert au développement local uniquement :
- image `postgres:16`
- port local `127.0.0.1:5434:5432`
- `POSTGRES_HOST_AUTH_METHOD: trust`

### Conséquence
Cette configuration ne doit pas être utilisée telle quelle comme base finale de production.

### À préparer
- [ ] une vraie base PostgreSQL de production
- [ ] un compte applicatif dédié
- [ ] un mot de passe fort
- [ ] une stratégie de sauvegarde
- [ ] un accès réseau limité au besoin

### Mise en service
- [ ] renseigner `DATABASE_URL`
- [ ] exécuter les migrations Prisma sur la base de production
- [ ] exécuter `npx prisma generate`
- [ ] vérifier la présence des tables attendues

### Vérification minimale
- [ ] connexion applicative OK
- [ ] lecture/écriture OK
- [ ] création d’un utilisateur OK
- [ ] création d’un projet OK

---

## 4. Clerk — Authentification de production

## Ce qu’on observe dans le dépôt
Le projet utilise :
- `@clerk/nextjs`
- `clerkMiddleware(...)` dans `proxy.ts`
- des routes publiques `/sign-in` et `/sign-up`

### À faire dans Clerk
- [ ] disposer d’une instance Clerk de production
- [ ] récupérer la **publishable key** de production
- [ ] récupérer la **secret key** de production
- [ ] configurer le domaine ou sous-domaine final dans Clerk
- [ ] vérifier les redirections de connexion / inscription
- [ ] configurer les fournisseurs OAuth de production si utilisés

### Variables à renseigner
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

### Vérifications fonctionnelles
- [ ] ouverture de `/sign-in`
- [ ] ouverture de `/sign-up`
- [ ] inscription complète
- [ ] connexion complète
- [ ] reconnexion après déconnexion
- [ ] accès bloqué sur une route privée si non authentifié

### Vérifications métier
- [ ] l’utilisateur Clerk est bien retrouvé / créé dans la base applicative
- [ ] le cas où `fullName` est absent reste bien géré
- [ ] l’adresse email utilisée par Clerk correspond à celle attendue côté métier

---

## 5. Resend — Emails transactionnels

## Ce qu’on observe dans le dépôt
L’application :
- utilise le SDK `resend` ;
- envoie l’email d’assignation depuis `lib/email.ts` ;
- lit `RESEND_API_KEY`, `EMAIL_FROM` et `APP_BASE_URL` ;
- utilise `onboarding@resend.dev` par défaut si `EMAIL_FROM` n’est pas défini.

### À faire dans Resend
- [ ] créer une API key de production
- [ ] privilégier une clé `sending_access`
- [ ] vérifier un domaine ou sous-domaine d’envoi réel
- [ ] configurer correctement les enregistrements DNS demandés par Resend
- [ ] définir une adresse expéditrice stable, ex. `notifications@...`

### Variables à renseigner
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `APP_BASE_URL`

### Vérifications fonctionnelles
- [ ] création d’une tâche assignée à un autre utilisateur
- [ ] réception de l’email par l’utilisateur assigné
- [ ] vérification du sujet et du contenu
- [ ] vérification du lien vers le projet
- [ ] vérification qu’aucun plantage métier ne survient si l’email échoue

### Remarque
Le code prévoit déjà un comportement tolérant :
- si `RESEND_API_KEY` est absente, l’application loggue un warning et n’envoie pas l’email ;
- si Resend renvoie une erreur, elle est logguée.

En production, il faut néanmoins valider le flux réel.

---

## 6. Jitsi — Intégration V1

## Ce qu’on observe dans le projet
Le modèle `TeamMeeting` contient :
- `provider`
- `externalUrl`

Le provider supporte `JITSI`, ce qui correspond à une intégration V1 légère par lien externe.

### Implications
- l’application n’héberge pas son propre serveur Jitsi ;
- l’application ne semble pas dépendre d’un secret Jitsi dédié dans cette V1 ;
- le besoin principal est que les utilisateurs puissent ouvrir les liens de réunion depuis l’application.

### À vérifier
- [ ] génération / affichage du lien de réunion
- [ ] ouverture correcte depuis desktop
- [ ] ouverture correcte depuis mobile
- [ ] comportement attendu si la réunion est annulée
- [ ] affichage correct du provider et du lien

### À préciser au tuteur
Cette V1 Jitsi ne demande pas forcément d’infrastructure Jitsi côté entreprise si l’application ne fait qu’utiliser un lien externe.  
En revanche, si l’entreprise veut plus tard :
- intégration embarquée ;
- branding ;
- contrôle avancé ;
- enregistrements centralisés ;
alors il faudra une architecture Jitsi plus poussée.

---

## 7. Build et déploiement applicatif

### Préparation
- [ ] définir l’hébergeur
- [ ] injecter les variables d’environnement
- [ ] lancer le build avec les bonnes variables `NEXT_PUBLIC_*`
- [ ] démarrer l’application en mode production

### Liens documentations mise en prod des services externes:
- Clerk: https://clerk.com/docs/guides/development/deployment/production
- Resend: https://resend.com/docs/dashboard/domains/introduction

### Commandes type
```bash
npm install
npm run build
npm run start
```

### Vérifications après déploiement
- [ ] page d’accueil accessible
- [ ] assets correctement servis
- [ ] routes Clerk OK
- [ ] accès base OK
- [ ] création d’un projet OK
- [ ] aucune erreur critique dans les logs au démarrage

---

## 8. Vérifications fonctionnelles complètes avant ouverture

### Authentification
- [ ] inscription
- [ ] connexion
- [ ] déconnexion
- [ ] accès refusé aux routes privées sans session

### Projets
- [ ] création de projet
- [ ] affichage des projets créés
- [ ] jointure à un projet via code
- [ ] affichage des collaborations
- [ ] affichage du détail projet

### Membres / rôles projet
- [ ] affichage des membres
- [ ] affichage du rôle courant
- [ ] changement de rôle si autorisé
- [ ] retrait d’un membre si autorisé

### Tâches
- [ ] création de tâche
- [ ] assignation
- [ ] email d’assignation
- [ ] changement de statut
- [ ] clôture avec solution
- [ ] suppression si autorisée

### Équipes
- [ ] création d’équipe
- [ ] affichage des équipes
- [ ] détail équipe
- [ ] gestion des membres équipe
- [ ] affichage des projets liés

### Réunions
- [ ] création de réunion
- [ ] liaison éventuelle à un projet
- [ ] affichage de la liste des réunions
- [ ] affichage du détail réunion
- [ ] changement de statut
- [ ] lien de réunion externe
- [ ] ajout d’un enregistrement par URL
- [ ] suppression d’un enregistrement si prévue

### Responsive / mobile
- [ ] connexion depuis téléphone
- [ ] navigation principale utilisable
- [ ] page projet lisible
- [ ] page réunion lisible
- [ ] ouverture du lien Jitsi depuis mobile

---

## 9. Sécurité minimale avant ouverture

- [ ] aucun secret commité dans le dépôt
- [ ] variables stockées côté hébergeur
- [ ] base PostgreSQL non exposée inutilement
- [ ] mot de passe DB fort
- [ ] sauvegardes prévues
- [ ] clés Clerk de production utilisées
- [ ] clé Resend de production utilisée
- [ ] tests d’accès non autorisés réalisés
- [ ] comptes techniques limités au strict nécessaire

---

## 10. Points de friction connus à surveiller après mise en ligne

- erreurs de synchronisation utilisateur Clerk ↔ base locale
- erreurs d’envoi Resend
- problèmes de lien ou d’URL publique si `APP_BASE_URL` est mal réglée
- problèmes d’ouverture Jitsi sur mobile
- permissions trop larges ou trop strictes sur certaines actions

---

## 11. Validation finale

### Technique
- [ ] build production OK
- [ ] démarrage production OK
- [ ] base PostgreSQL OK
- [ ] migrations Prisma appliquées
- [ ] variables d’environnement configurées

### Services externes
- [ ] Clerk production OK
- [ ] domaine Clerk configuré
- [ ] Resend production OK
- [ ] domaine email vérifié
- [ ] Jitsi V1 vérifié dans les flux réunion

### Métier
- [ ] auth validée
- [ ] projets validés
- [ ] rôles validés
- [ ] tâches validées
- [ ] équipes validées
- [ ] réunions validées
- [ ] responsive validé

---

## 12. Commande utile pour la base locale de dev

Le `docker-compose.yml` actuel reste utile pour le développement :

```bash
docker compose up -d
docker compose down
docker compose ps
```

Mais il ne remplace pas une vraie base de production.