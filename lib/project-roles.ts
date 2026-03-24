import prisma from "@/lib/prisma";
import { ActionError, getCurrentDbUser } from "@/lib/permissions";

export const PROJECT_ROLES = {
    OWNER: "OWNER",
    MANAGER: "MANAGER",
    MEMBER: "MEMBER",
} as const;

export type ProjectRole = typeof PROJECT_ROLES[keyof typeof PROJECT_ROLES];

export async function getProjectMembership(projectId: string) {
    const user = await getCurrentDbUser();

    const membership = await prisma.projectUser.findUnique({
        where: {
            userId_projectId: {
                userId: user.id,
                projectId,
            },
        },
        include: {
            project: true,
            user: true,
        },
    });

    if (!membership) {
        throw new ActionError("Accès refusé à ce projet.", 403);
    }

    return membership;
}

export async function assertHasProjectRole(
    projectId: string,
    allowedRoles: ProjectRole[]
) {
    const membership = await getProjectMembership(projectId);

    if (!allowedRoles.includes(membership.role as ProjectRole)) {
        throw new ActionError("Vous n'avez pas les droits suffisants pour cette action.", 403);
    }

    return membership;
}

export async function canManageProject(projectId: string) {
    return assertHasProjectRole(projectId, ["OWNER", "MANAGER"]);
}

export async function canAdminProject(projectId: string) {
    return assertHasProjectRole(projectId, ["OWNER"]);
}