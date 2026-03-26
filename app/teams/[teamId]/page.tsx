"use client";

import React, { useEffect, useMemo, useState } from "react";
import Wrapper from "@/app/components/Wrapper";
import ProjectComponent from "@/app/components/ProjectComponent";
import EmptyState from "@/app/components/EmptyState";
import {
    getTeamDetails,
    getTeamMembers,
    removeTeamMember,
    updateTeamMemberRole,
} from "@/app/actions";
import { TEAM_ROLE_LABELS } from "@/lib/team-role-labels";
import { Team, TeamMember, TeamRole } from "@/type";
import {
    Copy,
    Crown,
    FolderKanban,
    ShieldCheck,
    UsersRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "@clerk/nextjs";

const ROLE_ORDER: Record<TeamRole, number> = {
    OWNER: 0,
    MANAGER: 1,
    MEMBER: 2,
};

const ROLE_SECTION_META: Record<
    TeamRole,
    { title: string; icon: React.ReactNode; empty: string }
> = {
    OWNER: {
        title: "Propriétaire",
        icon: <Crown className="w-4 h-4" />,
        empty: "Aucun propriétaire",
    },
    MANAGER: {
        title: "Managers",
        icon: <ShieldCheck className="w-4 h-4" />,
        empty: "Aucun manager",
    },
    MEMBER: {
        title: "Membres",
        icon: <UsersRound className="w-4 h-4" />,
        empty: "Aucun membre",
    },
};

type PendingRoleChange = {
    memberUserId: string;
    memberName: string;
    currentRole: "MANAGER" | "MEMBER";
    newRole: "MANAGER" | "MEMBER";
};

type PendingRemoval = {
    memberUserId: string;
    memberName: string;
};

const page = ({ params }: { params: Promise<{ teamId: string }> }) => {
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress as string;

    const [teamId, setTeamId] = useState("");
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);
    const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
    const [isSubmittingSensitiveAction, setIsSubmittingSensitiveAction] = useState(false);

    const fetchTeam = async (id: string) => {
        try {
            setLoading(true);
            const data = await getTeamDetails(id);
            setTeam(data as Team);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Erreur lors du chargement de l’équipe."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async (id: string) => {
        try {
            setMembersLoading(true);
            const data = await getTeamMembers(id);
            setMembers(data as TeamMember[]);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Erreur lors du chargement des membres."
            );
        } finally {
            setMembersLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const resolved = await params;
            setTeamId(resolved.teamId);
            await Promise.all([fetchTeam(resolved.teamId), fetchMembers(resolved.teamId)]);
        };

        init();
    }, [params]);

    const currentMembership = useMemo(() => {
        if (!email) return null;
        return members.find((member) => member.user.email === email) || null;
    }, [members, email]);

    const currentUserRole: TeamRole | null = currentMembership?.role ?? null;
    const canManageMembers = currentUserRole === "OWNER";

    const groupedMembers = useMemo(() => {
        const sorted = [...members].sort((a, b) => {
            const roleOrderDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
            if (roleOrderDiff !== 0) return roleOrderDiff;

            const aName = a.user.name || a.user.email;
            const bName = b.user.name || b.user.email;
            return aName.localeCompare(bName, "fr", { sensitivity: "base" });
        });

        return {
            OWNER: sorted.filter((member) => member.role === "OWNER"),
            MANAGER: sorted.filter((member) => member.role === "MANAGER"),
            MEMBER: sorted.filter((member) => member.role === "MEMBER"),
        };
    }, [members]);

    const requestRoleChange = (
        member: TeamMember,
        newRole: "MANAGER" | "MEMBER"
    ) => {
        if (member.role === newRole) return;

        setPendingRoleChange({
            memberUserId: member.userId,
            memberName: member.user.name || member.user.email,
            currentRole: member.role as "MANAGER" | "MEMBER",
            newRole,
        });

        const modal = document.getElementById("confirm_team_role_change_modal") as HTMLDialogElement | null;
        modal?.showModal();
    };

    const confirmRoleChange = async () => {
        if (!pendingRoleChange) return;

        try {
            setIsSubmittingSensitiveAction(true);
            await updateTeamMemberRole(
                teamId,
                pendingRoleChange.memberUserId,
                pendingRoleChange.newRole
            );
            await fetchMembers(teamId);
            await fetchTeam(teamId);
            toast.success("Rôle mis à jour avec succès.");
            closeRoleChangeModal();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
        } finally {
            setIsSubmittingSensitiveAction(false);
        }
    };

    const requestRemoveMember = (member: TeamMember) => {
        setPendingRemoval({
            memberUserId: member.userId,
            memberName: member.user.name || member.user.email,
        });

        const modal = document.getElementById("confirm_team_remove_member_modal") as HTMLDialogElement | null;
        modal?.showModal();
    };

    const confirmRemoveMember = async () => {
        if (!pendingRemoval) return;

        try {
            setIsSubmittingSensitiveAction(true);
            await removeTeamMember(teamId, pendingRemoval.memberUserId);
            await fetchMembers(teamId);
            await fetchTeam(teamId);
            toast.success("Membre retiré avec succès.");
            closeRemoveMemberModal();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
        } finally {
            setIsSubmittingSensitiveAction(false);
        }
    };

    const closeRoleChangeModal = () => {
        const modal = document.getElementById("confirm_team_role_change_modal") as HTMLDialogElement | null;
        modal?.close();
        setPendingRoleChange(null);
    };

    const closeRemoveMemberModal = () => {
        const modal = document.getElementById("confirm_team_remove_member_modal") as HTMLDialogElement | null;
        modal?.close();
        setPendingRemoval(null);
    };

    const copyInviteCode = async () => {
        if (!team?.inviteCode) return;

        try {
            await navigator.clipboard.writeText(team.inviteCode);
            setCopied(true);
            toast.success("Code d’invitation copié.");
            setTimeout(() => setCopied(false), 1500);
        } catch (error) {
            toast.error("Impossible de copier le code.");
        }
    };

    const renderMemberCard = (member: TeamMember) => {
        const isOwner = member.role === "OWNER";
        const isCurrentUser = member.user.email === email;

        return (
            <div
                key={member.userId}
                className={`rounded-lg border p-3 ${
                    isOwner ? "border-primary/40 bg-base-200/60" : "border-base-300"
                }`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="font-medium break-words">
                            {member.user.name || "Utilisateur"}
                            {isCurrentUser && (
                                <span className="ml-2 text-xs opacity-70">(Vous)</span>
                            )}
                        </p>
                        <p className="text-sm opacity-70 break-all">{member.user.email}</p>
                    </div>

                    <span
                        className={`badge shrink-0 ${
                            isOwner ? "badge-primary" : "badge-outline"
                        }`}
                    >
                        {TEAM_ROLE_LABELS[member.role]}
                    </span>
                </div>

                {canManageMembers && !isOwner && (
                    <div className="mt-3 space-y-2">
                        <select
                            className="select select-bordered select-sm w-full"
                            value={member.role}
                            onChange={(e) =>
                                requestRoleChange(
                                    member,
                                    e.target.value as "MANAGER" | "MEMBER"
                                )
                            }
                        >
                            <option value="MEMBER">Membre</option>
                            <option value="MANAGER">Manager</option>
                        </select>

                        <button
                            onClick={() => requestRemoveMember(member)}
                            className="btn btn-sm btn-error btn-outline w-full"
                        >
                            Retirer
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <Wrapper>
                <div className="rounded-xl border border-base-300 p-5">
                    <p className="text-sm opacity-70">Chargement de l’équipe...</p>
                </div>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <div className="flex flex-col gap-6 lg:flex-row">
                <aside className="w-full lg:w-[340px] xl:w-[380px] shrink-0">
                    <div className="rounded-xl border border-base-300 p-5">
                        <h1 className="text-xl font-bold break-words">{team?.name}</h1>
                        <p className="text-sm opacity-70 mt-2 break-words">
                            {team?.description || "Aucune description pour cette équipe."}
                        </p>

                        {currentUserRole && (
                            <div className="badge badge-primary mt-4 h-auto py-2 whitespace-normal text-left">
                                Mon rôle : {TEAM_ROLE_LABELS[currentUserRole]}
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-base-300 p-5 mt-6">
                        <h2 className="font-semibold text-lg">Invitation</h2>
                        <p className="text-sm opacity-70 mt-2">
                            Partagez ce code pour permettre à un membre interne de rejoindre l’équipe.
                        </p>

                        <div className="mt-4 rounded-lg border border-base-300 p-3 flex flex-col gap-3">
                            <code className="text-sm break-all">{team?.inviteCode}</code>
                            <button className="btn btn-sm btn-outline" onClick={copyInviteCode}>
                                {copied ? "Copié" : "Copier le code"}
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-base-300 p-5 mt-6">
                        <h2 className="font-semibold text-lg">Membres de l’équipe</h2>

                        {canManageMembers ? (
                            <p className="text-xs opacity-70 mt-2 leading-6">
                                Vous pouvez modifier les rôles des managers et membres, ainsi que retirer des membres de l’équipe.
                            </p>
                        ) : (
                            <p className="text-xs opacity-70 mt-2 leading-6">
                                Vue en lecture seule des membres de l’équipe.
                            </p>
                        )}

                        <div className="mt-4">
                            {membersLoading ? (
                                <p className="text-sm opacity-70">Chargement des membres...</p>
                            ) : members.length > 0 ? (
                                <div className="space-y-5">
                                    {(["OWNER", "MANAGER", "MEMBER"] as TeamRole[]).map((roleKey) => {
                                        const sectionMembers = groupedMembers[roleKey];
                                        const meta = ROLE_SECTION_META[roleKey];

                                        return (
                                            <div key={roleKey}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    {meta.icon}
                                                    <h3 className="text-sm font-semibold">{meta.title}</h3>
                                                    <span className="text-xs opacity-60">
                                                        ({sectionMembers.length})
                                                    </span>
                                                </div>

                                                {sectionMembers.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {sectionMembers.map(renderMemberCard)}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm opacity-60">{meta.empty}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm opacity-70">Aucun membre trouvé.</p>
                            )}
                        </div>
                    </div>
                </aside>

                <section className="min-w-0 flex-1">
                    <div className="rounded-xl border border-base-300 p-4 md:p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Projets rattachés</h2>
                        </div>

                        {team?.projects && team.projects.length > 0 ? (
                            <ul className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                {team.projects.map((project) => (
                                    <li key={project.id}>
                                        <ProjectComponent
                                            project={project}
                                            admin={0}
                                            style={true}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState
                                imageSrc="/empty-project.png"
                                imageAlt="Aucun projet dans l’équipe"
                                message="Aucun projet rattaché à cette équipe"
                            />
                        )}
                    </div>
                </section>
            </div>

            <dialog id="confirm_team_role_change_modal" className="modal">
                <div className="modal-box">
                    <form method="dialog">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                            onClick={closeRoleChangeModal}
                        >
                            ✕
                        </button>
                    </form>

                    <h3 className="font-bold text-lg">Confirmer le changement de rôle</h3>

                    {pendingRoleChange && (
                        <>
                            <p className="py-3 text-sm opacity-80">
                                Vous êtes sur le point de modifier le rôle de{" "}
                                <strong>{pendingRoleChange.memberName}</strong>.
                            </p>

                            <div className="alert alert-warning mb-4">
                                <span>
                                    Rôle actuel :{" "}
                                    <strong>{TEAM_ROLE_LABELS[pendingRoleChange.currentRole]}</strong>
                                    {" → "}
                                    Nouveau rôle :{" "}
                                    <strong>{TEAM_ROLE_LABELS[pendingRoleChange.newRole]}</strong>
                                </span>
                            </div>
                        </>
                    )}

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={closeRoleChangeModal}
                            disabled={isSubmittingSensitiveAction}
                        >
                            Annuler
                        </button>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={confirmRoleChange}
                            disabled={!pendingRoleChange || isSubmittingSensitiveAction}
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </dialog>

            <dialog id="confirm_team_remove_member_modal" className="modal">
                <div className="modal-box">
                    <form method="dialog">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                            onClick={closeRemoveMemberModal}
                        >
                            ✕
                        </button>
                    </form>

                    <h3 className="font-bold text-lg">Retirer ce membre</h3>

                    {pendingRemoval && (
                        <>
                            <p className="py-3 text-sm opacity-80">
                                Vous êtes sur le point de retirer{" "}
                                <strong>{pendingRemoval.memberName}</strong> de cette équipe.
                            </p>

                            <div className="alert alert-warning mb-4">
                                <span>
                                    Cette personne perdra l’accès à l’équipe, mais pas automatiquement aux projets où elle collabore déjà.
                                </span>
                            </div>
                        </>
                    )}

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={closeRemoveMemberModal}
                            disabled={isSubmittingSensitiveAction}
                        >
                            Annuler
                        </button>

                        <button
                            type="button"
                            className="btn btn-error"
                            onClick={confirmRemoveMember}
                            disabled={!pendingRemoval || isSubmittingSensitiveAction}
                        >
                            Retirer de l’équipe
                        </button>
                    </div>
                </div>
            </dialog>
        </Wrapper>
    );
};

export default page;