"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ActionError, getCurrentDbUser } from "@/lib/permissions";
import { assertHasTeamRole } from "@/lib/team-roles";
import { revalidatePath } from "next/cache";

const createMeetingSchema = z.object({
    title: z
        .string()
        .trim()
        .min(2, "Le titre doit contenir au moins 2 caractères.")
        .max(120, "Le titre est trop long."),
    description: z
        .string()
        .trim()
        .max(2000, "La description est trop longue.")
        .optional()
        .or(z.literal("")),
    notes: z
        .string()
        .trim()
        .max(10000, "Le compte-rendu est trop long.")
        .optional()
        .or(z.literal("")),
    scheduledAt: z.coerce.date(),
    durationMinutes: z
        .number()
        .int()
        .positive("La durée doit être positive.")
        .max(1440, "La durée est invalide.")
        .nullable()
        .optional(),
    teamId: z.string().trim().min(1, "Équipe invalide."),
    projectId: z.string().trim().nullable().optional(),
    externalUrl: z
        .string()
        .trim()
        .url("Lien externe invalide.")
        .nullable()
        .optional()
        .or(z.literal("")),
});

const updateMeetingNotesSchema = z.object({
    meetingId: z.string().trim().min(1, "Réunion invalide."),
    notes: z
        .string()
        .trim()
        .max(10000, "Le compte-rendu est trop long."),
});

const updateMeetingStatusSchema = z.object({
    meetingId: z.string().trim().min(1, "Réunion invalide."),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
});

const addMeetingRecordingSchema = z.object({
    meetingId: z.string().trim().min(1, "Réunion invalide."),
    title: z
        .string()
        .trim()
        .min(2, "Le titre doit contenir au moins 2 caractères.")
        .max(120, "Le titre est trop long."),
    url: z
        .string()
        .trim()
        .url("Lien d'enregistrement invalide."),
    description: z
        .string()
        .trim()
        .max(2000, "La description est trop longue.")
        .optional()
        .or(z.literal("")),
});

function normalizeOptionalString(value?: string | null) {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function slugify(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
}

function buildJitsiRoomName(meetingTitle: string, meetingId: string) {
    const base = slugify(meetingTitle) || "meeting";
    const suffix = randomBytes(3).toString("hex");
    const shortId = meetingId.replace(/-/g, "").slice(0, 8);
    return `sunu-projets-${base}-${shortId}-${suffix}`;
}

async function getMeetingForVideoManagement(meetingId: string) {
    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: meetingId },
        select: {
            id: true,
            title: true,
            teamId: true,
            externalUrl: true,
            provider: true,
            status: true,
        },
    });

    if (!meeting) {
        throw new ActionError("Réunion introuvable.", 404);
    }

    await assertHasTeamRole(meeting.teamId, ["OWNER", "MANAGER"]);

    return meeting;
}

async function getMeetingForRecordingManagement(meetingId: string) {
    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: meetingId },
        select: {
            id: true,
            teamId: true,
        },
    });

    if (!meeting) {
        throw new ActionError("Réunion introuvable.", 404);
    }

    await assertHasTeamRole(meeting.teamId, ["OWNER", "MANAGER"]);

    return meeting;
}

function revalidateMeetingPaths(meetingId: string, teamId: string) {
    revalidatePath("/meetings");
    revalidatePath(`/meetings/${meetingId}`);
    revalidatePath(`/teams/${teamId}`);
}

export async function createMeeting(input: {
    title: string;
    description?: string;
    notes?: string;
    scheduledAt: Date | string;
    durationMinutes?: number | null;
    teamId: string;
    projectId?: string | null;
    externalUrl?: string | null;
}) {
    const parsed = createMeetingSchema.parse({
        ...input,
        durationMinutes: input.durationMinutes ?? null,
        projectId: input.projectId ?? null,
        externalUrl: input.externalUrl ?? null,
    });

    const user = await getCurrentDbUser();
    await assertHasTeamRole(parsed.teamId, ["OWNER", "MANAGER"]);

    if (parsed.projectId) {
        const project = await prisma.project.findUnique({
            where: { id: parsed.projectId },
            select: { id: true, teamId: true },
        });

        if (!project) {
            throw new ActionError("Projet introuvable.", 404);
        }

        if (project.teamId !== parsed.teamId) {
            throw new ActionError(
                "Le projet sélectionné n'appartient pas à cette équipe.",
                400
            );
        }
    }

    const meeting = await prisma.teamMeeting.create({
        data: {
            title: parsed.title,
            description: normalizeOptionalString(parsed.description),
            notes: normalizeOptionalString(parsed.notes),
            scheduledAt: parsed.scheduledAt,
            durationMinutes: parsed.durationMinutes ?? null,
            teamId: parsed.teamId,
            projectId: normalizeOptionalString(parsed.projectId),
            externalUrl: normalizeOptionalString(parsed.externalUrl),
            createdById: user.id,
        },
        include: {
            team: true,
            project: true,
            createdBy: true,
        },
    });

    revalidatePath("/meetings");
    revalidatePath(`/teams/${parsed.teamId}`);

    return meeting;
}

