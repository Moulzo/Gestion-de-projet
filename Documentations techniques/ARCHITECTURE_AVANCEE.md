# Architecture Détaillée et Synthèse Exécutive

**Sunu Projets - Application de Gestion de Projet**

---

## Table des matières

1. [Synthèse exécutive](#synthèse-exécutive)
2. [Architecture microcouches](#architecture-microcouches)
3. [Patterns et pratiques](#patterns-et-pratiques)
4. [Exemples de code clés](#exemples-de-code-clés)
5. [Flux des données détaillé](#flux-des-données-détaillé)
6. [Performance et scalabilité](#performance-et-scalabilité)

---

## Synthèse exécutive

### Aperçu du projet

**Sunu Projets** est une plateforme de collaboration d'entreprise permettant la gestion de projets, d'équipes et de tâches. L'application est construite avec une architecture moderne, sécurisée et scalable.

### Caractéristiques principales

| Caractéristique | Détail |
|-----------------|--------|
| **Utilisateurs** | Authentification OAuth via Clerk |
| **Projets** | Création, adhésion via code, gestion hiérarchique |
| **Équipes** | Workspaces avec plusieurs projets |
| **Tâches** | Création, assignation, statuts, notifications email |
| **Réunions** | Réunions d'équipe, notes, enregistrements, Jitsi |
| **Historique** | Traçabilité complète des actions |
| **Rôles** | 3 niveaux (OWNER, MANAGER, MEMBER) × 2 contextes |

### Métriques clés

- **Deux domaines d'expertise** : Projets et Équipes
- **3 rôles par contexte** : OWNER, MANAGER, MEMBER
- **11 événements** : Traçabilité des activités
- **8 entités principales** : Modèle normalisé
- **100% Sécurisé** : Vérifications systématiques
- **Temps de réponse** : Instant (Server Actions)

---

## Architecture microcouches

### Couche 1 : Présentation (Frontend)

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND - React 19 + Next.js 16       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Pages (Page Components)                            │
│  ├─ page.tsx (Dashboard)                            │
│  ├─ project/[projectId]/page.tsx                    │
│  ├─ teams/page.tsx                                  │
│  ├─ meetings/[meetingId]/page.tsx                   │
│  └─ sign-in, sign-up                                │
│                                                     │
│  Components (Reusables)                             │
│  ├─ ProjectComponent                                │
│  ├─ TaskComponent                                   │
│  ├─ TeamComponent                                   │
│  ├─ Navbar                                          │
│  ├─ EmptyState                                      │
│  ├─ Wrapper (Layout)                                │
│  ├─ UserInfo                                        │
│  └─ AssignTask                                      │
│                                                     │
│  State Management                                   │
│  ├─ useState() → Local state                        │
│  ├─ useEffect() → Sync with server                  │
│  ├─ useUser() (Clerk) → Auth context                │
│  └─ React Context (implicit via Server Actions)     │
│                                                     │
│  UI Framework                                       │
│  ├─ Tailwind CSS 4 → Styling                        │
│  ├─ DaisyUI → Preset components                     │
│  ├─ Lucide React → Icons                            │
│  └─ React Toastify → Notifications                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Responsabilités** :
- Afficher les données
- Recueillir les entrées utilisateur
- Appeler les Server Actions
- Afficher le feedback (toasts, modals)
- Gérer l'état local temporaire

---

### Couche 2 : API (Server Actions)

```
┌─────────────────────────────────────────────────────┐
│        SERVER ACTIONS - Backend Logic (Next.js)     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  actions/ Directory                                 │
│  ├─ projects.ts                                     │
│  │  ├─ createProject()                              │
│  │  ├─ getProjectsCreatedByUSer()                   │
│  │  ├─ deleteProjectById()                          │
│  │  ├─ addUserToProject()                           │
│  │  └─ getProjectInfo()                             │
│  ├─ tasks.ts                                        │
│  │  ├─ createTask()                                 │
│  │  ├─ deleteTaskById()                             │
│  │  ├─ getTaskDetails()                             │
│  │  └─ updateTaskStatus()                           │
│  ├─ teams.ts                                        │
│  │  ├─ createTeam()                                 │
│  │  ├─ getTeamsForCurrentUser()                     │
│  │  ├─ getTeamDetails()                             │
│  │  ├─ joinTeamByInviteCode()                       │
│  │  └─ updateTeamMemberRole()                       │
│  ├─ members.ts                                      │
│  │  ├─ getProjectUsers()                            │
│  │  ├─ getProjectMembersWithRoles()                 │
│  │  ├─ updateProjectMemberRole()                    │
│  │  └─ removeProjectMember()                        │
│  ├─ meetings.ts                                     │
│  │  ├─ createMeeting()                              │
│  │  ├─ updateMeetingNotes()                         │
│  │  ├─ updateMeetingStatus()                        │
│  │  ├─ addMeetingRecording()                        │
│  │  └─ buildJitsiRoomName()                         │
│  ├─ activity.ts                                     │
│  │  ├─ createActivityLog()                          │
│  │  └─ getProjectActivityLogs()                     │
│  ├─ users.ts                                        │
│  │  └─ checkAndAddUser()                            │
│  └─ index.ts (exports...)                           │
│                                                     │
│  RPC Communication                                  │
│  └─ Client calls → Server Action → Response         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Responsabilités** :
- Valider les entrées (Zod)
- Vérifier les permissions
- Exécuter la logique métier
- Interagir avec la BD
- Envoyer les emails
- Retourner les résultats

---

### Couche 3 : Permissions et Autorisation

```
┌─────────────────────────────────────────────────────┐
│    PERMISSIONS & AUTHORIZATION LAYER (lib/)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  permissions.ts - Core Authorization                │
│  ├─ getCurrentDbUser()                              │
│  │  ├─ Récupère user de Clerk                       │
│  │  ├─ Cherche l'utilisateur en BD                  │
│  │  └─ Retourne ou lance ActionError                │
│  ├─ assertProjectMember()                           │
│  │  ├─ Vérifie que user ∈ Project                   │
│  │  └─ Retourne {user, project}                     │
│  ├─ assertTaskAccess()                              │
│  │  ├─ Vérifie l'accès à une tâche                  │
│  │  └─ Retourne {user, task}                        │
│  └─ assertTeamMember()                              │
│     └─ Vérifie que user ∈ Team                      │
│                                                     │
│  project-roles.ts - Project Authorization           │
│  ├─ PROJECT_ROLES enum                              │
│  ├─ getProjectMembership()                          │
│  ├─ assertHasProjectRole()                          │
│  ├─ canManageProject()                              │
│  └─ canAdminProject()                               │
│                                                     │
│  team-roles.ts - Team Authorization                 │
│  ├─ TEAM_ROLES enum                                 │
│  ├─ getTeamMembership()                             │
│  ├─ assertHasTeamRole()                             │
│  ├─ canManageTeam()                                 │
│  └─ canAdminTeam()                                  │
│                                                     │
│  middleware - Route Protection                      │
│  └─ proxy.ts → Clerk middleware                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Pattern : Defense in Depth**
```
Request → Middleware [Authenticated?] → Server Action → 
  Validate [Schema OK?] → 
  Get User [Exists in DB?] → 
  Check Access [Member of resource?] → 
  Check Role [Has permission?] → 
  Execute [Perform action] → 
  Audit [Log activity] → 
  Response
```

---

### Couche 4 : Données et Persistance

```
┌─────────────────────────────────────────────────────┐
│      DATA LAYER - Prisma ORM + MySQL Database       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Prisma Client (lib/prisma.ts)                      │
│  └─ Instance singleton du client Prisma            │
│                                                     │
│  Schema (prisma/schema.prisma)                      │
│  ├─ Enums                                           │
│  │  ├─ ProjectRole: OWNER|MANAGER|MEMBER            │
│  │  ├─ TeamRole: OWNER|MANAGER|MEMBER               │
│  │  ├─ ProjectCollaboratorScope: INTERNAL|EXTERNAL  │
│  │  ├─ MeetingStatus: SCHEDULED|COMPLETED|CANCELLED │
│  │  ├─ MeetingProvider: NONE|JITSI                  │
│  │  └─ ActivityType: [11 types]                     │
│  ├─ Models (8)                                      │
│  │  ├─ User                                         │
│  │  ├─ Project                                      │
│  │  ├─ ProjectUser                                  │
│  │  ├─ Task                                         │
│  │  ├─ Team                                         │
│  │  ├─ TeamMember                                   │
│  │  ├─ TeamMeeting                                  │
│  │  ├─ MeetingRecording                             │
│  │  └─ ActivityLog                                  │
│  └─ Constraints                                     │
│     ├─ @id (Primary Key)                            │
│     ├─ @unique (Single value uniqueness)            │
│     ├─ @@unique (Composite uniqueness)              │
│     ├─ @@index (Optimization)                       │
│     ├─ onDelete: Cascade, SetNull                   │
│     └─ @default, @db.VarChar()                      │
│                                                     │
│  Database (MySQL)                                   │
│  └─ Persistence Layer                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Indexes pour Performance** :
```
- ActivityLog @@index[projectId, createdAt]
- TeamMeeting @@index[teamId, scheduledAt]
- TeamMeeting @@index[projectId, scheduledAt]
- MeetingRecording @@index[meetingId, createdAt]
```

---

### Couche 5 : Services externes

```
┌─────────────────────────────────────────────────────┐
│            EXTERNAL SERVICES INTEGRATION             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Clerk - Authentication                             │
│  ├─ OAuth Integration                               │
│  ├─ JWT Session Management                          │
│  ├─ User Profile Management                         │
│  └─ Middleware @ proxy.ts                           │
│                                                     │
│  Resend - Email Service                             │
│  ├─ Task Assignment Notifications                   │
│  ├─ HTML + Text Templates                           │
│  ├─ Async Sending (try-catch, log error)            │
│  └─ Environment: RESEND_API_KEY, EMAIL_FROM         │
│                                                     │
│  Jitsi - Video Conferencing                         │
│  ├─ V1 Integration (URL Reference)                  │
│  ├─ Room Name Generation                            │
│  │  └─ Format: sunu-projets-[slug]-[shortId]-[hex]  │
│  ├─ Stored as external URL                          │
│  └─ MeetingProvider.JITSI enum                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Couche 6 : Validation et Sécurité

```
┌─────────────────────────────────────────────────────┐
│        VALIDATION & SECURITY LAYER                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Input Validation (lib/validations.ts)              │
│  ├─ createProjectSchema                             │
│  │  ├─ name: string (3-100 chars)                   │
│  │  ├─ description: string (0-1000 chars, optional) │
│  │  └─ email: valid email                           │
│  ├─ createTaskSchema                                │
│  │  ├─ name: string (2-100 chars)                   │
│  │  ├─ description: string (0-2000 chars)           │
│  │  ├─ dueDate: Date (optional)                     │
│  │  ├─ projectId: string                            │
│  │  └─ assignToEmail: valid email (optional)        │
│  ├─ joinProjectSchema                               │
│  │  ├─ email: valid email                           │
│  │  └─ inviteCode: 6-64 chars                       │
│  └─ [More schemas per use case]                     │
│                                                     │
│  Code Generation                                    │
│  ├─ inviteCode: randomBytes(6).toString('hex')      │
│  │  └─ Yields 12-char hex string                    │
│  └─ Unique constraint garantit unicité              │
│                                                     │
│  Route Protection (proxy.ts)                        │
│  ├─ Public: /sign-in, /sign-up                      │
│  ├─ Private: / + autres                             │
│  └─ Clerk middleware enforce                        │
│                                                     │
│  Error Handling (ActionError)                       │
│  ├─ Custom error class                              │
│  ├─ message: string                                 │
│  ├─ status: number (400, 403, 404, etc.)            │
│  └─ Thrown on authorization failure                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Patterns et pratiques

### Pattern 1 : Server Action avec Validation

```typescript
// Template standard pour une Server Action

"use server";

import { z } from "zod";
import { ActionError, getCurrentDbUser } from "@/lib/permissions";

// 1. Schéma de validation
const mySchema = z.object({
    name: z.string().min(1, "Requis"),
    email: z.string().email("Email invalide"),
    // ...
});

// 2. Server Action
export async function myAction(name: string, email: string) {
    try {
        // Étape 1: Valider l'entrée
        const parsed = mySchema.parse({ name, email });

        // Étape 2: Authentifier
        const user = await getCurrentDbUser();

        // Étape 3: Autoriser
        await assertHasProjectRole(projectId, ["OWNER", "MANAGER"]);

        // Étape 4: Exécuter
        const result = await prisma.myModel.create({
            data: {
                name: parsed.name,
                email: parsed.email,
                userId: user.id,
            },
        });

        // Étape 5: Auditer
        await createActivityLog({
            projectId,
            actorUserId: user.id,
            type: "ACTION_PERFORMED",
            message: `${user.name} a effectué une action`,
        });

        return result;
    } catch (error) {
        if (error instanceof ActionError) {
            throw error; // Déjà formaté
        }
        throw new ActionError("Erreur lors de l'action", 400);
    }
}
```

### Pattern 2 : Permission Check Layering

```typescript
// Ordre de vérification systématique

export async function restrictedAction(resourceId: string) {
    // Layer 1: User authentication
    const user = await getCurrentDbUser(); // Throws 401 if not auth
    
    // Layer 2: Resource access
    const membership = await assertProjectMember(resourceId); // Throws 403 if not member
    const { project } = membership;
    
    // Layer 3: Role-based permission
    if (!["OWNER", "MANAGER"].includes(membership.role)) {
        throw new ActionError("Permissions insuffisantes", 403);
    }
    
    // Layer 4: Resource ownership (if sensitive)
    if (resource.createdById !== user.id) {
        throw new ActionError("Vous ne pouvez modifier que vos ressources", 403);
    }
    
    // Layer 5: Logical business rule
    if (resource.status === "ARCHIVED") {
        throw new ActionError("Ressource archivée, impossible de modifier", 400);
    }
    
    // Execution
    return await doAction(resourceId, user.id);
}
```

### Pattern 3 : Email avec Gestion d'Erreur

```typescript
// Envoi d'email non-bloquant
export async function sendNotificationEmail(params) {
    try {
        // Validation Resend disponible
        if (!resend) {
            console.warn("Service email indisponible, revert.");
            return; // Don't throw, continue
        }

        // Préparation
        const emailContent = buildEmailHTML(params);

        // Envoi
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: params.recipient,
            subject: params.subject,
            html: emailContent.html,
            text: emailContent.text,
        });

        // Gestion réponse
        if (error) {
            console.error("Resend error:", error);
            // Log but don't re-throw (main action already executed)
        } else {
            console.log("Email sent:", data.id);
        }
    } catch (error) {
        // Graceful degradation
        console.error("Email send exception:", error);
    }
}
```

### Pattern 4 : State Management avec useEffect

```typescript
"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/app/actions";

export function MyComponent() {
    const [data, setData] = useState<Data[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await fetchData();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <Spinner />;
    if (error) return <ErrorState message={error} />;
    if (data.length === 0) return <EmptyState />;

    return <DataDisplay data={data} onRefresh={loadData} />;
}
```

---

## Exemples de code clés

### Exemple 1 : Création de Projet avec Roles

```typescript
// app/actions/projects.ts
export async function createProject(
    name: string,
    description: string,
    email: string
) {
    try {
        // 1. Validation Zod
        const parsed = createProjectSchema.parse({
            name,
            description,
            email,
        });

        // 2. Code unique
        const inviteCode = generateUniqueCode(); // randomBytes(6).toString("hex")

        // 3. Récupérer l'utilisateur
        const user = await prisma.user.findUnique({
            where: { email: parsed.email },
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé.");
        }

        // 4. Créer le projet
        const newProject = await prisma.project.create({
            data: {
                name: parsed.name,
                description: parsed.description || null,
                inviteCode,
                createdById: user.id,
            },
        });

        // 5. Ajouter le créateur comme OWNER
        await prisma.projectUser.create({
            data: {
                projectId: newProject.id,
                userId: user.id,
                role: "OWNER",
                scope: "INTERNAL",
            },
        });

        // 6. Enregistrer l'activité
        await createActivityLog({
            projectId: newProject.id,
            actorUserId: user.id,
            type: "PROJECT_CREATED",
            message: `${user.name} a créé le projet "${newProject.name}".`,
        });

        return newProject;
    } catch (error) {
        console.log(error);
        throw error instanceof Error 
            ? error 
            : new Error("Erreur lors de la création du projet");
    }
}
```

### Exemple 2 : Assignation de Tâche avec Email

```typescript
// app/actions/tasks.ts
export async function createTask(
    name: string,
    description: string,
    dueDate: Date | null,
    projectId: string,
    assignToEmail: string | null
) {
    // 1. Validation
    const parsed = createTaskSchema.parse({
        name,
        description,
        dueDate,
        projectId,
        assignToEmail,
    });

    // 2. Check access
    const { user } = await assertProjectMember(parsed.projectId);

    let assignedUserId: string | null = user.id;
    let assignedUserEmail: string | null = user.email;
    let assignedUserName: string | null = user.name;

    // 3. Si assigné à quelqu'un d'autre
    if (parsed.assignToEmail) {
        const assignedUser = await prisma.user.findUnique({
            where: { email: parsed.assignToEmail },
        });

        if (!assignedUser) {
            throw new ActionError("Utilisateur assigné introuvable.", 404);
        }

        // Vérifier qu'il est membre du projet
        const assignedUserHasAccess = await prisma.project.findFirst({
            where: {
                id: parsed.projectId,
                OR: [
                    { createdById: assignedUser.id },
                    { users: { some: { userId: assignedUser.id } } },
                ],
            },
            select: { id: true },
        });

        if (!assignedUserHasAccess) {
            throw new ActionError(
                "L'utilisateur assigné n'appartient pas à ce projet.",
                400
            );
        }

        assignedUserId = assignedUser.id;
        assignedUserEmail = assignedUser.email;
        assignedUserName = assignedUser.name;
    }

    // 4. Créer la tâche
    const newTask = await prisma.task.create({
        data: {
            name: parsed.name,
            description: parsed.description || "",
            dueDate: parsed.dueDate,
            projectId: parsed.projectId,
            createdById: user.id,
            userId: assignedUserId,
        },
    });

    // 5. Envoyer le mail (non-bloquant)
    try {
        if (
            assignedUserEmail &&
            assignedUserId &&
            assignedUserId !== user.id
        ) {
            const project = await prisma.project.findUnique({
                where: { id: parsed.projectId },
                select: { id: true, name: true },
            });

            if (project) {
                await sendTaskAssignmentEmail({
                    to: assignedUserEmail,
                    assigneeName: assignedUserName,
                    projectName: project.name,
                    projectId: project.id,
                    taskName: newTask.name,
                    dueDate: newTask.dueDate,
                });
            }
        }
    } catch (error) {
        console.error("Email error:", error);
        // Continue, l'email n'est pas critique
    }

    // 6. Enregistrer l'activité
    await createActivityLog({
        projectId: parsed.projectId,
        actorUserId: user.id,
        type: "TASK_CREATED",
        message:
            assignedUserName && assignedUserId !== user.id
                ? `${user.name} a créé la tâche "${newTask.name}" et l'a assignée à ${assignedUserName}.`
                : `${user.name} a créé la tâche "${newTask.name}".`,
    });

    return newTask;
}
```

### Exemple 3 : Vérification de Permissions Multi-niveaux

```typescript
// lib/permissions.ts
export async function getCurrentDbUser() {
    // Layer 1: Clerk authentication
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

    if (!email) {
        throw new ActionError(
            "Vous devez être connecté pour effectuer cette action.",
            401
        );
    }

    // Layer 2: Database lookup
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new ActionError("Utilisateur introuvable en base.", 401);
    }

    return user;
}

// project-roles.ts
export async function canManageProject(projectId: string) {
    const membership = await getProjectMembership(projectId);

    if (!["OWNER", "MANAGER"].includes(membership.role as ProjectRole)) {
        throw new ActionError(
            "Vous n'avez pas les droits suffisants pour cette action.",
            403
        );
    }

    return membership;
}

// Usage in actions
export async function sensitiveProjectAction(projectId: string) {
    // Cette vérification lance une exception si non autorisé
    await canManageProject(projectId);
    
    // Code ici n'est atteint que si autorisé
    return await doAction(projectId);
}
```

---

## Flux des données détaillé

### Flux 1 : Créer et Assigner une Tâche

```
FRONTEND (Client)
├─ User remplit formulaire
└─ Clique "Créer"
        ↓
NETWORK
├─ POST request + form data
└─ Headers: Auth token
        ↓
MIDDLEWARE (proxy.ts)
├─ Vérifie Clerk token
├─ Vérifie user authentifié
└─ Laisse passer
        ↓
SERVER ACTION (tasks.ts - createTask)
├─ 1. Reçoit params
├─ 2. Zod.parse() → Validation
├─ 3. assertProjectMember() → Permission check
│    ├─ getCurrentDbUser() → Récupère user de Clerk
│    └─ Cherche association user/project
├─ 4. Si assigné:
│    ├─ Cherche utilisateur par email
│    ├─ Vérifie qu'il est membre du projet
│    └─ Récupère ses infos
├─ 5. prisma.task.create() → INSERT INTO tasks
├─ 6. sendTaskAssignmentEmail() (async, non-bloquant)
│    ├─ Vérifie RESEND_API_KEY
│    ├─ Construit template HTML
│    └─ POST vers Resend API
├─ 7. createActivityLog() → INSERT INTO activityLog
└─ 8. return newTask
        ↓
NETWORK
├─ Response: { id, name, dueDate, ... }
└─ Status: 200
        ↓
FRONTEND
├─ Reçoit réponse
├─ Toast "Tâche créée"
├─ Ferme modal
└─ Rafraîchit liste tâches
```

### Flux 2 : Modifier le Statut d'une Tâche

```
FRONTEND
├─ User sélectionne "Done"
├─ Modal demande: "Description de solution"
└─ User entre + clique "Valider"
        ↓
SERVER ACTION (updateTaskStatus)
├─ 1. Valide: { taskId, newStatus, solutionDescription }
├─ 2. assertTaskAccess(taskId)
│    ├─ Cherche la task
│    ├─ Cherche membership du user
│    └─ Vérifie permissions
├─ 3. Vérifie si statut = "Done"
│    ├─ Oui?
│    │  ├─ Vérifie description fournie
│    │  ├─ Si vide → Erreur 400
│    │  └─ Si fournie → Continuer
│    └─ Non? → Continuer
├─ 4. prisma.task.update()
│    ├─ SET status = newStatus
│    ├─ SET solutionDescription (si Done)
│    └─ WHERE id = taskId
├─ 5. createActivityLog()
│    └─ "TASK_STATUS_UPDATED"
└─ 6. return updatedTask
        ↓
FRONTEND
├─ Toast succès
├─ Rafraîchit l'écran
└─ Tâche apparaît sous "Done"
```

---

## Performance et scalabilité

### Stratégies de performance

#### 1. Indexation des requêtes fréquentes

```sql
-- ActivityLog: Souvent requêtée par projectId + createdAt
@@index[projectId, createdAt]

-- TeamMeeting: Souvent requêtée par équipe + date
@@index[teamId, scheduledAt]
@@index[projectId, scheduledAt]

-- MeetingRecording: Souvent requêtée par meetingId + date
@@index[meetingId, createdAt]
```

#### 2. Lazy Loading des relations

```typescript
// Au lieu de charger toutes les relations d'un coup
const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
        tasks: true,           // ❌ Potentiellement heavy
        users: true,           // ❌ Potentiellement heavy
        meetings: true,        // ❌ Potentiellement heavy
        activityLogs: true,    // ❌ Potentiellement heavy
    },
});

// Préférer: sélectionner ce qui est nécessaire
const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
        id: true,
        name: true,
        _count: {                // Métadonnées sans charger
            select: {
                tasks: true,
                users: true,
            },
        },
    },
});

