import prisma from "@/lib/prisma";
import { ActionError, getCurrentDbUser } from "@/lib/permissions";

export const TEAM_ROLES = {
    OWNER: "OWNER",
    MANAGER: "MANAGER",
    MEMBER: "MEMBER",
} as const;

export type TeamRole = typeof TEAM_ROLES[keyof typeof TEAM_ROLES];

export async function getTeamMembership(teamId: string) {
    const user = await getCurrentDbUser();

    const membership = await prisma.teamMember.findUnique({
        where: {
            teamId_userId: {
                teamId,
                userId: user.id,
            },
        },
        include: {
            team: true,
            user: true,
        },
    });

    if (!membership) {
        throw new ActionError("Accès refusé à cette équipe.", 403);
    }

    return membership;
}

export async function assertHasTeamRole(
    teamId: string,
    allowedRoles: TeamRole[]
) {
    const membership = await getTeamMembership(teamId);

    if (!allowedRoles.includes(membership.role as TeamRole)) {
        throw new ActionError(
            "Vous n'avez pas les droits suffisants pour cette action dans l'équipe.",
            403
        );
    }

    return membership;
}

export async function canManageTeam(teamId: string) {
    return assertHasTeamRole(teamId, ["OWNER", "MANAGER"]);
}

export async function canAdminTeam(teamId: string) {
    return assertHasTeamRole(teamId, ["OWNER"]);
}
