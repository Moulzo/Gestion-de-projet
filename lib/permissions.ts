// lib/permissions.ts
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export class ActionError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "ActionError";
        this.status = status;
    }
}

export async function getCurrentDbUser() {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

    if (!email) {
        throw new ActionError("Vous devez être connecté pour effectuer cette action.", 401);
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new ActionError("Utilisateur introuvable en base.", 401);
    }

    return user;
}

export async function assertProjectMember(projectId: string) {
    const user = await getCurrentDbUser();

    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            OR: [
                { createdById: user.id },
                { users: { some: { userId: user.id } } },
            ],
        },
        select: {
            id: true,
            createdById: true,
        },
    });

    if (!project) {
        throw new ActionError("Accès refusé à ce projet.", 403);
    }

    return { user, project };
}

export async function assertProjectOwner(projectId: string) {
    const { user, project } = await assertProjectMember(projectId);

    if (project.createdById !== user.id) {
        throw new ActionError("Seul le créateur du projet peut effectuer cette action.", 403);
    }

    return { user, project };
}

export async function assertTaskAccess(taskId: string) {
    const user = await getCurrentDbUser();

    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            project: {
                is: {
                    OR: [
                        { createdById: user.id },
                        { users: { some: { userId: user.id } } },
                    ],
                },
            },
        },
        include: {
            project: true,
        },
    });

    if (!task) {
        throw new ActionError("Tâche introuvable ou accès refusé.", 404);
    }

    return { user, task };
}