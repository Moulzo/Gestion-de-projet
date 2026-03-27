"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { assertProjectMember, assertTaskAccess, ActionError } from "@/lib/permissions";
import { sendTaskAssignmentEmail } from "@/lib/email";
import { TASK_STATUSES } from "@/lib/task-status";
import { createActivityLog } from "./activity";

const createTaskSchema = z.object({
    name: z.string().min(1, "Le nom de la tâche est requis"),
    description: z.string().optional(),
    dueDate: z.date().optional(),
    projectId: z.string().min(1, "L'ID du projet est requis"),
    assignToEmail: z.string().email("Email invalide").optional(),
});

const updateTaskStatusSchema = z.object({
    taskId: z.string().min(1, "L'ID de la tâche est requis"),
    newStatus: z.string().min(1, "Le nouveau statut est requis"),
    solutionDescription: z.string().optional(),
});

export async function createTask(
    name: string,
    description: string,
    dueDate: Date | null,
    projectId: string,
    assignToEmail: string | null
) {
    const parsed = createTaskSchema.parse({
        name,
        description,
        dueDate,
        projectId,
        assignToEmail,
    });

    const { user } = await assertProjectMember(parsed.projectId);

    let assignedUserId: string | null = user.id;
    let assignedUserEmail: string | null = user.email;
    let assignedUserName: string | null = user.name;

    if (parsed.assignToEmail) {
        const assignedUser = await prisma.user.findUnique({
            where: { email: parsed.assignToEmail },
        });

        if (!assignedUser) {
            throw new ActionError("Utilisateur assigné introuvable.", 404);
        }

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
            throw new ActionError("L'utilisateur assigné n'appartient pas à ce projet.", 400);
        }

        assignedUserId = assignedUser.id;
        assignedUserEmail = assignedUser.email;
        assignedUserName = assignedUser.name;
    }

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

    try {
        if (
            assignedUserEmail &&
            assignedUserId &&
            assignedUserId !== user.id
        ) {
            const project = await prisma.project.findUnique({
                where: { id: parsed.projectId },
                select: {
                    id: true,
                    name: true,
                },
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
        console.error("Erreur lors de l'envoi de l'email d'assignation :", error);
    }

    await createActivityLog({
        projectId: parsed.projectId,
        actorUserId: user.id,
        type: "TASK_CREATED",
        message: assignedUserName && assignedUserId !== user.id
            ? `${user.name} a créé la tâche "${newTask.name}" et l'a assignée à ${assignedUserName}.` 
            : `${user.name} a créé la tâche "${newTask.name}".`,
    });

    return newTask;
}

export async function deleteTaskById(taskId: string) {
    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: true,
            },
        });

        if (!task) {
            throw new ActionError("Tâche introuvable.", 404);
        }

        await assertTaskAccess(taskId);

        await prisma.task.delete({
            where: {
                id: taskId,
            },
        });

        return { success: true, message: "Tâche supprimée avec succès." };
    } catch (error) {
        console.log(error);
        throw error instanceof Error ? error : new Error("Erreur lors de la suppression de la tâche");
    }
}

export const getTaskDetails = async (taskId: string) => {
    await assertTaskAccess(taskId);

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            project: true,
            user: true,
            createdBy: true,
        },
    });

    if (!task) {
        throw new ActionError("Tâche non trouvée.", 404);
    }

    return task;
};

export const updateTaskStatus = async (
    taskId: string,
    newStatus: string,
    solutionDescription?: string
) => {
    const parsed = updateTaskStatusSchema.parse({
        taskId,
        newStatus,
        solutionDescription,
    });

    const { user, task } = await assertTaskAccess(parsed.taskId);

    const canUpdate =
        task.userId === user.id ||
        task.createdById === user.id ||
        task.project.createdById === user.id;

    if (!canUpdate) {
        throw new ActionError("Vous n'êtes pas autorisé à modifier cette tâche.", 403);
    }

    if (parsed.newStatus === TASK_STATUSES.DONE && !parsed.solutionDescription?.trim()) {
        throw new ActionError(
            "Une description de solution est requise pour terminer la tâche.",
            400
        );
    }

    await prisma.task.update({
        where: { id: parsed.taskId },
        data: {
            status: parsed.newStatus,
            solutionDescription:
                parsed.newStatus === TASK_STATUSES.DONE ? parsed.solutionDescription : null,
        },
    });

    await createActivityLog({
        projectId: task.projectId,
        actorUserId: user.id,
        type: "TASK_STATUS_UPDATED",
        message: `${user.name} a changé le statut de la tâche "${task.name}" en "${parsed.newStatus}".`,
    });

    return { success: true, message: "Statut mis à jour avec succès." };
};
