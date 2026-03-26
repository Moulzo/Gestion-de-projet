import { Project as PrismaProject, Task as PrismaTask, Team as PrismaTeam, User } from "@prisma/client";

export type ProjectRole = "OWNER" | "MANAGER" | "MEMBER";
export type TeamRole = "OWNER" | "MANAGER" | "MEMBER";
export type ProjectCollaboratorScope = "INTERNAL" | "EXTERNAL";

export type ProjectUserMember = {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectRole;
    scope?: ProjectCollaboratorScope;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
};

export type TeamMember = {
    id: string;
    teamId: string;
    userId: string;
    role: TeamRole;
    joinedAt: Date | string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
};

export type Team = PrismaTeam & {
    createdBy?: User;
    members?: TeamMember[];
    projects?: Project[];
};

export type Project = PrismaProject & {
    totalTasks?: number;
    collaboratorsCount?: number;

    taskStats?: {
        toDo: number;
        inProgress: number;
        done: number;
    };

    percentages?: {
        progressPercentage: number;
        inProgressPercentage: number;
        toDoPercentage: number;
    };

    tasks?: Task[];
    users?: User[];
    createdBy?: User;
    team?: {
        id: string;
        name: string;
        description?: string | null;
        createdAt?: Date;
        updatedAt?: Date;
        inviteCode?: string;
        createdById?: string;
    } | null;
};

export type Task = PrismaTask & {
    user?: User | null;
    createdBy?: User | null;
};