// Et charger les relations séparément si nécessaire
const tasks = await prisma.task.findMany({
    where: { projectId },
    take: 10,                    // Pagination
});
```

#### 3. Pagination sur les listes longues

```typescript
// ActivityLog: Limité à 20 derniers
const logs = await prisma.activityLog.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 20,  // Important pour limiter BW et CPU
});
```

#### 4. Caching potentiel (avec revalidatePath)

```typescript
import { revalidatePath } from "next/cache";

export async function updateTeam(teamId: string, data: any) {
    const team = await prisma.team.update({
        where: { id: teamId },
        data,
    });

    // Invalide les pages mises en cache
    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/teams");

    return team;
}
```

### Limites de scalabilité actuelles

| Aspect | Limite actuelle | Comment escalader |
|--------|-----------------|-------------------|
| **Utilisateurs** | ∞ (MySQL peut gérer millions) | Sharding si >10M users |
| **Projets/Équipes** | ∞ | Pas de limite réelle |
| **Tâches par projet** | ∞ | Pagination systématique |
| **Historique activité** | Logs prennent espace | Archive historique après 1 an |
| **Réunions/Enregistrements** | ∞ | Les URLs ne prennent pas d'espace |
| **Emails simultanés** | Limité par Resend rate | Queue + async processing |
| **Connexions DB** | Pool par défaut Prisma | Configurable dans DATABASE_URL |

### Recommandations d'optimisation futures

1. **Implémentation d'une Queue d'emails** (Bull/RabbitMQ)
2. **Redis pour le caching** des données chaudes
3. **Archivage de l'historique** des activités
4. **CDN pour les fichiers** de réunions
5. **Rate limiting** sur les APIs
6. **Monitoring et alertes** (Sentry, New Relic)
7. **Read replicas** pour MySQL en haute charge

---

## Conclusion

L'architecture de **Sunu Projets** est:

✅ **Sécurisée** : Vérifications multi-niveaux des permissions  
✅ **Maintenable** : Séparation claire des responsabilités  
✅ **Scalable** : Base de données normalisée avec indexation  
✅ **Performante** : Server Actions et requêtes optimisées  
✅ **Extensible** : Patterns clairs pour nouvelles features  
✅ **User-friendly** : UI responsive et notifications en temps réel  

L'application est prête pour une utilisation en production dans des équipes de taille petite à moyenne (< 1000 utilisateurs). Pour des déploiements plus larges, les optimisations mentionnées ci-dessus seraient recommandées.
