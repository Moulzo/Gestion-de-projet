"use server";

import prisma from "@/lib/prisma";
import { ActionError, getCurrentDbUser } from "@/lib/permissions";
import { assertHasProjectRole, canAdminProject } from "@/lib/project-roles";
import { createActivityLog } from "./activity";
import { revalidatePath } from "next/cache";

export async function getProjectUsers(idProject: string) {
    try {
        await assertHasProjectRole(idProject, ["OWNER", "MANAGER", "MEMBER"]);

        const projectWithUsers = await prisma.project.findUnique({
            where: { id: idProject },
            include: {
                users: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return projectWithUsers?.users.map((projectUser) => projectUser.user) || [];
    } catch (error) {
        console.log(error);
        throw error instanceof Error ? error : new Error("Erreur lors de la récupération des utilisateurs du projet");
    }
}

export async function getProjectMembersWithRoles(projectId: string) {
    await assertHasProjectRole(projectId, ["OWNER", "MANAGER", "MEMBER"]);

    const members = await prisma.projectUser.findMany({
        where: {
            projectId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: [{ role: "asc" }, { userId: "asc" }],
    });

    return members.map((membership) => ({
        id: membership.id,
        projectId: membership.projectId,
        userId: membership.userId,
        role: membership.role,
        user: membership.user,
    }));
}

export async function updateProjectMemberRole(
    projectId: string,
    memberUserId: string,
    newRole: "MANAGER" | "MEMBER"
) {
    const currentUser = await getCurrentDbUser();
    await assertHasProjectRole(projectId, ["OWNER"]);

    if (!memberUserId) {
        throw new ActionError("Collaborateur invalide.", 400);
    }

    if (!["MANAGER", "MEMBER"].includes(newRole)) {
        throw new ActionError("Rôle invalide.", 400);
    }

    const membership = await prisma.projectUser.findUnique({
        where: {
            userId_projectId: {
                userId: memberUserId,
                projectId,
            },
        },
        include: {
            user: true,
        },
    });

    if (!membership) {
        throw new ActionError("Collaborateur introuvable dans ce projet.", 404);
    }

    if (membership.role === "OWNER") {
        throw new ActionError("Le rôle OWNER ne peut pas être modifié ici.", 400);
    }

    const previousRole = membership.role;

    await prisma.projectUser.update({
        where: {
            userId_projectId: {
                userId: memberUserId,
                projectId,
            },
        },
        data: {
            role: newRole,
        },
    });

    await createActivityLog({
        projectId,
        actorUserId: currentUser.id,
        type: "MEMBER_ROLE_UPDATED",
        message: `${currentUser.name} a modifié le rôle de ${membership.user.name} : ${previousRole} → ${newRole}.`,
    });

    revalidatePath(`/project/${projectId}`);

    return { success: true, message: "Rôle mis à jour avec succès." };
}

export async function removeProjectMember(projectId: string, memberUserId: string) {
    const currentUser = await getCurrentDbUser();
    await assertHasProjectRole(projectId, ["OWNER"]);

    if (!memberUserId) {
        throw new ActionError("Collaborateur invalide.", 400);
    }

    const membership = await prisma.projectUser.findUnique({
        where: {
            userId_projectId: {
                userId: memberUserId,
                projectId,
            },
        },
        include: {
            user: true,
        },
    });

    if (!membership) {
        throw new ActionError("Collaborateur introuvable dans ce projet.", 404);
    }

    if (membership.role === "OWNER") {
        throw new ActionError("Le propriétaire du projet ne peut pas être retiré.", 400);
    }

    await prisma.projectUser.delete({
        where: {
            userId_projectId: {
                userId: memberUserId,
                projectId,
            },
        },
    });

    await createActivityLog({
        projectId,
        actorUserId: currentUser.id,
        type: "MEMBER_REMOVED",
        message: `${currentUser.name} a retiré ${membership.user.name} du projet.`,
    });

    revalidatePath(`/project/${projectId}`);

    return { success: true, message: "Collaborateur retiré du projet avec succès." };
}
