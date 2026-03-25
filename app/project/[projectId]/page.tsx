"use client";

import {
    deleteTaskById,
    getProjectInfo,
    getProjectMembersWithRoles,
    removeProjectMember,
    updateProjectMemberRole,
} from "@/app/actions";
import EmptyState from "@/app/components/EmptyState";
import ProjectComponent from "@/app/components/ProjectComponent";
import TaskComponent from "@/app/components/TaskComponent";
import UserInfo from "@/app/components/UserInfo";
import Wrapper from "@/app/components/Wrapper";
import { PROJECT_ROLE_LABELS } from "@/lib/project-role-labels";
import { TASK_STATUSES } from "@/lib/task-status";
import { Project, ProjectRole, ProjectUserMember } from "@/type";
import { useUser } from "@clerk/nextjs";
import {
    CircleCheckBig,
    CopyPlus,
    Crown,
    ListTodo,
    Loader,
    ShieldCheck,
    SlidersHorizontal,
    UserCheck,
    Users,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const ROLE_ORDER: Record<ProjectRole, number> = {
    OWNER: 0,
    MANAGER: 1,
    MEMBER: 2,
};

const ROLE_SECTION_META: Record<
    ProjectRole,
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
        icon: <Users className="w-4 h-4" />,
        empty: "Aucun membre",
    },
};

