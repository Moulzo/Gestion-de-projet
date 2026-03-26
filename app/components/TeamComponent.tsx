"use client";

import { Team, TeamRole } from "@/type";
import { TEAM_ROLE_LABELS } from "@/lib/team-role-labels";
import { CalendarDays, FolderKanban, UsersRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { FC } from "react";

type TeamCardData = Team & {
    currentUserRole?: TeamRole;
    membersCount?: number;
    projectsCount?: number;
};

interface TeamComponentProps {
    team: TeamCardData;
}

const TeamComponent: FC<TeamComponentProps> = ({ team }) => {
    return (
        <div className="w-full rounded-xl border border-base-300 p-5 shadow-sm transition hover:shadow-md bg-base-100">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold break-words">{team.name}</h2>
                        {team.description ? (
                            <p className="mt-1 text-sm opacity-70 break-words">
                                {team.description}
                            </p>
                        ) : (
                            <p className="mt-1 text-sm opacity-50">
                                Aucune description renseignée.
                            </p>
                        )}
                    </div>

                    {team.currentUserRole && (
                        <span className="badge badge-primary h-auto py-2 whitespace-normal text-left">
                            {TEAM_ROLE_LABELS[team.currentUserRole]}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-base-300 p-3">
                        <div className="flex items-center gap-2 text-sm opacity-80">
                            <UsersRound className="w-4 h-4" />
                            Membres
                        </div>
                        <p className="mt-2 text-xl font-semibold">{team.membersCount ?? team.members?.length ?? 0}</p>
                    </div>

                    <div className="rounded-lg border border-base-300 p-3">
                        <div className="flex items-center gap-2 text-sm opacity-80">
                            <FolderKanban className="w-4 h-4" />
                            Projets
                        </div>
                        <p className="mt-2 text-xl font-semibold">{team.projectsCount ?? team.projects?.length ?? 0}</p>
                    </div>

                    <div className="rounded-lg border border-base-300 p-3">
                        <div className="flex items-center gap-2 text-sm opacity-80">
                            <CalendarDays className="w-4 h-4" />
                            Créée le
                        </div>
                        <p className="mt-2 text-sm font-medium">
                            {new Date(team.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Link href={`/teams/${team.id}`} className="btn btn-sm btn-primary">
                        Voir l’équipe
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TeamComponent;