export async function getMeetingsForCurrentUser() {
    const user = await getCurrentDbUser();

    const teamMemberships = await prisma.teamMember.findMany({
        where: { userId: user.id },
        select: { teamId: true },
    });

    const accessibleTeamIds = teamMemberships.map((membership) => membership.teamId);

    const meetings = await prisma.teamMeeting.findMany({
        where: {
            teamId: {
                in: accessibleTeamIds,
            },
        },
        include: {
            team: {
                select: {
                    id: true,
                    name: true,
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            // recordings: {
            //     select: {
            //         id: true,
            //     },
            // },
        },
        orderBy: {
            scheduledAt: "desc",
        },
    });

    return meetings;
}

export async function getTeamProjectsForMeeting(teamId: string) {
    await assertHasTeamRole(teamId, ["OWNER", "MANAGER", "MEMBER"]);

    const projects = await prisma.project.findMany({
        where: {
            teamId,
        },
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    return projects;
}

export async function getMeetingDetails(meetingId: string) {
    const user = await getCurrentDbUser();

    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: meetingId },
        include: {
            team: {
                include: {
                    members: {
                        where: {
                            userId: user.id,
                        },
                    },
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!meeting) {
        throw new ActionError("Réunion introuvable.", 404);
    }

    if (meeting.team.members.length === 0) {
        throw new ActionError("Accès refusé à cette réunion.", 403);
    }

    return {
        ...meeting,
        team: {
            id: meeting.team.id,
            name: meeting.team.name,
        },
        currentUserTeamRole: meeting.team.members[0]?.role ?? null,
    };
}

export async function updateMeetingNotes(meetingId: string, notes: string) {
    const parsed = updateMeetingNotesSchema.parse({ meetingId, notes });

    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: parsed.meetingId },
        select: {
            id: true,
            teamId: true,
        },
    });

    if (!meeting) {
        throw new ActionError("Réunion introuvable.", 404);
    }

    await assertHasTeamRole(meeting.teamId, ["OWNER", "MANAGER"]);

    const updatedMeeting = await prisma.teamMeeting.update({
        where: { id: parsed.meetingId },
        data: {
            notes: parsed.notes,
        },
        include: {
            team: true,
            project: true,
            createdBy: true,
        },
    });

    revalidateMeetingPaths(parsed.meetingId, meeting.teamId);

    return updatedMeeting;
}

export async function updateMeetingStatus(
    meetingId: string,
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED"
) {
    const parsed = updateMeetingStatusSchema.parse({ meetingId, status });

    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: parsed.meetingId },
        select: {
            id: true,
            teamId: true,
        },
    });

    if (!meeting) {
        throw new ActionError("Réunion introuvable.", 404);
    }

    await assertHasTeamRole(meeting.teamId, ["OWNER", "MANAGER"]);

    const updatedMeeting = await prisma.teamMeeting.update({
        where: { id: parsed.meetingId },
        data: {
            status: parsed.status,
        },
        include: {
            team: true,
            project: true,
            createdBy: true,
        },
    });

    revalidateMeetingPaths(parsed.meetingId, meeting.teamId);

    return updatedMeeting;
}

