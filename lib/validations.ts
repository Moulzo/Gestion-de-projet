import { z } from "zod";

export const createProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Le nom du projet doit contenir au moins 3 caractères.")
        .max(100, "Le nom du projet est trop long."),
    description: z
        .string()
        .trim()
        .max(1000, "La description du projet est trop longue.")
        .optional()
        .or(z.literal("")),
    email: z
        .string()
        .trim()
        .email("Adresse email invalide."),
});

export const joinProjectSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Adresse email invalide."),
    inviteCode: z
        .string()
        .trim()
        .min(6, "Code d'invitation invalide.")
        .max(64, "Code d'invitation invalide."),
});

export const createTaskSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Le nom de la tâche doit contenir au moins 2 caractères.")
        .max(100, "Le nom de la tâche est trop long."),
    description: z
        .string()
        .trim()
        .max(2000, "La description de la tâche est trop longue.")
        .optional()
        .or(z.literal("")),
    dueDate: z.date().nullable(),
    projectId: z
        .string()
        .trim()
        .min(1, "Projet invalide."),
    assignToEmail: z
        .string()
        .trim()
        .email("Email d'assignation invalide.")
        .nullable()
        .optional(),
});

export const updateTaskStatusSchema = z.object({
    taskId: z
        .string()
        .trim()
        .min(1, "Tâche invalide."),
    newStatus: z
        .enum(["To Do", "In Progress", "Done"])
        .default("To Do")
        .refine((val) => ["To Do", "In Progress", "Done"].includes(val), {
            message: "Statut de tâche invalide.",
        }),
    solutionDescription: z
        .string()
        .trim()
        .max(2000, "La description de solution est trop longue.")
        .optional(),
});