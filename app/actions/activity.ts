"use server";

import prisma from "@/lib/prisma";
import { assertHasProjectRole } from "@/lib/project-roles";

interface CreateActivityLogParams {
    projectId: string;
    actorUserId: string;
    type: "PROJECT_CREATED" | "MEMBER_JOINED" | "MEMBER_ROLE_UPDATED" | "MEMBER_REMOVED" | "TASK_CREATED" | "TASK_STATUS_UPDATED";
    message: string;
}

export async function createActivityLog(params: CreateActivityLogParams) {
    try {
        await prisma.activityLog.create({
            data: {
                projectId: params.projectId,
                actorUserId: params.actorUserId,
                type: params.type,
                message: params.message,
            },
        });
    } catch (error) {
        console.error("Erreur lors de la création du log d'activité :", error);
    }
}

export async function getProjectActivityLogs(projectId: string) {
    await assertHasProjectRole(projectId, ["OWNER", "MANAGER", "MEMBER"]);

    const logs = await prisma.activityLog.findMany({
        where: {
            projectId,
        },
        include: {
            actor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 20,
    });

    return logs;
}
