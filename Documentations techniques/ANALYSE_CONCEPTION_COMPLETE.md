# Analyse et Conception Complète - Application Gestion de Projets (Sunu Projets)

**Document d'analyse détaillé basé sur le code existant**  
**Date : Avril 2026**

---

## Table des matières

1. [Vue d'ensemble du projet](#vue-densemble)
2. [Analyse des acteurs](#analyse-des-acteurs)
3. [Rôles et permissions](#rôles-et-permissions)
4. [Modèle de données](#modèle-de-données)
5. [Workflows complets](#workflows-complets)
6. [Diagrammes de séquence par acteur](#diagrammes-de-séquence)
7. [Diagrammes d'activité](#diagrammes-dactivité)
8. [Architecture du projet](#architecture)
9. [Technologies et dépendances](#technologies)

---

## Vue d'ensemble

### Description générale

**Sunu Projets** est une application web de gestion de projets, équipes et tâches destinée à une utilisation interne en entreprise. L'application permet de :

- Structurer et suivre les projets en équipes
- Distribuer et gérer des tâches avec assignation
- Organiser les réunions d'équipe
- Maintenir un historique d'activité
- Envoyer des notifications par email
- Intégrer des réunions vidéo (Jitsi)

### Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, DaisyUI |
| **Backend** | Server Actions (Next.js), Prisma ORM, MySQL |
| **Authentification** | Clerk |
| **Services externes** | Resend (emails), Jitsi V1 (vidéo) |
| **Validation** | Zod |

### URL de base

- Développement : `http://localhost:3000`
- Production : Configurable via `APP_BASE_URL`

---

## Analyse des acteurs

### Acteurs principaux identifiés

#### 1. **Utilisateur Non Authentifié**
- **Description** : Personne qui visite l'application sans connexion
- **Permissions** : Accès uniquement aux pages publiques (`/sign-in`, `/sign-up`)
- **Actions possibles** :
  - S'authentifier via Clerk
  - S'inscrire sur la plateforme

#### 2. **Utilisateur Authentifié (Employee/Collaborateur)**
- **Description** : Personne inscrite et connectée à la plateforme
- **Permissions** : Accès aux ressources selon son rôle dans chaque contexte
- **Actions possibles** :
  - Créer des projets personnels
  - Rejoindre des projets via code d'invitation
  - Créer des équipes
  - Rejoindre des équipes
  - Gérer les tâches qu'il crée ou qui lui sont assignées
  - Consulter les réunions

#### 3. **Propriétaire de Projet (Project Owner)**
- **Description** : Créateur du projet, rôle OWNER dans un projet
- **Permissions** : Contrôle complet sur le projet
- **Actions possibles** :
  - Ajouter/retirer des membres
  - Modifier les rôles des membres
  - Gérer toutes les tâches
  - Supprimer le projet
  - Consulter l'historique d'activité
  - Lier le projet à une équipe

#### 4. **Manager de Projet (Project Manager)**
- **Description** : Utilisateur avec rôle MANAGER dans un projet
- **Permissions** : Droits de gestion élevés mais non administratifs
- **Actions possibles** :
  - Créer et gérer les tâches
  - Assigner les tâches
  - Modifier les statuts des tâches
  - Consulter les membres du projet
  - Voir l'historique d'activité

#### 5. **Membre de Projet (Project Member)**
- **Description** : Utilisateur avec rôle MEMBER dans un projet
- **Permissions** : Droits limités de collaboration
- **Actions possibles** :
  - Consulter le projet et ses tâches
  - Créer des tâches
  - Modifier le statut de ses propres tâches
  - Voir ses tâches assignées

#### 6. **Propriétaire d'Équipe (Team Owner)**
- **Description** : Créateur de l'équipe, rôle OWNER dans une équipe
- **Permissions** : Contrôle complet de l'équipe
- **Actions possibles** :
  - Ajouter/retirer des membres
  - Modifier les rôles des membres
  - Créer des réunions
  - Gérer les projets de l'équipe
  - Supprimer l'équipe

#### 7. **Manager d'Équipe (Team Manager)**
- **Description** : Utilisateur avec rôle MANAGER dans une équipe
- **Permissions** : Droits de gestion élevés
- **Actions possibles** :
  - Créer des réunions
  - Ajouter des notes aux réunions
  - Gérer les enregistrements de réunion
  - Consulter les projets de l'équipe

#### 8. **Membre d'Équipe (Team Member)**
- **Description** : Utilisateur avec rôle MEMBER dans une équipe
- **Permissions** : Droits limités
- **Actions possibles** :
  - Consulter l'équipe
  - Voir les projets de l'équipe
  - Consulter les réunions

### Diagramme des acteurs

```mermaid
graph TB
    UAC["<b>Utilisateur Non Authentifié</b><br/>- S'authentifier<br/>- S'inscrire"]
    
    UA["<b>Utilisateur Authentifié</b><br/>- Créer des projets<br/>- Rejoindre des projets<br/>- Créer des équipes<br/>- Gérer ses tâches"]
    
    PO["<b>Propriétaire Projet</b><br/>Rôle: OWNER<br/>- Gestion complète<br/>- Ajouter/retirer membres<br/>- Modifier les rôles<br/>- Supprimer le projet"]
    
    PM["<b>Manager Projet</b><br/>Rôle: MANAGER<br/>- Créer/gérer tâches<br/>- Assigner les tâches<br/>- Voir l'historique"]
    
    MB["<b>Membre Projet</b><br/>Rôle: MEMBER<br/>- Consulter<br/>- Créer tâches<br/>- Modifier statut"]
    
    TO["<b>Propriétaire Équipe</b><br/>Rôle: OWNER<br/>- Gestion complète<br/>- Ajouter/retirer membres<br/>- Créer réunions"]
    
    TM["<b>Manager Équipe</b><br/>Rôle: MANAGER<br/>- Créer réunions<br/>- Gérer enregistrements"]
    
    TMB["<b>Membre Équipe</b><br/>Rôle: MEMBER<br/>- Consulter équipe<br/>- Voir réunions"]
    
    UAC -->|Authentification| UA
    UA -->|Dans un projet| PO
    UA -->|Dans un projet| PM
    UA -->|Dans un projet| MB
    UA -->|Crée équipe| TO
    UA -->|Dans équipe| TM
    UA -->|Dans équipe| TMB
```

---

## Rôles et permissions

### 1. Rôles au niveau Projet

#### OWNER (Propriétaire de projet)
- **Permissions** :
  - `canAdminProject(projectId)` → Accès complet
  - `canManageProject(projectId)` → Accès complet
  - Ajouter/modifier/retirer des membres
  - Gérer les rôles des membres
  - Supprimer le projet
  - Créer/modifier/supprimer les tâches
  - Voir l'historique d'activité

#### MANAGER (Manager de projet)
- **Permissions** :
  - `canManageProject(projectId)` → Accès autorisé
  - Créer/modifier/supprimer les tâches
  - Assigner les tâches
  - Modifier le statut des tâches
  - Voir les membres du projet
  - Voir l'historique d'activité
  - **INTERDIT** : Modifier les rôles des membres, supprimer le projet, retirer des membres

#### MEMBER (Membre de projet)
- **Permissions** :
  - `assertHasProjectRole(projectId, ["MEMBER"])` → Accès limité
  - Créer des tâches
  - Modifier uniquement le statut de ses propres tâches
  - Voir le projet et ses tâches
  - Voir les autres membres
  - Voir l'historique d'activité
  - **INTERDIT** : Modifer les tâches des autres, retirer des membres

### 2. Rôles au niveau Équipe

#### OWNER (Propriétaire d'équipe)
- **Permissions** :
  - `canAdminTeam(teamId)` → Accès complet
  - `canManageTeam(teamId)` → Accès complet
  - Ajouter/retirer/modifier les membres
  - Gérer les rôles des membres
  - Créer des réunions
  - Gérer les projets de l'équipe
  - Supprimer l'équipe

#### MANAGER (Manager d'équipe)
- **Permissions** :
  - `canManageTeam(teamId)` → Accès autorisé
  - Créer des réunions
  - Modifier les notes des réunions
  - Gérer les enregistrements de réunion
  - Changer le statut des réunions
  - **INTERDIT** : Modifier les rôles des membres, retirer des membres, supprimer l'équipe

#### MEMBER (Membre d'équipe)
- **Permissions** :
  - `assertHasTeamRole(teamId, ["OWNER", "MANAGER", "MEMBER"])` → Accès limité
  - Consulter l'équipe
  - Voir les projets de l'équipe
  - Consulter les réunions
  - **INTERDIT** : Créer des réunions, modifier les enregistrements

### 3. Matrice des Accès - Projet

| Action | OWNER | MANAGER | MEMBER |
|--------|:----:|:-------:|:------:|
| Voir le projet | ✅ | ✅ | ✅ |
| Créer tâche | ✅ | ✅ | ✅ |
| Modifier tâche propre | ✅ | ✅ | ✅ |
| Modifier tâche autre | ✅ | ✅ | ❌ |
| Supprimer tâche | ✅ | ✅ | ❌ |
| Voir membres | ✅ | ✅ | ✅ |
| Ajouter membre | ✅ | ❌ | ❌ |
| Modifier rôle membre | ✅ | ❌ | ❌ |
| Retirer membre | ✅ | ❌ | ❌ |
| Lier à équipe | ✅ | ❌ | ❌ |
| Supprimer projet | ✅ | ❌ | ❌ |
| Voir historique | ✅ | ✅ | ✅ |

### 4. Matrice des Accès - Équipe

| Action | OWNER | MANAGER | MEMBER |
|--------|:----:|:-------:|:------:|
| Voir équipe | ✅ | ✅ | ✅ |
| Voir projets | ✅ | ✅ | ✅ |
| Créer réunion | ✅ | ✅ | ❌ |
| Modifier notes réunion | ✅ | ✅ | ❌ |
| Ajouter enregistrement | ✅ | ✅ | ❌ |
| Changer statut réunion | ✅ | ✅ | ❌ |
| Ajouter membre | ✅ | ❌ | ❌ |
| Modifier rôle membre | ✅ | ❌ | ❌ |
| Retirer membre | ✅ | ❌ | ❌ |
| Supprimer équipe | ✅ | ❌ | ❌ |

---

## Modèle de données

### Entités principales

Le modèle de données est composé de 8 entités principales plus des énumérations pour les statuts et rôles.

### Diagramme de classes

```mermaid
classDiagram
    class User {
        -id: String UUID
        -name: String
        -email: String UNIQUE
        +tasks Task[]
        +createdTasks Task[]
        +projects Project[]
        +userProjects ProjectUser[]
        +activityLogs ActivityLog[]
        +createdTeams Team[]
        +teamMembers TeamMember[]
        +createdMeetings TeamMeeting[]
        +addedMeetingRecordings MeetingRecording[]
    }

    class Project {
        -id: String UUID
        -name: String
        -description: String NULLABLE
        -inviteCode: String UNIQUE
        -createdAt: DateTime
        -updatedAt: DateTime
        -createdById: String FK(User)
        -teamId: String FK(Team) NULLABLE
        +tasks Task[]
        +users ProjectUser[]
        +meetings TeamMeeting[]
        +activityLogs ActivityLog[]
    }

    class ProjectUser {
        -id: String UUID
        -userId: String FK(User)
        -projectId: String FK(Project)
        -role: ProjectRole ENUM
        -scope: ProjectCollaboratorScope ENUM
        +user User
        +project Project
        @@unique[userId, projectId]
    }

    class Task {
        -id: String UUID
        -name: String
        -description: String
        -status: String DEFAULT 'To Do'
        -dueDate: DateTime NULLABLE
        -projectId: String FK(Project)
        -userId: String FK(User) NULLABLE
        -createdById: String FK(User)
        -solutionDescription: String NULLABLE
        +project Project
        +user User
        +createdBy User
    }

    class Team {
        -id: String UUID
        -name: String
        -description: String NULLABLE
        -inviteCode: String UNIQUE
        -createdAt: DateTime
        -updatedAt: DateTime
        -createdById: String FK(User)
        +members TeamMember[]
        +projects Project[]
        +meetings TeamMeeting[]
        +recordings MeetingRecording[]
    }

    class TeamMember {
        -id: String UUID
        -teamId: String FK(Team)
        -userId: String FK(User)
        -role: TeamRole ENUM
        -joinedAt: DateTime
        +team Team
        +user User
        @@unique[teamId, userId]
    }

    class TeamMeeting {
        -id: String UUID
        -title: String
        -description: String NULLABLE
        -notes: String NULLABLE
        -scheduledAt: DateTime
        -durationMinutes: Int NULLABLE
        -status: MeetingStatus ENUM
        -provider: MeetingProvider ENUM
        -externalUrl: String NULLABLE
        -teamId: String FK(Team)
        -projectId: String FK(Project) NULLABLE
        -createdById: String FK(User)
        -createdAt: DateTime
        -updatedAt: DateTime
        +team Team
        +project Project
        +createdBy User
        +meetingRecordings MeetingRecording[]
    }

    class MeetingRecording {
        -id: String UUID
        -title: String
        -url: String
        -description: String NULLABLE
        -createdAt: DateTime
        -meetingId: String FK(TeamMeeting)
        -addedById: String FK(User)
        -teamId: String FK(Team) NULLABLE
        +meeting TeamMeeting
        +addedBy User
        +team Team
    }

    class ActivityLog {
        -id: String UUID
        -projectId: String FK(Project)
        -actorUserId: String FK(User)
        -type: ActivityType ENUM
        -message: String
        -createdAt: DateTime
        +project Project
        +actor User
        @@index[projectId, createdAt]
    }

    class ProjectRole {
        <<enumeration>>
        OWNER
        MANAGER
        MEMBER
    }

    class TeamRole {
        <<enumeration>>
        OWNER
        MANAGER
        MEMBER
    }

    class ProjectCollaboratorScope {
        <<enumeration>>
        INTERNAL
        EXTERNAL
    }

    class MeetingStatus {
        <<enumeration>>
        SCHEDULED
        COMPLETED
        CANCELLED
    }

    class MeetingProvider {
        <<enumeration>>
        NONE
        JITSI
    }

    class ActivityType {
        <<enumeration>>
        PROJECT_CREATED
        MEMBER_JOINED
        MEMBER_ROLE_UPDATED
        MEMBER_REMOVED
        TASK_CREATED
        TASK_STATUS_UPDATED
        TEAM_CREATED
        TEAM_MEMBER_JOINED
        TEAM_MEMBER_ROLE_UPDATED
        TEAM_MEMBER_REMOVED
        PROJECT_LINKED_TO_TEAM
    }

    User "1" --> "*" Project : crée
    User "1" --> "*" ProjectUser : appartient
    User "1" --> "*" Task : crée/assigné
    User "1" --> "*" Team : crée
    User "1" --> "*" TeamMember : appartient
    User "1" --> "*" TeamMeeting : crée
    User "1" --> "*" MeetingRecording : ajoute
    User "1" --> "*" ActivityLog : effectue

    Project "1" --> "*" ProjectUser : contient
    Project "1" --> "*" Task : contient
    Project "1" --> "*" TeamMeeting : contient
    Project "1" --> "*" ActivityLog : génère

    Team "1" --> "*" TeamMember : contient
    Team "1" --> "*" Project : contient
    Team "1" --> "*" TeamMeeting : contient
    Team "1" --> "*" MeetingRecording : contient

    TeamMeeting "1" --> "*" MeetingRecording : contient

    ProjectRole --|> ProjectUser
    TeamRole --|> TeamMember
    ProjectCollaboratorScope --|> ProjectUser
    MeetingStatus --|> TeamMeeting
    MeetingProvider --|> TeamMeeting
    ActivityType --|> ActivityLog
```

### Relations entre entités

#### User ↔ Project
- Un utilisateur peut créer plusieurs projets
- Un utilisateur peut être membre de plusieurs projets via ProjectUser
- Relation : Many-to-Many via ProjectUser

#### User ↔ Team
- Un utilisateur peut créer plusieurs équipes
- Un utilisateur peut être membre de plusieurs équipes via TeamMember
- Relation : Many-to-Many via TeamMember

#### Project ↔ Team
- Un projet peut appartenir à une seule équipe (nullable)
- Une équipe contient plusieurs projets
- Relation : One-to-Many

#### Project ↔ Task
- Un projet contient plusieurs tâches
- Une tâche appartient à un seul projet (cascade)
- Relation : One-to-Many avec suppression en cascade

#### Task ↔ User
- Une tâche peut être assignée à un utilisateur (nullable)
- Un utilisateur peut avoir plusieurs tâches assignées
- Une tâche est toujours créée par un utilisateur
- Relation : Many-to-One

#### Team ↔ TeamMeeting
- Une équipe peut avoir plusieurs réunions
- Une réunion appartient à une seule équipe (cascade)
- Relation : One-to-Many avec suppression en cascade

#### Project ↔ TeamMeeting
- Un projet peut avoir plusieurs réunions (nullable)
- Une réunion peut être liée à un seul projet (SetNull)
- Relation : One-to-Many

#### TeamMeeting ↔ MeetingRecording
- Une réunion peut avoir plusieurs enregistrements
- Un enregistrement appartient à une seule réunion (cascade)
- Relation : One-to-Many avec suppression en cascade

#### ActivityLog
- Enregistre les actions sur un projet
- Lié à l'utilisateur qui a effectué l'action

---

## Workflows complets

### Workflow 1 : Authentification et Synchronisation

```mermaid
sequenceDiagram
    participant User as Utilisateur
    participant App as Application
    participant Clerk as Clerk
    participant DB as Base de données

    User->>App: Accède à la page de connexion
    App->>Clerk: Affiche formulaire Clerk
    User->>Clerk: Entre ses identifiants
    Clerk->>App: Retourne token JWT + infos utilisateur
    App->>App: Extrait email et nom de l'utilisateur
    App->>DB: Recherche utilisateur par email
    alt Utilisateur existe
        DB->>App: Retourne l'utilisateur existant
        App->>App: Vérifie si le nom a changé
        alt Nom a changé
            App->>DB: Met à jour le nom
        end
    else Utilisateur n'existe pas
        App->>DB: Crée un nouvel utilisateur
        DB->>App: Retourne l'utilisateur créé
    end
    App->>App: Génère session utilisateur
    App->>User: Redirige vers le tableau de bord
```

### Workflow 2 : Création et Gestion d'un Projet

```mermaid
sequenceDiagram
    participant User as Propriétaire
    participant App as Application
    participant DB as Base de données

    User->>App: Clique sur "Nouveau Projet"
    App->>App: Affiche formulaire de création
    User->>App: Entre nom, description, email
    App->>App: Valide les données (Zod schema)
    alt Validation échouée
        App->>User: Affiche les erreurs
    else Validation réussie
        App->>DB: Recherche l'utilisateur par email
        alt Utilisateur trouvé
            App->>DB: Génère un code d'invitation unique
            App->>DB: Crée le projet
            App->>DB: Crée association ProjectUser (OWNER)
            App->>DB: Enregistre l'activité "PROJECT_CREATED"
            App->>User: Affiche le projet créé
            App->>User: Toast: "Projet créé"
        else Utilisateur non trouvé
            App->>User: Toast erreur: "Utilisateur non trouvé"
        end
    end
```

### Workflow 3 : Rejoindre un Projet

```mermaid
sequenceDiagram
    participant Member as Nouveau membre
    participant App as Application
    participant DB as Base de données

    Member->>App: Entre code d'invitation et email
    App->>App: Valide le code d'invitation et l'email
    alt Validation échouée
        App->>Member: Affiche les erreurs
    else Validation réussie
        App->>DB: Cherche le projet par inviteCode
        alt Projet trouvé
            App->>DB: Cherche l'utilisateur par email
            alt Utilisateur trouvé
                App->>DB: Vérifie que l'utilisateur n'est pas déjà membre
                alt Déjà membre
                    App->>Member: Erreur: "Déjà membre"
                else Pas encore membre
                    App->>DB: Crée association ProjectUser (MEMBER)
                    App->>DB: Enregistre l'activité "MEMBER_JOINED"
                    App->>Member: Toast: "Vous avez rejoint le projet"
                end
            else Utilisateur non trouvé
                App->>Member: Erreur: "Utilisateur non trouvé"
            end
        else Projet non trouvé
            App->>Member: Erreur: "Code d'invitation invalide"
        end
    end
```

### Workflow 4 : Création de Tâche avec Assignation

```mermaid
sequenceDiagram
    participant Creator as Créateur/Manager
    participant App as Application
    participant DB as Base de données
    participant Email as Service Email

    Creator->>App: Clique sur "Créer une tâche"
    App->>App: Affiche formulaire de création
    Creator->>App: Entre nom, description, date limite, assigné à
    App->>App: Vérifie l'accès au projet
    alt Accès refusé
        App->>Creator: Erreur 403
    else Accès autorisé
        App->>App: Valide les données (Zod schema)
        alt Validation échouée
            App->>Creator: Affiche les erreurs
        else Validation réussie
            alt Assigné à un autre utilisateur
                App->>DB: Cherche l'utilisateur assigné
                alt Utilisateur trouvé
                    App->>DB: Vérifie que l'utilisateur est membre du projet
                    alt Non membre du projet
                        App->>Creator: Erreur: "L'utilisateur n'appart. pas au projet"
                    else Membre du projet
                        App->>DB: Crée la tâche avec assignation
                        Email->>Email: Prépare email d'assignation
                        Email->>Email: Formate la date
                        Email->>Email: Génère le HTML de l'email
                        Email->>Email: Envoie via Resend
                        App->>DB: Enregistre l'activité "TASK_CREATED"
                        App->>Creator: Toast: "Tâche créée et email envoyé"
                    end
                else Utilisateur non trouvé
                    App->>Creator: Erreur: "Utilisateur assigné introuvable"
                end
            else Tâche auto-assignée ou pas d'assignation
                App->>DB: Crée la tâche
                App->>DB: Enregistre l'activité "TASK_CREATED"
                App->>Creator: Toast: "Tâche créée"
            end
        end
    end
```

### Workflow 5 : Modification du Statut d'une Tâche

```mermaid
sequenceDiagram
    participant User as Utilisateur
    participant App as Application
    participant DB as Base de données

    User->>App: Clique pour modifier le statut de la tâche
    App->>App: Affiche les options de statut (To Do, In Progress, Done)
    User->>App: Sélectionne un nouveau statut

    alt Nouveau statut = "Done"
        App->>User: Affiche champ pour "Description de solution"
        User->>App: Entre la description ou annule
        alt Pas de description
            App->>User: Erreur: "Description requise"
        else Description fournie
            App->>App: Valide l'accès (tâche créée, assignée ou propriétaire projet)
            alt Accès refusé
                App->>User: Erreur 403: "Non autorisé"
            else Accès autorisé
                App->>DB: Met à jour le statut et la description
                App->>DB: Enregistre l'activité "TASK_STATUS_UPDATED"
                App->>User: Toast: "Statut mis à jour"
                App->>User: Rafraîchit l'affichage
            end
        end
    else Autre statut
        App->>App: Valide l'accès
        alt Accès refusé
            App->>User: Erreur 403
        else Accès autorisé
            App->>DB: Met à jour le statut
            App->>DB: Enregistre l'activité "TASK_STATUS_UPDATED"
            App->>User: Toast: "Statut mis à jour"
            App->>User: Rafraîchit l'affichage
        end
    end
```

### Workflow 6 : Gestion des Rôles dans un Projet

```mermaid
sequenceDiagram
    participant Owner as Propriétaire
    participant App as Application
    participant DB as Base de données

    Owner->>App: Accède à la page des membres du projet
    App->>App: Vérifie que l'utilisateur est OWNER
    alt Utilisateur n'est pas OWNER
        App->>Owner: Accès refusé
    else Utilisateur est OWNER
        App->>DB: Récupère tous les membres du projet
        App->>Owner: Affiche liste des membres par rôle
        
        Owner->>App: Clique sur "Modifier le rôle" du membre
        App->>App: Affiche dialogue de confirmation
        Owner->>App: Sélectionne nouveau rôle (MANAGER ou MEMBER)
        
        App->>App: Valide le nouveau rôle
        alt Rôle actuel = OWNER
            App->>Owner: Erreur: "OWNER ne peut pas être modifié"
        else Rôle valide
            App->>DB: Met à jour le rôle du membre
            App->>DB: Enregistre l'activité "MEMBER_ROLE_UPDATED"
            App->>Owner: Toast: "Rôle mis à jour"
            App->>Owner: Rafraîchit la liste
        end
        
        Owner->>App: Clique sur "Retirer" le membre
        App->>App: Affiche confirmation
        Owner->>App: Confirme la suppression
        
        alt Utilisateur à retirer = OWNER
            App->>Owner: Erreur: "OWNER ne peut pas être retiré"
        else Utilisateur est MANAGER ou MEMBER
            App->>DB: Supprime l'association ProjectUser
            App->>DB: Enregistre l'activité "MEMBER_REMOVED"
            App->>Owner: Toast: "Membre retiré"
            App->>Owner: Rafraîchit la liste
        end
    end
```

### Workflow 7 : Création et Gestion d'Équipe

```mermaid
sequenceDiagram
    participant User as Utilisateur
    participant App as Application
    participant DB as Base de données

    User->>App: Clique sur "Nouvelle équipe"
    App->>App: Affiche formulaire de création
    User->>App: Entre nom et description (optionnel)
    App->>App: Valide les données
    alt Validation échouée
        App->>User: Affiche les erreurs
    else Validation réussie
        App->>App: Récupère l'utilisateur connecté
        App->>DB: Génère un code d'invitation unique
        App->>DB: Crée l'équipe
        App->>DB: Ajoute le créateur comme TeamMember avec rôle OWNER
        App->>User: Toast: "Équipe créée"
        App->>User: Redirige vers la page "Équipes"
    end

    User->>App: Accède à la page "Équipes"
    App->>DB: Récupère les équipes de l'utilisateur
    App->>User: Affiche la liste des équipes avec stats

    User->>App: Veut rejoindre une équipe
    App->>App: Affiche champ pour le code d'invitation
    User->>App: Entre le code d'invitation
    App->>App: Valide le code
    alt Validation échouée
        App->>User: Toast erreur
    else Code valide
        App->>DB: Cherche l'équipe par inviteCode
        alt Équipe trouvée
            App->>App: Récupère l'utilisateur connecté
            App->>DB: Ajoute l'utilisateur à l'équipe (rôle MEMBER)
            App->>User: Toast: "Équipe rejointe"
        else Équipe non trouvée
            App->>User: Toast erreur: "Code invalide"
        end
    end
```

### Workflow 8 : Création et Gestion de Réunion

```mermaid
sequenceDiagram
    participant Manager as Manager/Propriétaire
    participant App as Application
    participant DB as Base de données

    Manager->>App: Accède à la section réunions
    App->>App: Vérifie que l'utilisateur est OWNER ou MANAGER d'équipe
    alt Accès refusé
        App->>Manager: Erreur 403
    else Accès autorisé
        Manager->>App: Clique sur "Créer réunion"
        App->>App: Affiche formulaire
        Manager->>App: Entre titre, description, date, durée, projet (opt.), URL (opt.)
        
        App->>App: Valide les données
        alt Validation échouée
            App->>Manager: Affiche les erreurs
        else Validation réussie
            alt Projet sélectionné
                App->>DB: Vérifie que le projet appartient à l'équipe
                alt Projet n'appartient pas à l'équipe
                    App->>Manager: Erreur: "Projet n'appartient pas à l'équipe"
                else Projet valide
                    App->>DB: Crée la TeamMeeting
                    App->>Manager: Toast: "Réunion créée"
                end
            else Pas de projet
                App->>DB: Crée la TeamMeeting
                App->>Manager: Toast: "Réunion créée"
            end
        end

        Manager->>App: Accède au détail de la réunion
        alt Statut = SCHEDULED
            Manager->>App: Clique pour ajouter des notes
            Manager->>App: Entre le compte-rendu
            App->>DB: Sauvegarde les notes
            App->>Manager: Toast: "Notes sauvegardées"
        end

        Manager->>App: Clique pour changer le statut en COMPLETED
        App->>DB: Met à jour le statut
        App->>Manager: Toast: "Statut changeé"

        Manager->>App: Clique pour ajouter un enregistrement
        App->>App: Affiche formulaire d'enregistrement
        Manager->>App: Entre titre, URL, description (opt.)
        App->>App: Valide l'URL
        alt URL invalide
            App->>Manager: Erreur: "URL invalide"
        else URL valide
            App->>DB: Crée l'enregistrement
            App->>Manager: Toast: "Enregistrement ajouté"
        end
    end
```

---

## Diagrammes de séquence

### DS-1 : Diagramme de séquence - Collaborateur Externe Rejoignant un Projet

```mermaid
sequenceDiagram
    participant External as Collaborateur Externe
    participant Platform as Plateforme
    participant DB as Base de données
    participant Email as Notificateur

    External->>Platform: Reçoit le code d'invitation par email
    External->>Platform: S'inscrit officiellement
    External->>Platform: Se connecte
    Platform->>DB: Récupère les infos utilisateur (Clerk)
    DB->>Platform: Utilisateur créé/vérifié
    
    External->>Platform: Accède à la page "Rejoindre projet"
    External->>Platform: Entre le code d'invitation
    Platform->>DB: Vérifie le code et le projet
    alt Code valide et projet existe
        DB->>Platform: Retourne le projet
        Platform->>DB: Vérifie que externe n'est pas déjà membre
        Platform->>DB: Ajoute externe au projet (MEMBER + scope EXTERNAL)
        Platform->>DB: Crée activité "MEMBER_JOINED"
        Email->>Email: Prépare notif pour propriétaire
        Platform->>External: Toast: "Ajouté au projet"
        Platform->>External: Redirige vers le projet
    else Code invalide
        Platform->>External: Erreur: "Code invalide"
    end
```

### DS-2 : Diagramme de séquence - Cycle de Vie d'une Tâche

```mermaid
sequenceDiagram
    participant Creator as Créateur
    participant Assignee as Assigné
    participant Manager as Manager
    participant App as App
    participant DB as DB

    Creator->>App: Crée une tâche
    App->>DB: Tâche créée (status: "To Do")
    DB->>App: Retourne la tâche
    App->>Assignee: Email d'assignation
    
    Assignee->>App: Accepte la tâche et la met en cours
    App->>DB: Status: "In Progress"
    
    Manager->>App: Peut voir le progression
    App->>DB: Récupère les statistiques
    
    Assignee->>App: Déplace vers "Done"
    App->>App: Demande description de solution
    Assignee->>App: Fournit la description
    App->>DB: Sauvegarde status "Done" + description
    
    Creator->>App: Voit la tâche terminée
    Creator->>App: Peut consulter la solution
```

### DS-3 : Diagramme de séquence - Admin Gérant les Permissions d'Équipe

```mermaid
sequenceDiagram
    participant Owner as Propriétaire Équipe
    participant Member as Membre
    participant App as Application
    participant DB as Base de données

    Owner->>App: Accède aux paramètres de l'équipe
    App->>DB: Récupère la liste des membres
    App->>Owner: Affiche les membres
    
    Owner->>App: Voit "Member" et veut le promouvoir
    Owner->>App: Clique sur "Changer en Manager"
    App->>App: Vérifie que Owner a les droits
    
    alt Owner n'a pas les droits
        App->>Owner: Erreur 403
    else Owner a les droits
        App->>DB: Met à jour le rôle du Member en MANAGER
        DB->>App: Confirmation
        App->>Member: Notification: "Vous êtes Manager de l'équipe"
        App->>Owner: Toast: "Rôle mis à jour"
    end
```

---

## Diagrammes d'activité

### DA-1 : Diagramme d'activité - Processus de Création de Projet

```mermaid
activity
    title Processus de Création de Projet
    
    start

    :Utilisateur clique "Nouveau Projet";
    :[Formulaire affiché];
    :Utilisateur entre nom et description;
    :Application valide les données;

    if (Validation réussie ?) then (Oui)
        :Application recherche l'utilisateur;
        if (Utilisateur existe ?) then (Oui)
            :Génère code d'invitation;
            :Crée le projet;
            :Crée association ProjectUser (OWNER);
            :Enregistre activité PROJECT_CREATED;
            :Affiche le projet;
            :Toast de succès;
        else (Non)
            :Affiche erreur "Utilisateur non trouvé";
        endif
    else (Non)
        :Affiche les erreurs de validation;
    endif

    end
```

### DA-2 : Diagramme d'activité - Cycle de Vie de Tâche

```mermaid
activity
    title Cycle de Vie d'une Tâche

    start

    :Créateur crée une tâche;
    :Statut = "To Do";
    :Tâche affichée pour les membres;

    if (Tâche assignée ?) then (Oui)
        :Email d'assignation envoyé;
    else (Non)
        :Pas d'email;
    endif

    :Assigné voit la tâche;

    repeat
        :Assigné peut modifier le statut;
        if (Nouveau statut = "In Progress" ?) then (Oui)
            :Tâche marquée en cours;
        else if (Nouveau statut = "Done" ?) then (Oui)
            :Demander description de solution;
            if (Description fournie ?) then (Oui)
                :Tâche marquée terminée;
                :Description sauvegardée;
                break
            else (Non)
                :Erreur affichée;
            endif
        else if (Nouveau statut = "To Do" ?) then (Oui)
            :Tâche remise à faire;
        endif
        endif
        endif
    until (Tâche terminée ?)

    :Créateur peut voir la solution;
    :Archivage de la tâche;

    end
```

### DA-3 : Diagramme d'activité - Vérification de Permissions

```mermaid
activity
    title Vérification des Permissions d'Accès

    start

    :Utilisateur tente d'accéder à une ressource;
    :Application récupère l'ID de l'utilisateur;

    :Application recherche le rôle dans:
    if (Ressource = Projet ?) then (Oui)
        :Cherche dans ProjectUser;
    else if (Ressource = Équipe ?) then (Oui)
        :Cherche dans TeamMember;
    else (Autre)
        :Erreur: Resource non trouvée;
        end
    endif
    endif

    if (Membership trouvée ?) then (Oui)
        :Récupère le rôle;
        if (Action requiert rôle OWNER ?) then (Oui)
            if (Rôle = OWNER ?) then (Oui)
                :Accès autorisé;
            else (Non)
                :Erreur 403;
                end
            endif
        else if (Action requiert rôle MANAGER ?) then (Oui)
            if (Rôle = OWNER ou MANAGER ?) then (Oui)
                :Accès autorisé;
            else (Non)
                :Erreur 403;
                end
            endif
        else if (Action requiert rôle MEMBER ?) then (Oui)
            :Accès autorisé;
        endif
        endif
        endif
    else (Non)
        :Erreur 403: Pas d'accès;
        end
    endif

    :Exécuter l'action demandée;
    end
```

### DA-4 : Diagramme d'activité - Assignation de Tâche avec Email

```mermaid
activity
    title Assignation de Tâche et Notification Email

    start

    :Utilisateur crée une tâche;
    :Entre le destinataire (email);

    if (Email fourni et != créateur ?) then (Oui)
        :Cherche l'utilisateur par email;
        if (Utilisateur trouvé ?) then (Oui)
            :Vérifie qu'il est membre du projet;
            if (Membre du projet ?) then (Oui)
                :Crée la tâche assignée;
                :Prépare le contenu email;
                :Formate la date;
                :Génère le HTML de l'email;
                :Envoie via Resend;
                if (Email envoyé ?) then (Oui)
                    :Toast: "Tâche créée et email envoyé";
                else (Non)
                    :Toast: Avertissement envoi email;
                endif
                :Enregistre activité TASK_CREATED;
            else (Non)
                :Erreur: Utilisateur n'appartient pas au projet;
                end
            endif
        else (Non)
            :Erreur: Utilisateur non trouvé;
            end
        endif
    else (Non)
        :Crée la tâche sans assignation;
        :Toast: "Tâche créée";
        :Enregistre activité TASK_CREATED;
    endif

    end
```

---

## Architecture

### Architecture générale

```mermaid
graph TB
    subgraph Client["Frontend - Client-Side (Next.js + React 19)"]
        UI["Pages & Composants<br/>- page.tsx<br/>- ProjectComponent<br/>- TaskComponent<br/>- TeamComponent"]
        State["État Global<br/>- useState<br/>- useEffect<br/>- Clerk useUser()"]
        UI -.-> State
    end

    subgraph Server["Backend - Server-Side (Next.js Server Actions)"]
        SA["Server Actions<br/>- projects.ts<br/>- tasks.ts<br/>- teams.ts<br/>- members.ts<br/>- meetings.ts<br/>- users.ts<br/>- activity.ts"]
        Auth["Authentification & Permissions<br/>- getCurrentDbUser()<br/>- assertProjectMember()<br/>- assertTeamMember()<br/>- canManageProject()<br/>- canAdminProject()"]
    end

    subgraph Services["Services Externes"]
        Clerk["Clerk<br/>Auth à la demande"]
        Resend["Resend<br/>Email Service"]
        Jitsi["Jitsi <br/>Réunions vidéo"]
    end

    subgraph Database["Persistance - MySQL + Prisma"]
        PrismaORM["Prisma ORM"]
        MySQL["MySQL Database"]
        Schema["Schéma:<br/>- User<br/>- Project<br/>- ProjectUser<br/>- Task<br/>- Team<br/>- TeamMember<br/>- TeamMeeting<br/>- MeetingRecording<br/>- ActivityLog"]
        PrismaORM -->|Query & Mutation| MySQL
        MySQL -->|Schema| Schema
    end

    subgraph Validation["Validation & Sécurité"]
        Zod["Zod Schemas<br/>- createProjectSchema<br/>- createTaskSchema<br/>- joinProjectSchema"]
        Middleware["Middleware Clerk<br/>proxy.ts"]
    end

    subgraph Styling["UI Framework"]
        Tailwind["Tailwind CSS 4<br/>+ DaisyUI"]
        Icons["Lucide React<br/>Icons"]
        Toast["React Toastify<br/>Notifications"]
    end

    Client -->|"Server Actions (RPC)"| Server
    Client -->|useUser()| Clerk
    Client -->|Display| Styling

    Server -->|Query/Mutation| PrismaORM
    Server -->|Validate| Zod
    Server -->|Auth Check| Auth
    Server -->|Send Email| Resend
    
    Auth -->|Read| Database
    
    Middleware -->|Protect Routes| Client

    UI -->|useEffect()| Server

    style Client fill:#e1f5ff
    style Server fill:#f3e5f5
    style Services fill:#fff3e0
    style Database fill:#e8f5e9
    style Validation fill:#fce4ec
    style Styling fill:#f1f8e9
```

### Couches de l'architecture

#### 1. **Couche Présentation (Frontend)**
- **Composants React** : Page.tsx, ProjectComponent, TaskComponent, etc.
- **Gestion d'état** : useState, useEffect, Clerk integrations
- **Frameworks UI** : Tailwind CSS + DaisyUI
- **Notification** : React Toastify
- **Communication** : Next.js Server Actions

#### 2. **Couche Business Logic (Server Actions)**
- **Projets** : createProject, getProjectsCreatedByUSer, deleteProjectById, addUserToProject
- **Tâches** : createTask, deleteTaskById, getTaskDetails, updateTaskStatus
- **Équipes** : createTeam, getTeamsForCurrentUser, getTeamDetails, joinTeamByInviteCode
- **Membres** : getProjectUsers, updateProjectMemberRole, removeProjectMember
- **Réunions** : createMeeting, updateMeetingNotes, addMeetingRecording
- **Activité** : createActivityLog, getProjectActivityLogs
- **Utilisateurs** : checkAndAddUser

#### 3. **Couche Permissions & Authentification**
- **Authentification** : Clerk (JWT, session)
- **Autorisation** :
  - `getCurrentDbUser()` : Récupère l'utilisateur connecté
  - `assertProjectMember()` : Vérifie l'accès au projet
  - `assertTaskAccess()` : Vérifie l'accès à la tâche
  - `assertTeamMember()` : Vérifie l'accès à l'équipe
  - `canManageProject()` / `canAdminProject()` : Vérifie les rôles
  - `canManageTeam()` / `canAdminTeam()` : Vérifie les rôles

#### 4. **Couche Données (Persistance)**
- **ORM** : Prisma
- **Base de données** : MySQL
- **Entités** : User, Project, Task, Team, TeamMember, TeamMeeting, MeetingRecording, ActivityLog
- **Indexation** : Sur projectId, teamId, createdAt pour performance

#### 5. **Couche Services Externes**
- **Clerk** : Authentification OAuth
- **Resend** : Envoi d'emails transactionnels
- **Jitsi** : Vidéoconférence (V1 via URL externe)

#### 6. **Couche Validation**
- **Zod** : Validation des schémas d'entrée
- **Middleware** : Protection des routes privées

### Flux de données - Exemple: Créer une Tâche

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (page.tsx)                                             │
│  - Utilisateur remplit formulaire                               │
│  - Clique "Créer tâche"                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVER ACTION (tasks.ts - createTask)                           │
│  1. Récupère les params du formulaire                           │
│  2. Valide avec Zod schema                                      │
│  3. Appel assertProjectMember()                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PERMISSIONS CHECK (permissions.ts)                              │
│  - getCurrentDbUser() → récupère user de Clerk                  │
│  - Vérifie que user.id est membre du projet                     │
│  - Retourne {user, project} ou lance ActionError               │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────────────┐
        │                                 │
        ▼                                 ▼
    ✅ Autorisé                    ❌ Non autorisé
    (continue)                     (lance erreur)
        │                                 │
        ▼                                 ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│ Cherche user assigné     │    │ Retour au frontend:     │
│  (si fourni)             │    │ - Toast erreur          │
│  - Si existe & membre OK │    │ - Redirige              │
│  - Prepare email         │    └─────────────────────────┘
└────────────────────┬─────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE OPERATIONS (Prisma)                                    │
│  1. prisma.task.create() → crée la tâche                        │
│  2. createActivityLog() → enregistre l'action                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXTERNAL SERVICES                                               │
│  - Email service (Resend) - IF tasked est assignée             │
│  - Envoie notification                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (page.tsx)                                             │
│  - Toast de succès                                              │
│  - Rafraîchit la liste des tâches                              │
│  - Affiche la nouvelle tâche                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technologies et dépendances

### Stack technique détaillé

#### Frontend
| Package | Version | Utilisation |
|---------|---------|-------------|
| `next` | 16.1.7 | Framework React/SSR |
| `react` | 19.2.3 | Bibliothèque UI |
| `react-dom` | 19.2.3 | Rendu DOM |
| `typescript` | 5 | Typage statique |
| `@tailwindcss/postcss` | 4.2.1 | Framework CSS utilitaire |
| `daisyui` | 5.5.19 | Composants prêts à l'emploi |
| `lucide-react` | 0.577.0 | Icônes SVG |
| `react-toastify` | 11.0.5 | Notifications toast |
| `react-quill-new` | 3.7.0 | Éditeur riche (WYSIWYG) |

#### Backend & Données
| Package | Version | Utilisation |
|---------|---------|-------------|
| `@prisma/client` | 6.19.2 | ORM & client |
| `prisma` | 6.19.2 | CLI Prisma |
| `@clerk/nextjs` | 7.0.4 | Authentification |
| `zod` | 4.3.6 | Validation de schémas |
| `resend` | 6.9.4 | Service d'emails |

#### Développement
| Package | Version | Utilisation |
|---------|---------|-------------|
| `eslint` | 9 | Linting JavaScript |
| `eslint-config-next` | 16.1.7 | Config ESLint pour Next.js |
| `babel-plugin-react-compiler` | 1.0.0 | Compilateur React |
| `dotenv` | 17.3.1 | Variables d'environnement |

### Scripts disponibles

```bash
npm run dev       # Démarrer le serveur de développement
npm run build     # Construire pour la production
npm run start     # Démarrer le serveur de production
npm run lint      # Vérifier le code avec ESLint
```

### Variables d'environnement

```env
# Projet
APP_BASE_URL=http://localhost:3000

# Base de données
DATABASE_URL=mysql://user:password@host:3306/database

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Resend (Emails)
RESEND_API_KEY=...
EMAIL_FROM=...
```

---

## Résumé des observations clés

### Points forts du design

1. **Séparation des responsabilités** : Permissions, actions, et logique métier bien séparées
2. **Sécurité** : Vérifications systématiques des permissions avant chaque opération
3. **Validation** : Utilisation de Zod pour garantir l'intégrité des données
4. **Traçabilité** : Historique d'activité complet de chaque projet
5. **Notifications** : Email transactionnel pour les assignations de tâches
6. **Flexibilité des rôles** : Rôles granulaires au niveau projet et équipe

### Points à améliorer

1. **Enregistrements de réunion** : Actuellement seulement des URLs
2. **Jitsi intégration** : V1 avec URL externe, pas d'intégration embarquée complète
3. **Notifications** : Seulement email pour assignation de tâche, pas de notifications en-app
4. **Éditions de tâches** : Pas de possibilité de modifier une tâche créée
5. **Suppression de projet/équipe** : Compl cassade nécessaire de vérification
6. **Pagination** : Logs d'activité limités à 20 derniers

### Capacités actuelles

✅ Authentification robuste (Clerk)
✅ Gestion des projets et équipes
✅ Assignation et suivi des tâches
✅ Historique d'activité
✅ Notifications email
✅ Rôles et permissions granulaires
✅ Code d'invitation pour rejoindre
✅ Réunions et enregistrements
✅ Responsive et mobile-friendly

---

## Conclusion

L'application **Sunu Projets** est une plateforme de gestion de projets bien architecturée, avec une séparation claire des responsabilités, une sécurité robuste et une scalabilité établie. Le modèle de données est normalisé, les workflows sont clairement définis, et l'application est prête pour utilisation en environnement d'entreprise.

L'architecture modulaire permet des extensions futures, notamment pour les vidéoconférences embarquées, les notifications en-app, et les exportations de rapports.
