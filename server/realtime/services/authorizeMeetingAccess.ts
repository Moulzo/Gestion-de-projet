import prisma from "@/lib/prisma";
import { ActionError } from "@/lib/permissions";

export async function authorizeMeetingAccess(params: {
    meetingId: string;
    email: string;
}) {
    const user = await prisma.user.findUnique({
        where: { email: params.email },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    if (!user) {
        throw new ActionError("Utilisateur introuvable.", 401);
    }

    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: params.meetingId },
        include: {
            team: {
                include: {
                    members: {
                        where: {
                            userId: user.id,
                        },
                        select: {
                            role: true,
                            userId: true,
                        },
                    },
                },
            },
        },
    });

    if (!meeting) {
        throw new ActionError("Réunion introuvable.", 404);
    }

    const membership = meeting.team.members[0];
    if (!membership) {
        throw new ActionError("Accès refusé à cette réunion.", 403);
    }

    if (meeting.provider !== "NATIVE") {
        throw new ActionError(
            "Cette réunion n'utilise pas encore la visio native.",
            400
        );
    }

    if (meeting.status === "CANCELLED") {
        throw new ActionError(
            "Impossible de rejoindre une réunion annulée.",
            400
        );
    }

    return {
        meeting,
        user,
        membership,
    };
}
