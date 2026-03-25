"use server";

import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";

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
