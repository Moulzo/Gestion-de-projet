import prisma from "@/lib/prisma";
import { ActionError, getCurrentDbUser } from "@/lib/permissions";

export async function getMeetingAccessContext(meetingId: string) {
    const user = await getCurrentDbUser();

    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: meetingId },
        include: {
            team: {
                include: {
                    members: {
                        where: { userId: user.id },
                        select: {
                            userId: true,
                            role: true,
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
        },
    });

    if (!meeting) {
        throw new ActionError("Réunion introuvable.", 404);
    }

    const membership = meeting.team.members[0];
    if (!membership) {
        throw new ActionError("Accès refusé à cette réunion.", 403);
    }

    const canManage =
        membership.role === "OWNER" || membership.role === "MANAGER";

    return {
        user,
        meeting,
        membership,
        canManage,
        canJoin: true,
    };
}

export async function assertCanJoinMeeting(meetingId: string) {
    const context = await getMeetingAccessContext(meetingId);
    return context;
}

export async function assertCanManageMeeting(meetingId: string) {
    const context = await getMeetingAccessContext(meetingId);

    if (!context.canManage) {
        throw new ActionError(
            "Vous n'avez pas les droits suffisants pour gérer cette réunion.",
            403
        );
    }

    return context;
}
