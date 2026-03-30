"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "@/app/components/Wrapper";
import NativeMeetingRoom from "@/components/meeting/NativeMeetingRoom";
import {
    addMeetingRecording,
    disableNativeMeetingRoom,
    enableNativeMeetingRoom,
    generateJitsiMeetingLink,
    getMeetingDetails,
    regenerateJitsiMeetingLink,
    removeMeetingRecording,
    removeMeetingVideoLink,
    updateMeetingNotes,
    updateMeetingStatus,
} from "@/app/actions";
import { MeetingRecording, TeamMeeting } from "@/type";
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Copy,
    FileText,
    FolderKanban,
    Info,
    Link2,
    Plus,
    RefreshCw,
    Trash2,
    Video,
    UsersRound,
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

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

const PROVIDER_LABELS = {
    NONE: "Aucune visio",
    JITSI: "Jitsi",
    NATIVE: "Visio native",
} as const;

const page = ({ params }: { params: Promise<{ meetingId: string }> }) => {
    const [meetingId, setMeetingId] = useState("");
    const [meeting, setMeeting] = useState<TeamMeeting | null>(null);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingNotes, setSavingNotes] = useState(false);
    const [savingStatus, setSavingStatus] = useState(false);
    const [generatingJitsi, setGeneratingJitsi] = useState(false);
    const [regeneratingJitsi, setRegeneratingJitsi] = useState(false);
    const [removingVideoLink, setRemovingVideoLink] = useState(false);

    const [recordingTitle, setRecordingTitle] = useState("");
    const [recordingUrl, setRecordingUrl] = useState("");
    const [recordingDescription, setRecordingDescription] = useState("");
    const [addingRecording, setAddingRecording] = useState(false);
    const [removingRecordingId, setRemovingRecordingId] = useState<string | null>(null);
    const [enablingNative, setEnablingNative] = useState(false);
    const [disablingNative, setDisablingNative] = useState(false);

    const fetchMeeting = async (id: string) => {
        try {
            setLoading(true);
            const data = await getMeetingDetails(id);
            setMeeting(data as TeamMeeting);
            setNotes((data as TeamMeeting).notes || "");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors du chargement de la réunion."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const resolved = await params;
            setMeetingId(resolved.meetingId);
            fetchMeeting(resolved.meetingId);
        };

        init();
    }, [params]);

    const handleSaveNotes = async () => {
        if (!meetingId) return;
        if (!canManageMeeting) return;

        try {
            setSavingNotes(true);
            await updateMeetingNotes(meetingId, notes);
            await fetchMeeting(meetingId);
            toast.success("Compte-rendu mis à jour.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la mise à jour du compte-rendu."
            );
        } finally {
            setSavingNotes(false);
        }
    };

    const handleStatusChange = async (
        status: "SCHEDULED" | "COMPLETED" | "CANCELLED"
    ) => {
        if (!meetingId || !canManageMeeting) return;

        try {
            setSavingStatus(true);
            await updateMeetingStatus(meetingId, status);
            await fetchMeeting(meetingId);
            toast.success("Statut mis à jour.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la mise à jour du statut."
            );
        } finally {
            setSavingStatus(false);
        }
    };

    const handleGenerateJitsi = async () => {
        if (!meetingId || !canManageMeeting) return;

        try {
            setGeneratingJitsi(true);
            await generateJitsiMeetingLink(meetingId);
            await fetchMeeting(meetingId);
            toast.success("Lien Jitsi généré avec succès.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la génération du lien Jitsi."
            );
        } finally {
            setGeneratingJitsi(false);
        }
    };

    const handleRegenerateJitsi = async () => {
        if (!meetingId || !canManageMeeting) return;

        const confirmed = window.confirm(
            "Voulez-vous vraiment régénérer le lien Jitsi ? L'ancien lien ne devra plus être partagé."
        );
        if (!confirmed) return;

        try {
            setRegeneratingJitsi(true);
            await regenerateJitsiMeetingLink(meetingId);
            await fetchMeeting(meetingId);
            toast.success("Lien Jitsi régénéré avec succès.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la régénération du lien Jitsi."
            );
        } finally {
            setRegeneratingJitsi(false);
        }
    };

    const handleRemoveVideoLink = async () => {
        if (!meetingId || !canManageMeeting) return;

        const confirmed = window.confirm(
            "Voulez-vous vraiment supprimer le lien de visioconférence ?"
        );
        if (!confirmed) return;

        try {
            setRemovingVideoLink(true);
            await removeMeetingVideoLink(meetingId);
            await fetchMeeting(meetingId);
            toast.success("Lien de visioconférence supprimé.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la suppression du lien de visioconférence."
            );
        } finally {
            setRemovingVideoLink(false);
        }
    };

    const handleCopyLink = async () => {
        if (!meeting?.externalUrl) return;

        try {
            await navigator.clipboard.writeText(meeting.externalUrl);
            toast.success("Lien copié dans le presse-papiers.");
        } catch (error) {
            toast.error("Impossible de copier le lien.");
        }
    };

    const handleAddRecording = async () => {
        if (!meetingId || !canManageMeeting) return;

        try {
            setAddingRecording(true);
            await addMeetingRecording({
                meetingId,
                title: recordingTitle,
                url: recordingUrl,
                description: recordingDescription,
            });
            setRecordingTitle("");
            setRecordingUrl("");
            setRecordingDescription("");
            await fetchMeeting(meetingId);
            toast.success("Enregistrement ajouté avec succès.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de l'ajout de l'enregistrement."
            );
        } finally {
            setAddingRecording(false);
        }
    };

    const handleRemoveRecording = async (recordingId: string) => {
        if (!canManageMeeting) return;

        const confirmed = window.confirm(
            "Voulez-vous vraiment supprimer cet enregistrement ?"
        );
        if (!confirmed) return;

        try {
            setRemovingRecordingId(recordingId);
            await removeMeetingRecording(recordingId);
            await fetchMeeting(meetingId);
            toast.success("Enregistrement supprimé.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la suppression de l'enregistrement."
            );
        } finally {
            setRemovingRecordingId(null);
        }
    };

    const handleEnableNative = async () => {
        if (!meetingId || !canManageMeeting) return;

        try {
            setEnablingNative(true);
            await enableNativeMeetingRoom(meetingId);
            await fetchMeeting(meetingId);
            toast.success("Salle native activée.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de l'activation de la salle native."
            );
        } finally {
            setEnablingNative(false);
        }
    };

    const handleDisableNative = async () => {
        if (!meetingId || !canManageMeeting) return;

        try {
            setDisablingNative(true);
            await disableNativeMeetingRoom(meetingId);
            await fetchMeeting(meetingId);
            toast.success("Salle native désactivée.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la désactivation de la salle native."
            );
        } finally {
            setDisablingNative(false);
        }
    };

    if (loading) {
        return (
            <Wrapper>
                <div className="rounded-xl border border-base-300 p-5">
                    <p className="text-sm opacity-70">Chargement de la réunion...</p>
                </div>
            </Wrapper>
        );
    }

    if (!meeting) {
        return (
            <Wrapper>
                <div className="rounded-xl border border-base-300 p-5">
                    <p className="text-sm opacity-70">Réunion introuvable.</p>
                </div>
            </Wrapper>
        );
    }

    const isCancelled = meeting.status === "CANCELLED";
    const hasVideoLink = Boolean(meeting.externalUrl);
    const recordings = meeting.meetingRecordings || [];
    const canManageMeeting =
        meeting.currentUserTeamRole === "OWNER" ||
        meeting.currentUserTeamRole === "MANAGER";

    return (
        <Wrapper>
            <div className="space-y-6">
                <div className="flex flex-col gap-3">
                    <Link href="/meetings" className="btn btn-sm btn-ghost self-start">
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux réunions
                    </Link>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold break-words">{meeting.title}</h1>
                                <span
                                    className={`badge ${
                                        STATUS_BADGE_CLASS[
                                            meeting.status as keyof typeof STATUS_BADGE_CLASS
                                        ]
                                    }`}
                                >
                                    {STATUS_LABELS[
                                        meeting.status as keyof typeof STATUS_LABELS
                                    ]}
                                </span>
                            </div>

                            <div className="mt-3 flex flex-col gap-2 text-sm opacity-75">
                                <p className="flex items-center gap-2">
                                    <UsersRound className="w-4 h-4" />
                                    Équipe : {meeting.team?.name}
                                </p>

                                {meeting.project ? (
                                    <p className="flex items-center gap-2">
                                        <FolderKanban className="w-4 h-4" />
                                        Projet lié : {meeting.project.name}
                                    </p>
                                ) : null}

                                <p className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4" />
                                    {new Date(meeting.scheduledAt).toLocaleString("fr-FR")}
                                </p>

                                {meeting.durationMinutes ? (
                                    <p className="text-sm opacity-75">
                                        Durée prévue : {meeting.durationMinutes} min
                                    </p>
                                ) : null}

                                <p className="text-xs opacity-60">
                                    Votre rôle sur cette réunion :{" "}
                                    {meeting.currentUserTeamRole === "OWNER"
                                        ? "Propriétaire"
                                        : meeting.currentUserTeamRole === "MANAGER"
                                        ? "Manager"
                                        : "Membre"}
                                </p>
                            </div>
                        </div>

                        <div className="w-full lg:w-auto">
                            {canManageMeeting ? (
                                <select
                                    className="select select-bordered w-full lg:w-56"
                                    value={meeting.status}
                                    onChange={(e) =>
                                        handleStatusChange(
                                            e.target.value as "SCHEDULED" | "COMPLETED" | "CANCELLED"
                                        )
                                    }
                                    disabled={savingStatus}
                                >
                                    <option value="SCHEDULED">Planifiée</option>
                                    <option value="COMPLETED">Terminée</option>
                                    <option value="CANCELLED">Annulée</option>
                                </select>
                            ) : (
                                <div className="badge badge-outline h-auto py-2">
                                    Lecture seule
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {meeting.description ? (
                    <div className="rounded-xl border border-base-300 p-4 md:p-5 shadow-sm">
                        <h2 className="text-lg font-semibold mb-3">Description</h2>
                        <p className="text-sm break-words">{meeting.description}</p>
                    </div>
                ) : null}

                <div className="rounded-xl border border-base-300 p-4 md:p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Video className="w-4 h-4" />
                        <h2 className="text-lg font-semibold">Visioconférence</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm opacity-80">
                            <span className="font-medium">Provider :</span>
                            <span className="badge badge-outline">
                                {PROVIDER_LABELS[
                                    (meeting.provider || "NONE") as keyof typeof PROVIDER_LABELS
                                ]}
                            </span>
                        </div>

                        {isCancelled && (
                            <div className="alert alert-warning">
                                <AlertTriangle className="w-4 h-4" />
                                <span>
                                    Cette réunion est annulée. La génération ou régénération d'un lien Jitsi est désactivée.
                                </span>
                            </div>
                        )}

                        {meeting.provider === "NATIVE" ? (
                            <NativeMeetingRoom
                                meetingId={meeting.id}
                                roomId={meeting.nativeRoomId}
                            />
                        ) : meeting.provider === "JITSI" && hasVideoLink ? (
                            <>
                                <div className="rounded-lg border border-base-300 p-3">
                                    <p className="text-sm opacity-70 mb-2">Lien de réunion</p>
                                    <a
                                        href={meeting.externalUrl!}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 link link-primary break-all"
                                    >
                                        <Link2 className="w-4 h-4" />
                                        {meeting.externalUrl}
                                    </a>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    <a
                                        href={meeting.externalUrl!}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-primary w-full sm:w-auto"
                                    >
                                        <Video className="w-4 h-4" />
                                        Ouvrir la visio
                                    </a>

                                    <button
                                        type="button"
                                        className="btn btn-outline w-full sm:w-auto"
                                        onClick={handleCopyLink}
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copier le lien
                                    </button>

                                    {canManageMeeting && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-outline w-full sm:w-auto"
                                                onClick={handleRegenerateJitsi}
                                                disabled={regeneratingJitsi || isCancelled}
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Régénérer le lien
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-error btn-outline w-full sm:w-auto"
                                                onClick={handleRemoveVideoLink}
                                                disabled={removingVideoLink}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Supprimer le lien
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm opacity-70">
                                    Aucun lien de visioconférence n'est encore associé à cette réunion.
                                </p>

                                {canManageMeeting ? (
                                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                        <button
                                            type="button"
                                            className="btn btn-primary w-full sm:w-auto"
                                            onClick={handleGenerateJitsi}
                                            disabled={generatingJitsi || isCancelled}
                                        >
                                            <Video className="w-4 h-4" />
                                            Créer un lien Jitsi
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-outline w-full sm:w-auto"
                                            onClick={handleEnableNative}
                                            disabled={enablingNative || isCancelled}
                                        >
                                            <Video className="w-4 h-4" />
                                            Activer la salle native
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs opacity-60">
                                        Seuls les propriétaires et managers peuvent configurer la visio.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-base-300 p-4 md:p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4" />
                        <h2 className="text-lg font-semibold">Compte-rendu</h2>
                    </div>

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="textarea textarea-bordered w-full min-h-56"
                        placeholder="Ajoutez ici le compte-rendu détaillé de la réunion..."
                        readOnly={!canManageMeeting}
                    />

                    <div className="mt-4 flex justify-end">
                        {canManageMeeting ? (
                            <button
                                className="btn btn-primary w-full sm:w-auto"
                                onClick={handleSaveNotes}
                                disabled={savingNotes}
                            >
                                Enregistrer le compte-rendu
                                <CheckCircle2 className="w-4 h-4" />
                            </button>
                        ) : (
                            <p className="text-xs opacity-60">
                                Le compte-rendu est visible en lecture seule pour les membres.
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-base-300 p-4 md:p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4" />
                        <h2 className="text-lg font-semibold">Enregistrements</h2>
                    </div>

                    {canManageMeeting ? (
                        <>
                            <div className="alert alert-info mb-5">
                                <Info className="w-4 h-4" />
                                <span>
                                    Si l'enregistrement Jitsi est sauvegardé en local, uploadez d'abord le fichier sur Drive, Dropbox ou un stockage partagé, puis collez ici le lien partageable.
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-5">
                                <input
                                    type="text"
                                    placeholder="Titre de l'enregistrement"
                                    className="input input-bordered w-full"
                                    value={recordingTitle}
                                    onChange={(e) => setRecordingTitle(e.target.value)}
                                />

                                <input
                                    type="url"
                                    placeholder="Lien de l'enregistrement"
                                    className="input input-bordered w-full"
                                    value={recordingUrl}
                                    onChange={(e) => setRecordingUrl(e.target.value)}
                                />

                                <textarea
                                    placeholder="Description (optionnelle)"
                                    className="textarea textarea-bordered w-full"
                                    value={recordingDescription}
                                    onChange={(e) => setRecordingDescription(e.target.value)}
                                />

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        className="btn btn-primary w-full sm:w-auto"
                                        onClick={handleAddRecording}
                                        disabled={addingRecording}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Ajouter un enregistrement
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="alert alert-info mb-5">
                            <Info className="w-4 h-4" />
                            <span>
                                Les enregistrements sont visibles par les membres, mais seuls les propriétaires et managers peuvent en ajouter ou en supprimer.
                            </span>
                        </div>
                    )}

                    {recordings.length > 0 ? (
                        <div className="space-y-3">
                            {recordings.map((recording: MeetingRecording) => (
                                <div
                                    key={recording.id}
                                    className="rounded-lg border border-base-300 p-3"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-medium break-words">{recording.title}</p>
                                            <a
                                                href={recording.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="link link-primary text-sm break-all mt-1 inline-block"
                                            >
                                                {recording.url}
                                            </a>

                                            {recording.description ? (
                                                <p className="text-sm opacity-75 mt-2 break-words">
                                                    {recording.description}
                                                </p>
                                            ) : null}

                                            <p className="text-xs opacity-60 mt-2">
                                                Ajouté le{" "}
                                                {new Date(recording.createdAt).toLocaleString("fr-FR")}
                                                {recording.addedBy
                                                    ? ` par ${recording.addedBy.name || recording.addedBy.email}` 
                                                    : ""}
                                            </p>
                                        </div>

                                        {canManageMeeting && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-error btn-outline self-start"
                                                onClick={() => handleRemoveRecording(recording.id)}
                                                disabled={removingRecordingId === recording.id}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Supprimer
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm opacity-70">
                            Aucun enregistrement ajouté pour le moment.
                        </p>
                    )}
                </div>
            </div>
        </Wrapper>
    );
};

export default page;