"use server"

import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function checkAndAddUser(email: string, name: string) {
    if (!email) return
    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        })
        if (!existingUser && name) {
            await prisma.user.create({
                data: {
                    email,
                    name
                }
            })
            console.error("Erreur lors de la  vérification de l'utilisateur:");
        } else {
            console.error("Utilisateur déjà présent dans la base de données.");
        }
    } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur:", error);
    }


}

function generateUniqueCode(): string {
    return randomBytes(6).toString('hex')
}

export async function createProject(name: string, description: string, email: string) {
    try {

        const inviteCode = generateUniqueCode()
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        })
        if (!user) {
            throw new Error('User not found');
        }

        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                inviteCode,
                createdById: user.id
            }
        })

        return newProject;

    } catch (error) {
        console.log(error)
        throw new Error
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

        await prisma.project.delete({
            where: {
                id: projectId
            }
        })
        console.log(`Projet avec l'ID ${projectId} supprimé avec succès.`)
    } catch (error) {
        console.error(error)
        throw new Error
    }
}

export async function addUserToProject(email: string, inviteCode: string) {

    try {
        const project = await prisma.project.findUnique({
            where: {
                inviteCode
            }
        })

        if (!project) {
            throw new Error("Code d'invitation invalide")
        }

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (!user) {
            throw new Error("Utilisateur non trouvé")
        }

        const existingAssociation = await prisma.projectUser.findUnique({
            where: {
                userId_projectId: {
                    projectId: project.id,
                    userId: user.id
                }
            }
        })

        if (existingAssociation) {
            throw new Error("L'utilisateur est déjà membre de ce projet")
        }

        await prisma.projectUser.create({
            data: {
                projectId: project.id,
                userId: user.id
            }
        })

        return 'Utilisateur ajouté au projet avec succès';

    } catch (error) {
        console.error(error)
        throw new Error
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