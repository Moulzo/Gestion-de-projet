"use client";

import React, { useEffect, useMemo, useState } from "react";
import Wrapper from "../components/Wrapper";
import EmptyState from "../components/EmptyState";
import {
    createMeeting,
    getMeetingsForCurrentUser,
    getTeamProjectsForMeeting,
    getTeamsForCurrentUser,
    updateMeetingStatus,
} from "../actions";
import { Team, TeamMeeting, TeamRole } from "@/type";
import {
    ArrowRight,
    CalendarDays,
    FileText,
    FolderPlus,
    Link2,
    UsersRound,
    Video,
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

type TeamOption = Team & {
    currentUserRole?: TeamRole;
    membersCount?: number;
    projectsCount?: number;
};

const STATUS_LABELS = {
    SCHEDULED: "Planifiée",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
} as const;

const STATUS_BADGE_CLASS = {
    SCHEDULED: "badge-info",
    COMPLETED: "badge-success",
    CANCELLED: "badge-error",
} as const;

const page = () => {
    const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [teamProjects, setTeamProjects] = useState<{ id: string; name: string }[]>([]);

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

    const [teamFilter, setTeamFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [externalUrl, setExternalUrl] = useState("");

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const data = await getMeetingsForCurrentUser();
            setMeetings(data as TeamMeeting[]);
        } catch (error) {
            toast.error("Erreur lors du chargement des réunions.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const data = await getTeamsForCurrentUser();
            setTeams(data as TeamOption[]);
        } catch (error) {
            toast.error("Erreur lors du chargement des équipes.");
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchTeams();
    }, []);

    useEffect(() => {
        const loadProjects = async () => {
            if (!selectedTeamId) {
                setTeamProjects([]);
                setSelectedProjectId("");
                return;
            }

            try {
                const projects = await getTeamProjectsForMeeting(selectedTeamId);
                setTeamProjects(projects as { id: string; name: string }[]);
            } catch (error) {
                toast.error("Erreur lors du chargement des projets de l'équipe.");
            }
        };

        loadProjects();
    }, [selectedTeamId]);

    const filteredMeetings = useMemo(() => {
        return meetings.filter((meeting) => {
            const teamMatch = !teamFilter || meeting.teamId === teamFilter;
            const statusMatch = !statusFilter || meeting.status === statusFilter;
            return teamMatch && statusMatch;
        });
    }, [meetings, teamFilter, statusFilter]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setNotes("");
        setScheduledAt("");
        setDurationMinutes("");
        setSelectedTeamId("");
        setSelectedProjectId("");
        setExternalUrl("");
        setTeamProjects([]);
    };

    const handleCreateMeeting = async () => {
        if (!title.trim() || !scheduledAt || !selectedTeamId) {
            toast.error("Veuillez renseigner le titre, l'équipe et la date.");
            return;
        }

        try {
            setCreating(true);

            await createMeeting({
                title,
                description,
                scheduledAt,
                durationMinutes: durationMinutes ? Number(durationMinutes) : null,
                teamId: selectedTeamId,
                projectId: selectedProjectId || null,
                externalUrl: externalUrl || null,
            });

            resetForm();
            (document.getElementById("create_meeting_modal") as HTMLDialogElement | null)?.close();
            await fetchMeetings();

            toast.success("Réunion créée avec succès.");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Erreur lors de la création de la réunion."
            );
        } finally {
            setCreating(false);
        }
    };

    const handleStatusChange = async (
        meetingId: string,
        status: "SCHEDULED" | "COMPLETED" | "CANCELLED"
    ) => {
        try {
            setSavingStatusId(meetingId);
            await updateMeetingStatus(meetingId, status);
            await fetchMeetings();
            toast.success("Statut mis à jour.");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut."
            );
        } finally {
            setSavingStatusId(null);
        }
    };

    return (
        <Wrapper>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Réunions</h1>
                        <p className="text-sm opacity-70 mt-1">
                            Planifiez vos réunions d'équipe ou de projet, puis centralisez les comptes-rendus.
                        </p>
                    </div>

                    <button
                        className="btn btn-primary self-start lg:self-auto"
                        onClick={() =>
                            (document.getElementById("create_meeting_modal") as HTMLDialogElement | null)?.showModal()
                        }
                    >
                        Nouvelle réunion
                        <FolderPlus className="w-4 h-4" />
                    </button>
                </div>

                <div className="rounded-xl border border-base-300 p-4 md:p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="label">
                                <span className="label-text">Filtrer par équipe</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                            >
                                <option value="">Toutes les équipes</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text">Filtrer par statut</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tous les statuts</option>
                                <option value="SCHEDULED">Planifiée</option>
                                <option value="COMPLETED">Terminée</option>
                                <option value="CANCELLED">Annulée</option>
                            </select>
                        </div>
                    </div>
                </div>

                <dialog id="create_meeting_modal" className="modal">
                    <div className="modal-box max-w-2xl">
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                                ✕
                            </button>
                        </form>

                        <h3 className="font-bold text-lg">Nouvelle réunion</h3>
                        <p className="py-4 text-sm opacity-80">
                            Créez une réunion d'équipe, avec un projet lié en option.
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <input
                                placeholder="Titre de la réunion"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input input-bordered w-full"
                            />

                            <textarea
                                placeholder="Description (optionnelle)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="textarea textarea-bordered w-full"
                            />

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="label">
                                        <span className="label-text">Équipe</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedTeamId}
                                        onChange={(e) => setSelectedTeamId(e.target.value)}
                                    >
                                        <option value="">Choisir une équipe</option>
                                        {teams.map((team) => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="label">
                                        <span className="label-text">Projet lié (optionnel)</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        disabled={!selectedTeamId}
                                    >
                                        <option value="">Aucun projet</option>
                                        {teamProjects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="label">
                                        <span className="label-text">Date et heure</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        className="input input-bordered w-full"
                                    />
                                </div>

                                <div>
                                    <label className="label">
                                        <span className="label-text">Durée (minutes, optionnel)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(e.target.value)}
                                        className="input input-bordered w-full"
                                        placeholder="Ex : 60"
                                    />
                                </div>
                            </div>

                            <input
                                placeholder="Lien externe / visio (optionnel)"
                                type="url"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                className="input input-bordered w-full"
                            />

                            <textarea
                                placeholder="Compte-rendu initial (optionnel)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="textarea textarea-bordered w-full min-h-32"
                            />

                            <div className="flex justify-end">
                                <button
                                    className="btn btn-primary w-full sm:w-auto"
                                    onClick={handleCreateMeeting}
                                    disabled={creating}
                                >
                                    Créer la réunion
                                    <CalendarDays className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </dialog>

                {loading ? (
                    <div className="rounded-xl border border-base-300 p-5">
                        <p className="text-sm opacity-70">Chargement des réunions...</p>
                    </div>
                ) : filteredMeetings.length > 0 ? (
                    <ul className="space-y-4">
                        {filteredMeetings.map((meeting) => (
                            <li key={meeting.id}>
                                <div className="rounded-xl border border-base-300 p-4 md:p-5 shadow-sm space-y-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-lg font-semibold break-words">
                                                    {meeting.title}
                                                </h2>
                                                <span className={`badge ${STATUS_BADGE_CLASS[meeting.status as keyof typeof STATUS_BADGE_CLASS]}`}>
                                                    {STATUS_LABELS[meeting.status as keyof typeof STATUS_LABELS]}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex flex-col gap-1 text-sm opacity-75">
                                                <p className="flex items-center gap-2">
                                                    <UsersRound className="w-4 h-4" />
                                                    Équipe : {meeting.team?.name}
                                                </p>

                                                {meeting.project ? (
                                                    <p className="flex items-center gap-2">
                                                        <FolderPlus className="w-4 h-4" />
                                                        Projet : {meeting.project.name}
                                                    </p>
                                                ) : null}

                                                <p className="flex items-center gap-2">
                                                    <CalendarDays className="w-4 h-4" />
                                                    {new Date(meeting.scheduledAt).toLocaleString("fr-FR")}
                                                </p>

                                                {meeting.externalUrl ? (
                                                    <a
                                                        href={meeting.externalUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 link link-primary break-all"
                                                    >
                                                        <Link2 className="w-4 h-4" />
                                                        Lien de réunion
                                                    </a>
                                                ) : null}

                                                {meeting.externalUrl ? (
                                                    <p className="flex items-center gap-2 text-sm opacity-75">
                                                        <Video className="w-4 h-4" />
                                                        {meeting.provider === "JITSI" ? "Salle Jitsi configurée" : "Lien visio configuré"}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-auto">
                                            <select
                                                className="select select-bordered select-sm w-full lg:w-52"
                                                value={meeting.status}
                                                onChange={(e) =>
                                                    handleStatusChange(
                                                        meeting.id,
                                                        e.target.value as "SCHEDULED" | "COMPLETED" | "CANCELLED"
                                                    )
                                                }
                                                disabled={savingStatusId === meeting.id}
                                            >
                                                <option value="SCHEDULED">Planifiée</option>
                                                <option value="COMPLETED">Terminée</option>
                                                <option value="CANCELLED">Annulée</option>
                                            </select>
                                        </div>
                                    </div>

                                    {meeting.description ? (
                                        <div className="rounded-lg border border-base-300 p-3">
                                            <p className="text-sm break-words">{meeting.description}</p>
                                        </div>
                                    ) : null}

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-2 text-sm opacity-75">
                                            <FileText className="w-4 h-4" />
                                            {meeting.notes?.trim() ? (
                                                <span>Compte-rendu disponible</span>
                                            ) : (
                                                <span>Aucun compte-rendu pour le moment</span>
                                            )}
                                        </div>

                                        {meeting.meetingRecordings && meeting.meetingRecordings.length > 0 ? (
                                            <p className="flex items-center gap-2 text-sm opacity-75">
                                                <FileText className="w-4 h-4" />
                                                {meeting.meetingRecordings.length} enregistrement{meeting.meetingRecordings.length > 1 ? "s" : ""}
                                            </p>
                                        ) : null}

                                        <Link href={`/meetings/${meeting.id}`} className="btn btn-sm btn-outline self-start sm:self-auto">
                                            Voir le détail
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        imageSrc="/empty-project.png"
                        imageAlt="Aucune réunion"
                        message="Aucune réunion disponible pour le moment"
                    />
                )}
            </div>
        </Wrapper>
    );
};

export default page;