export async function generateJitsiMeetingLink(meetingId: string) {
    const meeting = await getMeetingForVideoManagement(meetingId);

    if (meeting.status === "CANCELLED") {
        throw new ActionError(
            "Impossible de générer un lien Jitsi pour une réunion annulée.",
            400
        );
    }

    if (meeting.externalUrl && meeting.provider === "JITSI") {
        return {
            success: true,
            message: "Un lien Jitsi existe déjà pour cette réunion.",
            externalUrl: meeting.externalUrl,
        };
    }

    const roomName = buildJitsiRoomName(meeting.title, meeting.id);
    const externalUrl = `https://meet.jit.si/${roomName}`;

    const updatedMeeting = await prisma.teamMeeting.update({
        where: { id: meeting.id },
        data: {
            provider: "JITSI",
            externalUrl,
        },
        include: {
            team: true,
            project: true,
            createdBy: true,
        },
    });

    revalidateMeetingPaths(meeting.id, meeting.teamId);

    return {
        success: true,
        message: "Lien Jitsi généré avec succès.",
        meeting: updatedMeeting,
        externalUrl,
    };
}

export async function regenerateJitsiMeetingLink(meetingId: string) {
    const meeting = await getMeetingForVideoManagement(meetingId);

    if (meeting.status === "CANCELLED") {
        throw new ActionError(
            "Impossible de régénérer un lien Jitsi pour une réunion annulée.",
            400
        );
    }

    const roomName = buildJitsiRoomName(meeting.title, meeting.id);
    const externalUrl = `https://meet.jit.si/${roomName}`;

    const updatedMeeting = await prisma.teamMeeting.update({
        where: { id: meeting.id },
        data: {
            provider: "JITSI",
            externalUrl,
        },
        include: {
            team: true,
            project: true,
            createdBy: true,
        },
    });

    revalidateMeetingPaths(meeting.id, meeting.teamId);

    return {
        success: true,
        message: "Lien Jitsi régénéré avec succès.",
        meeting: updatedMeeting,
        externalUrl,
    };
}

export async function removeMeetingVideoLink(meetingId: string) {
    const meeting = await getMeetingForVideoManagement(meetingId);

    const updatedMeeting = await prisma.teamMeeting.update({
        where: { id: meeting.id },
        data: {
            provider: "NONE",
            externalUrl: null,
        },
        include: {
            team: true,
            project: true,
            createdBy: true,
        },
    });

    revalidateMeetingPaths(meeting.id, meeting.teamId);

    return {
        success: true,
        message: "Lien de visioconférence supprimé avec succès.",
        meeting: updatedMeeting,
    };
}

export async function getMeetingRecordings(meetingId: string) {
    const user = await getCurrentDbUser();

    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: meetingId },
        include: {
            team: {
                include: {
                    members: {
                        where: { userId: user.id },
                    },
                },
            },
        },
    });

    if (!meeting) {
        throw new ActionError("Réunion introuvable.", 404);
    }

    if (meeting.team.members.length === 0) {
        throw new ActionError("Accès refusé à cette réunion.", 403);
    }

    return prisma.meetingRecording.findMany({
        where: { meetingId },
        include: {
            addedBy: {
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
    });
}

export async function addMeetingRecording(input: {
    meetingId: string;
    title: string;
    url: string;
    description?: string;
}) {
    const parsed = addMeetingRecordingSchema.parse(input);
    const user = await getCurrentDbUser();
    const meeting = await getMeetingForRecordingManagement(parsed.meetingId);

    const recording = await prisma.meetingRecording.create({
        data: {
            meetingId: parsed.meetingId,
            title: parsed.title,
            url: parsed.url,
            description: normalizeOptionalString(parsed.description),
            addedById: user.id,
        },
        include: {
            addedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    revalidateMeetingPaths(parsed.meetingId, meeting.teamId);

    return {
        success: true,
        message: "Enregistrement ajouté avec succès.",
        recording,
    };
}

export async function removeMeetingRecording(recordingId: string) {
    if (!recordingId?.trim()) {
        throw new ActionError("Enregistrement invalide.", 400);
    }

    const recording = await prisma.meetingRecording.findUnique({
        where: { id: recordingId },
        include: {
            meeting: {
                select: {
                    id: true,
                    teamId: true,
                },
            },
        },
    });

    if (!recording) {
        throw new ActionError("Enregistrement introuvable.", 404);
    }

    await assertHasTeamRole(recording.meeting.teamId, ["OWNER", "MANAGER"]);

    await prisma.meetingRecording.delete({
        where: { id: recordingId },
    });

    revalidateMeetingPaths(recording.meeting.id, recording.meeting.teamId);

    return {
        success: true,
        message: "Enregistrement supprimé avec succès.",
    };
}