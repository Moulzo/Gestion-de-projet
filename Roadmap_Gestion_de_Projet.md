# Roadmap d’évolution — App Gestion de Projets

## Contexte
Le projet actuel constitue une base fonctionnelle de gestion de projets et de tâches construite avec Next.js App Router, TypeScript, Clerk, Prisma et SQLite. Il permet déjà de créer des projets, rejoindre un projet via un code d’invitation, afficher les projets personnels et collaboratifs, créer des tâches, consulter un projet et mettre à jour le statut d’une tâche.

L’objectif de cette roadmap est de transformer cette base clonée puis validée comme point de départ en une application plus robuste, plus maintenable et plus différenciante.

---

## Vision
Faire évoluer l’application d’une **V1 inspirée d’un tutoriel** vers une **application de stage crédible**, avec :
- une logique métier mieux sécurisée ;
- une UX plus claire et plus mobile-friendly ;
- une structure de code plus propre ;
- des fonctionnalités qui la différencient d’un simple clone.

---

## Axe 1 — Sécuriser et fiabiliser l’existant
### Objectif
Rendre l’application plus sûre et plus stable avant d’ajouter des fonctionnalités visibles.

### Travaux recommandés
- Ajouter des vérifications d’autorisation sur toutes les server actions sensibles :
  - suppression de projet ;
  - suppression de tâche ;
  - création de tâche ;
  - accès au détail projet ;
  - changement de statut.
- Vérifier l’appartenance au projet avant lecture ou modification des données.
- Ajouter une validation des entrées côté serveur (Zod ou logique équivalente) pour :
  - nom/description de projet ;
  - code d’invitation ;
  - création de tâche ;
  - statut de tâche ;
  - description de solution.
- Remplacer les `throw new Error` trop génériques par des erreurs compréhensibles.
- Centraliser les messages d’erreur et de succès.

### Résultat attendu
Une base plus fiable, plus propre à démontrer et moins fragile en cas de mauvais usage.

---

## Axe 2 — Améliorer le cœur métier des tâches
### Objectif
Rendre la gestion des tâches plus utile et plus proche d’un vrai outil de suivi.

### Travaux recommandés
- Ajouter un champ `priority` sur les tâches :
  - basse ;
  - moyenne ;
  - haute.
- Remplacer les statuts texte libres par un système centralisé :
  - `TODO` ;
  - `IN_PROGRESS` ;
  - `DONE`.
- Améliorer la gestion des échéances :
  - tâche en retard ;
  - tâche due aujourd’hui ;
  - tâche bientôt à échéance.
- Ajouter des badges visuels pour statut, priorité et retard.
- Ajouter recherche et tri sur la page projet :
  - par statut ;
  - par priorité ;
  - par date limite ;
  - par nom.

### Résultat attendu
Une page projet plus utile au quotidien, avec une vraie lecture de l’urgence et de l’avancement.

---

## Axe 3 — Renforcer la collaboration
### Objectif
Passer d’un simple partage de projet à une vraie logique de collaboration.

### Travaux recommandés
- Ajouter un rôle au niveau `ProjectUser` :
  - owner ;
  - manager ;
  - member.
- Définir les droits par rôle :
  - owner : administration complète du projet ;
  - manager : gestion opérationnelle des tâches ;
  - member : travail sur les tâches autorisées.
- Ajouter une vue membres du projet :
  - liste des membres ;
  - rôle ;
  - possibilité de retirer un membre ;
  - possibilité de changer un rôle.
- Ajouter régénération du code d’invitation.
- Éviter les doublons et mieux gérer les cas “déjà membre”.

### Résultat attendu
Une collaboration plus crédible et plus facilement défendable devant un responsable métier.

---

## Axe 4 — Repenser l’expérience utilisateur
### Objectif
Améliorer la lisibilité et l’ergonomie, surtout côté mobile.

### Travaux recommandés
- Améliorer le dashboard “Mes projets” :
  - cartes de synthèse ;
  - nombre de projets actifs ;
  - nombre de tâches en retard ;
  - tâches assignées à l’utilisateur.
- Améliorer la page “Collaborations” :
  - meilleure explication du flux de jointure ;
  - meilleur feedback après ajout.
- Revoir les modales aujourd’hui manipulées via `document.getElementById(...)` et les remplacer par une gestion via state React.
- Uniformiser les composants de cartes, badges, boutons et états vides.
- Ajouter de meilleurs feedbacks : loaders, toasts, confirmations, empty states.
- Vérifier et corriger le comportement responsive sur mobile.

### Résultat attendu
Une app plus agréable à utiliser et plus propre visuellement, sans dépendre uniquement du style du tutoriel.

---

## Axe 5 — Refactoriser la structure du code
### Objectif
Sortir progressivement de la structure “monolithique de tutoriel”.

### Travaux recommandés
- Découper `app/actions.ts` en modules :
  - `actions/projects.ts` ;
  - `actions/tasks.ts` ;
  - `actions/members.ts` ;
  - `actions/users.ts`.
- Créer des types partagés plus propres.
- Réduire l’usage de `any`.
- Extraire les constantes métier :
  - statuts ;
  - priorités ;
  - labels ;
  - messages.
- Réduire la logique directement embarquée dans certaines pages client.
- Préparer une couche de services métier si l’application grossit.

### Résultat attendu
Un projet plus lisible, plus maintenable et plus simple à expliquer techniquement.

---

## Axe 6 — Ajouter une ou deux fonctionnalités différenciantes
### Objectif
Donner au projet une identité propre.

### Options à forte valeur
#### Option A — Vue Kanban
- colonnes par statut ;
- déplacement visuel des tâches ;
- lecture immédiate de l’avancement.

#### Option B — Historique d’activité
- création de projet ;
- création de tâche ;
- changement de statut ;
- ajout/retrait de membre.

#### Option C — Commentaires sur les tâches
- fil de discussion par tâche ;
- meilleure collaboration ;
- traçabilité métier.

#### Option D — Vue calendrier
- visualisation des échéances ;
- repérage rapide des urgences.

### Résultat attendu
Une application qui ne ressemble plus à une reproduction directe du tutoriel d’origine.

---

## Priorisation recommandée
### Priorité immédiate
1. Autorisations et sécurité métier.
2. Validation des entrées.
3. Nettoyage des erreurs.
4. Centralisation des statuts.

### Priorité court terme
5. Priorité et retard sur les tâches.
6. Recherche, tri et filtres.
7. Amélioration de la page détail tâche.
8. Dashboard plus utile.

### Priorité moyen terme
9. Rôles projet.
10. Gestion des membres.
11. Refactorisation des server actions.
12. Fonctionnalité différenciante.

---

## Proposition de découpage en sprints
### Sprint 1 — Sécurisation
- contrôle d’accès ;
- validation ;
- erreurs ;
- nettoyage des statuts.

### Sprint 2 — Tâches
- priorité ;
- échéances ;
- retards ;
- recherche/tri.

### Sprint 3 — Collaboration
- rôles ;
- gestion des membres ;
- amélioration des invitations.

### Sprint 4 — UX et structure
- dashboard ;
- responsive ;
- refactor actions/composants.

### Sprint 5 — Différenciation
- Kanban, activité, commentaires ou calendrier.

---

## Résumé stratégique
La base actuelle est bonne pour démarrer vite. La suite ne doit pas consister à “refaire le tutoriel mieux”, mais à :
- sécuriser ;
- fiabiliser ;
- clarifier l’expérience ;
- ajouter des règles métier et des fonctionnalités propres au contexte réel.

C’est cette évolution qui transformera le projet en vraie application de stage.