const page = ({ params }: { params: Promise<{ projectId: string }> }) => {
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress as string;

    const [projectId, setProjectId] = useState("");
    const [project, setProject] = useState<Project | null>(null);
    const [members, setMembers] = useState<ProjectUserMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [assignedFilter, setAssignedFilter] = useState<boolean>(false);
    const [taskCounts, setTaskCounts] = useState({
        todo: 0,
        inProgress: 0,
        done: 0,
        assigned: 0,
    });

    const fetchInfos = async (projectId: string) => {
        try {
            const project = await getProjectInfo(projectId, true);
            setProject(project);
        } catch (error) {
            console.error(`Erreur lors du chargement du projet :`, error);
        }
    };

    const fetchMembers = async (projectId: string) => {
        try {
            setMembersLoading(true);
            const projectMembers = await getProjectMembersWithRoles(projectId);
            setMembers(projectMembers as ProjectUserMember[]);
        } catch (error) {
            console.error("Erreur lors du chargement des membres :", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors du chargement des membres"
            );
        } finally {
            setMembersLoading(false);
        }
    };

    useEffect(() => {
        const getId = async () => {
            const resolvedParams = await params;
            setProjectId(resolvedParams.projectId);
            fetchInfos(resolvedParams.projectId);
            fetchMembers(resolvedParams.projectId);
        };
        getId();
    }, [params]);

    useEffect(() => {
        if (project && project.tasks && email) {
            const counts = {
                todo: project.tasks.filter(
                    (task) => task.status === TASK_STATUSES.TODO
                ).length,
                inProgress: project.tasks.filter(
                    (task) => task.status === TASK_STATUSES.IN_PROGRESS
                ).length,
                done: project.tasks.filter(
                    (task) => task.status === TASK_STATUSES.DONE
                ).length,
                assigned: project.tasks.filter(
                    (task) => task?.user?.email === email
                ).length,
            };
            setTaskCounts(counts);
        }
    }, [project, email]);

    const currentMembership = useMemo(() => {
        if (!email) return null;
        return members.find((member) => member.user.email === email) || null;
    }, [members, email]);

    const currentUserRole: ProjectRole | null = currentMembership?.role ?? null;
    const canManageMembers = currentUserRole === "OWNER";
    const canCreateTask =
        currentUserRole === "OWNER" || currentUserRole === "MANAGER";
    const canDeleteTask =
        currentUserRole === "OWNER" || currentUserRole === "MANAGER";

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

    const filteredTasks = project?.tasks?.filter((task) => {
        const statusMatch = !statusFilter || task.status === statusFilter;
        const assignedMatch = !assignedFilter || task?.user?.email === email;
        return statusMatch && assignedMatch;
    });

    const deleteTask = async (taskId: string) => {
        try {
            await deleteTaskById(taskId);
            fetchInfos(projectId);
            toast.success("Tâche supprimée avec succès");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
        }
    };

    const handleRoleChange = async (
        memberUserId: string,
        newRole: "MANAGER" | "MEMBER"
    ) => {
        try {
            await updateProjectMemberRole(projectId, memberUserId, newRole);
            await fetchMembers(projectId);
            toast.success("Rôle mis à jour avec succès");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
        }
    };

    const handleRemoveMember = async (memberUserId: string) => {
        try {
            await removeProjectMember(projectId, memberUserId);
            await fetchMembers(projectId);
            toast.success("Collaborateur retiré avec succès");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
        }
    };

    const renderMemberCard = (member: ProjectUserMember) => {
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
                        <p className="font-medium wrap-break-word">
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
                        {PROJECT_ROLE_LABELS[member.role]}
                    </span>
                </div>

                {canManageMembers && !isOwner && (
                    <div className="mt-3 space-y-2">
                        <select
                            className="select select-bordered select-sm w-full"
                            value={member.role}
                            onChange={(e) =>
                                handleRoleChange(
                                    member.userId,
                                    e.target.value as "MANAGER" | "MEMBER"
                                )
                            }
                        >
                            <option value="MEMBER">Membre</option>
                            <option value="MANAGER">Manager</option>
                        </select>

                        <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="btn btn-sm btn-error btn-outline w-full"
                        >
                            Retirer
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Wrapper>
            <div className="flex flex-col gap-6 lg:flex-row">
                <aside className="w-full lg:w-[340px] xl:w-[380px] shrink-0">
                    <div className="p-5 border border-base-300 rounded-xl">
                        <UserInfo
                            role="Créé par"
                            email={project?.createdBy?.email || null}
                            name={project?.createdBy?.name || null}
                        />
                    </div>

                    <div className="p-5 border border-base-300 rounded-xl mt-6">
                        <div className="flex flex-col items-start gap-3 mb-4 xl:flex-row xl:items-center xl:justify-between">
                            <h2 className="font-semibold text-lg leading-tight">
                                Membres du projet
                            </h2>

                            {currentUserRole && (
                                <div className="badge badge-primary w-fit max-w-full whitespace-normal text-left h-auto py-2">
                                    Mon rôle : {PROJECT_ROLE_LABELS[currentUserRole]}
                                </div>
                            )}
                        </div>

                        {canManageMembers ? (
                            <p className="text-xs opacity-70 mb-4 leading-6">
                                Vous pouvez modifier les rôles des managers et membres, ainsi que retirer
                                des collaborateurs du projet.
                            </p>
                        ) : (
                            <p className="text-xs opacity-70 mb-4 leading-6">
                                Vue en lecture seule des collaborateurs du projet.
                            </p>
                        )}

                        {membersLoading ? (
                            <p className="text-sm opacity-70">Chargement des membres...</p>
                        ) : members.length > 0 ? (
                            <div className="space-y-5">
                                {(["OWNER", "MANAGER", "MEMBER"] as ProjectRole[]).map((roleKey) => {
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

                    <div className="w-full mt-6">
                        {project && (
                            <ProjectComponent project={project} admin={0} style={false} />
                        )}
                    </div>
                </aside>

                <section className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        setStatusFilter("");
                                        setAssignedFilter(false);
                                    }}
                                    className={`btn btn-sm ${!statusFilter ? "btn-primary" : ""}`}
                                >
                                    <SlidersHorizontal className="w-4" />
                                    Tous ({project?.tasks?.length || 0})
                                </button>

                                <button
                                    onClick={() => setStatusFilter(TASK_STATUSES.TODO)}
                                    className={`btn btn-sm ${
                                        statusFilter === TASK_STATUSES.TODO ? "btn-primary" : ""
                                    }`}
                                >
                                    <ListTodo className="w-4" />
                                    À faire ({taskCounts.todo})
                                </button>

                                <button
                                    onClick={() => setStatusFilter(TASK_STATUSES.IN_PROGRESS)}
                                    className={`btn btn-sm ${
                                        statusFilter === TASK_STATUSES.IN_PROGRESS ? "btn-primary" : ""
                                    }`}
                                >
                                    <Loader className="w-4" />
                                    En Cours ({taskCounts.inProgress})
                                </button>

                                <button
                                    onClick={() => setStatusFilter(TASK_STATUSES.DONE)}
                                    className={`btn btn-sm ${
                                        statusFilter === TASK_STATUSES.DONE ? "btn-primary" : ""
                                    }`}
                                >
                                    <CircleCheckBig className="w-4" />
                                    Terminée(s) ({taskCounts.done})
                                </button>

                                <button
                                    onClick={() => setAssignedFilter(!assignedFilter)}
                                    className={`btn btn-sm ${assignedFilter ? "btn-primary" : ""}`}
                                >
                                    <UserCheck className="w-4" />
                                    Vos tâches ({taskCounts.assigned})
                                </button>
                            </div>
                        </div>

                        {canCreateTask && (
                            <Link
                                href={`/new-tasks/${projectId}`}
                                className="btn btn-sm self-start xl:self-auto"
                            >
                                Nouvelle tâche
                                <CopyPlus className="w-4" />
                            </Link>
                        )}
                    </div>

                    <div className="mt-6 border border-base-300 p-4 md:p-5 shadow-sm rounded-xl">
                        {filteredTasks && filteredTasks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-lg">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Titre</th>
                                            <th>Assigné à</th>
                                            <th className="hidden md:table-cell">À livrer le</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTasks.map((task, index) => (
                                            <tr key={task.id} className="border-t last:border-none">
                                                <TaskComponent
                                                    task={task}
                                                    index={index}
                                                    onDelete={deleteTask}
                                                    canDelete={canDeleteTask}
                                                />
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                imageSrc="/empty-task.png"
                                imageAlt="Picture of an empty project"
                                message="0 tâche à afficher"
                            />
                        )}
                    </div>
                </section>
            </div>
        </Wrapper>
    );
};

export default page;