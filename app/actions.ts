"use server"

import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import {
    assertHasProjectRole,
    canAdminProject,
    getProjectMembership,
} from "@/lib/project-roles";
import {
    ActionError,
    assertProjectMember,
    assertProjectOwner,
    assertTaskAccess,
    getCurrentDbUser,
} from "@/lib/permissions";
import {
    createProjectSchema,
    joinProjectSchema,
    createTaskSchema,
    updateTaskStatusSchema,
} from "@/lib/validations";
import { TASK_STATUSES, TASK_STATUS_VALUES } from "@/lib/task-status";
import { sendTaskAssignmentEmail } from "@/lib/email";
import { ActivityType } from "@prisma/client";

const ALLOWED_TASK_STATUSES = TASK_STATUS_VALUES;

async function createActivityLog(params: {
    projectId: string;
    actorUserId: string;
    type: ActivityType;
    message: string;
}) {
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

export async function checkAndAddUser(email: string, name: string) {
    if (!email) return;

    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (!existingUser) {
            await prisma.user.create({
                data: {
                    email,
                    name: name || email,
                },
            });

            console.log("Utilisateur ajouté à la base de données.");
        } else {
            console.log("Utilisateur déjà présent dans la base de données.");
        }

        if (name && existingUser?.name !== name) {
            await prisma.user.update({
                where: {
                    email: email,
                },
                data: {
                    name: name,
                },
            });
            console.log("Nom de l'utilisateur mis à jour.");
        }

    } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur :", error);
    }
}

function generateUniqueCode(): string {
    return randomBytes(6).toString('hex')
}

export async function createProject(name: string, description: string, email: string) {
    try {
        const parsed = createProjectSchema.parse({
            name,
            description,
            email,
        });

        const inviteCode = generateUniqueCode();

        const user = await prisma.user.findUnique({
            where: {
                email: parsed.email,
            },
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé.");
        }

        const newProject = await prisma.project.create({
            data: {
                name: parsed.name,
                description: parsed.description || null,
                inviteCode,
                createdById: user.id,
            },
        });

        await prisma.projectUser.create({
            data: {
                projectId: newProject.id,
                userId: user.id,
                role: "OWNER",
            },
        });

        await createActivityLog({
            projectId: newProject.id,
            actorUserId: user.id,
            type: "PROJECT_CREATED",
            message: `${user.name} a créé le projet "${newProject.name}".`,
        });

        return newProject;
    } catch (error) {
        console.log(error);
        throw error instanceof Error ? error : new Error("Erreur lors de la création du projet");
    }
}

export async function getProjectsCreatedByUSer(email: string) {
    try {

        const projects = await prisma.project.findMany({
            where: {
                createdBy: { email }
            },
            include: {
                tasks: {
                    include: {
                        user: true,
                        createdBy: true
                    }
                },
                users: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        const formattedProjects = projects.map((project) => ({
            ...project,
            users: project.users.map((userEntry: any) => userEntry.user)
        }))

        return formattedProjects

    } catch (error) {
        console.error(error)
        throw new Error
    }

}

export async function deleteProjectById(projectId: string) {
    try {
        await canAdminProject(projectId);

        await prisma.project.delete({
            where: {
                id: projectId,
            },
        });

        return { success: true, message: "Projet supprimé avec succès." };
    } catch (error) {
        console.log(error);
        throw error instanceof Error ? error : new Error("Erreur lors de la suppression du projet");
    }
}

export async function addUserToProject(email: string, inviteCode: string) {
    try {
        const parsed = joinProjectSchema.parse({
            email,
            inviteCode,
        });

        const project = await prisma.project.findUnique({
            where: {
                inviteCode: parsed.inviteCode,
            },
        });

        if (!project) {
            throw new Error("Code d'invitation invalide");
        }

        const user = await prisma.user.findUnique({
            where: {
                email: parsed.email,
            },
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        const existingAssociation = await prisma.projectUser.findUnique({
            where: {
                userId_projectId: {
                    projectId: project.id,
                    userId: user.id,
                },
            },
        });

        if (existingAssociation) {
            throw new Error("L'utilisateur est déjà membre de ce projet");
        }

        await prisma.projectUser.create({
            data: {
                projectId: project.id,
                userId: user.id,
                role: "MEMBER",
            },
        });

        await createActivityLog({
            projectId: project.id,
            actorUserId: user.id,
            type: "MEMBER_JOINED",
            message: `${user.name} a rejoint le projet.`,
        });

        return "Utilisateur ajouté au projet avec succès";
    } catch (error) {
        console.error(error);
        throw error instanceof Error ? error : new Error("Erreur lors de l'ajout au projet");
    }
}

export async function getProjectsAssociatedWithUser(email: string) {
    try {
        const projects = await prisma.project.findMany({
            where: {
                users: {
                    some: {
                        user: {
                            email
                        }
                    }
                }
            },
            include: {
                tasks: true,
                users: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        const formattedProjects = projects.map((project) => ({
            ...project,
            users: project.users.map((userEntry: any) => userEntry.user)
        }))

        return formattedProjects

    } catch (error) {
        console.error(error)
        throw new Error
    }

}

export async function getProjectInfo(idProject: string, details: boolean) {
    await assertProjectMember(idProject);

    const project = await prisma.project.findUnique({
        where: { id: idProject },
        include: details
            ? {
                tasks: {
                    include: {
                        user: true,
                        createdBy: true,
                    },
                },
                users: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                createdBy: true,
            }
            : {
                createdBy: true,
            },
    });

    if (!project) {
        throw new ActionError("Projet non trouvé.", 404);
    }

    return project;
}

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

export async function updateProjectMemberRole(
    projectId: string,
    memberUserId: string,
    newRole: "MANAGER" | "MEMBER"
) {
    const currentUser = await getCurrentDbUser();
    await canAdminProject(projectId);

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
    await canAdminProject(projectId);

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

        await assertHasProjectRole(task.projectId, ["OWNER", "MANAGER"]);

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