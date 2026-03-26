"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { assertProjectMember, ActionError } from "@/lib/permissions";
import { canAdminProject } from "@/lib/project-roles";
import { createActivityLog } from "./activity";

const createProjectSchema = z.object({
    name: z.string().min(1, "Le nom du projet est requis"),
    description: z.string().optional(),
    email: z.string().email("Email invalide"),
});

const joinProjectSchema = z.object({
    email: z.string().email("Email invalide"),
    inviteCode: z.string().min(1, "Le code d'invitation est requis"),
});

function generateUniqueCode(): string {
    return randomBytes(6).toString("hex");
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
                scope: "INTERNAL",
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
                createdBy: { email },
            },
            include: {
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
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return projects.map((project) => ({
            ...project,
            users: project.users.map((userEntry) => userEntry.user),
        }));
    } catch (error) {
        console.error(error);
        throw new Error("Erreur lors de la récupération des projets créés.");
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
                scope: "INTERNAL",
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
                            email,
                        },
                    },
                },
            },
            include: {
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
                team: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return projects.map((project) => ({
            ...project,
            users: project.users.map((userEntry) => userEntry.user),
        }));
    } catch (error) {
        console.error(error);
        throw new Error("Erreur lors de la récupération des projets associés.");
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
                  team: {
                      select: {
                          id: true,
                          name: true,
                          description: true,
                          inviteCode: true,
                          createdAt: true,
                          updatedAt: true,
                          createdById: true,
                      },
                  },
              }
            : {
                  createdBy: true,
                  team: {
                      select: {
                          id: true,
                          name: true,
                      },
                  },
              },
    });

    if (!project) {
        throw new ActionError("Projet non trouvé.", 404);
    }

    return {
        ...project,
        users:
            "users" in project && Array.isArray(project.users)
                ? project.users.map((entry) => entry.user)
                : undefined,
    };
}