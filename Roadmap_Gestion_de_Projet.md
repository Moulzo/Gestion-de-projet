# Roadmap mise à jour — Sunu Projets

## 1. État actuel confirmé

Le projet a dépassé le simple socle "projets + tâches".  
Les fonctionnalités déjà en place sont les suivantes :

### Authentification / accès
- authentification avec Clerk ;
- routes privées protégées par middleware ;
- synchronisation utilisateur Clerk → base applicative.

### Projets / collaboration
- création de projet ;
- jointure à un projet par code d’invitation ;
- gestion des membres ;
- rôles projet `OWNER`, `MANAGER`, `MEMBER` ;
- activité projet.

### Tâches
- création ;
- assignation ;
- mise à jour du statut ;
- clôture avec description de solution ;
- email d’assignation via Resend.

### Équipes
- création d’équipes / workspaces ;
- gestion des membres d’équipe ;
- rattachement projet → équipe.

### Réunions
- création de réunions liées à une équipe ;
- projet lié en option ;
- statut de réunion ;
- notes / compte-rendu ;
- lien externe Jitsi ;
- enregistrements par URL.

---

## 2. Priorités produit recommandées

### Priorité 1 — Stabilisation de la mise en ligne
Objectif : rendre l’application fiable en usage réel.

Travaux :
- finaliser la documentation de production ;
- sécuriser l’environnement de déploiement ;
- valider Clerk / Resend / PostgreSQL / Jitsi ;
- corriger les bugs remontés par les premiers utilisateurs.

### Priorité 2 — Commentaires sur les tâches
Objectif : améliorer la collaboration opérationnelle directement dans les tâches.

Travaux :
- fil de commentaires simple ;
- auteur / date / contenu ;
- intégration dans la page détail tâche ;
- permissions cohérentes avec l’accès à la tâche.

### Priorité 3 — Durcissement des permissions
Objectif : éviter les écarts entre UI et backend.

Travaux :
- audit des suppressions ;
- audit des changements de statut ;
- revue des actions projet / équipe / réunion ;
- harmonisation des messages d’erreur métier.

### Priorité 4 — Amélioration UX / mobile
Objectif : rendre l’application plus confortable au quotidien, y compris sur téléphone.

Travaux :
- réduction des manipulations DOM directes ;
- harmonisation des modales ;
- meilleurs états de chargement ;
- amélioration des cartes et listes mobiles ;
- polish des pages projet / tâche / réunion.

### Priorité 5 — Gestion métier plus fine des tâches
Objectif : rendre le pilotage plus réaliste.

Travaux :
- priorité des tâches ;
- indicateurs d’échéance ;
- meilleurs filtres ;
- recherche ;
- états "en retard / aujourd’hui / bientôt".

### Priorité 6 — Réunions V2
Objectif : renforcer la valeur du module réunions.

Travaux :
- participants explicites ;
- meilleure exploitation des comptes-rendus ;
- décisions / actions à suivre ;
- meilleure visibilité des enregistrements.

---

## 3. Priorisation pratique

### Immédiat
1. Mise en ligne propre
2. Stabilisation post-déploiement
3. Commentaires sur les tâches

### Court terme
4. Durcissement des permissions
5. Amélioration UX/mobile
6. Gestion métier plus fine des tâches

### Moyen terme
7. Réunions V2
8. Historique d’activité V2
9. éventuelle intégration Jitsi plus avancée

---

## 4. Remarque stratégique

La prochaine vraie valeur métier visible pour les utilisateurs n’est probablement plus une grosse brique structurelle, car :
- équipes ;
- projets ;
- tâches ;
- réunions ;
- enregistrements ;
sont déjà présents.

La meilleure suite produit est donc :
- fiabiliser ;
- mettre en ligne ;
- améliorer la collaboration fine dans les tâches ;
- lisser l’expérience quotidienne.