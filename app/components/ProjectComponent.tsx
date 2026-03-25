"use client";

import { Project } from "@/type";
import {
    ArrowRight,
    Calendar,
    Copy,
    FolderKanban,
    PencilLine,
    Trash2,
    Users,
} from "lucide-react";
import Link from "next/link";
import React, { FC, useMemo, useState } from "react";
import { toast } from "react-toastify";

interface ProjectProps {
    project: Project;
    admin: number;
    style: boolean;
    onDelete?: (projectId: string) => Promise<void> | void;
}

const ProjectComponent: FC<ProjectProps> = ({ project, admin, style, onDelete }) => {
    const [copied, setCopied] = useState(false);
    const [deleteInput, setDeleteInput] = useState("");
    const modalId = useMemo(() => `delete_project_modal_${project.id}`, [project.id]);

    const totalTasks = project.tasks?.length || 0;
    const collaboratorsCount = project.users?.length || 0;

    const toDoTasks =
        project.tasks?.filter((task) => task.status === "To Do").length || 0;
    const inProgressTasks =
        project.tasks?.filter((task) => task.status === "In Progress").length || 0;
    const doneTasks =
        project.tasks?.filter((task) => task.status === "Done").length || 0;

    const progressPercentage =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const inProgressPercentage =
        totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
    const toDoPercentage =
        totalTasks > 0 ? Math.round((toDoTasks / totalTasks) * 100) : 0;

    const openDeleteModal = () => {
        setDeleteInput("");
        const modal = document.getElementById(modalId) as HTMLDialogElement | null;
        modal?.showModal();
    };

    const closeDeleteModal = () => {
        const modal = document.getElementById(modalId) as HTMLDialogElement | null;
        modal?.close();
        setDeleteInput("");
    };

    const handleConfirmDelete = async () => {
        if (!onDelete) return;

        if (deleteInput.trim() !== project.name.trim()) {
            toast.error("Le nom du projet ne correspond pas.");
            return;
        }

        try {
            await onDelete(project.id);
            closeDeleteModal();
        } catch (error) {
            toast.error("Erreur lors de la suppression du projet.");
        }
    };

    const handleCopyInviteCode = async () => {
        try {
            await navigator.clipboard.writeText(project.inviteCode);
            setCopied(true);
            toast.success("Code d'invitation copié !");
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            toast.error("Impossible de copier le code");
        }
    };

    return (
        <>
            <div
                className={`w-full border rounded-xl p-5 shadow-sm transition hover:shadow-md ${
                    style ? "border-base-300" : "border-base-300"
                }`}
            >
                <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-primary/10 rounded-full p-2">
                                <FolderKanban className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="font-bold text-lg break-words">{project.name}</h2>
                        </div>

                        {project.description && (
                            <p className="text-sm opacity-70 break-words mb-4">
                                {project.description}
                            </p>
                        )}
                    </div>

                    {admin === 1 && onDelete && (
                        <button
                            onClick={openDeleteModal}
                            className="btn btn-sm btn-outline btn-error shrink-0"
                            title="Supprimer le projet"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm opacity-80">
                        <Users className="w-4 h-4" />
                        <span>{collaboratorsCount} collaborateur(s)</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm opacity-80">
                        <PencilLine className="w-4 h-4" />
                        <span>{totalTasks} tâche(s)</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm opacity-80">
                        <Calendar className="w-4 h-4" />
                        <span>
                            Créé le {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <button
                        onClick={handleCopyInviteCode}
                        className="btn btn-xs btn-outline w-fit"
                        type="button"
                    >
                        <Copy className="w-3 h-3" />
                        {copied ? "Copié" : "Code d'invitation"}
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Terminées</span>
                            <span>{progressPercentage}%</span>
                        </div>
                        <progress
                            className="progress progress-success w-full"
                            value={progressPercentage}
                            max="100"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>En cours</span>
                            <span>{inProgressPercentage}%</span>
                        </div>
                        <progress
                            className="progress progress-warning w-full"
                            value={inProgressPercentage}
                            max="100"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>À faire</span>
                            <span>{toDoPercentage}%</span>
                        </div>
                        <progress
                            className="progress progress-error w-full"
                            value={toDoPercentage}
                            max="100"
                        />
                    </div>
                </div>

                <div className="mt-5">
                    <Link href={`/project/${project.id}`} className="btn btn-primary btn-sm">
                        Ouvrir
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <dialog id={modalId} className="modal">
                <div className="modal-box">
                    <form method="dialog">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                            onClick={closeDeleteModal}
                        >
                            ✕
                        </button>
                    </form>

                    <h3 className="font-bold text-lg">Supprimer le projet</h3>

                    <p className="py-3 text-sm opacity-80">
                        Cette action est définitive. Pour confirmer, retapez le nom du projet :
                    </p>

                    <div className="alert alert-warning mb-4">
                        <span className="break-words">
                            <strong>{project.name}</strong>
                        </span>
                    </div>

                    <input
                        type="text"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder="Retapez le nom du projet"
                        className="input input-bordered w-full"
                    />

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={closeDeleteModal}
                        >
                            Annuler
                        </button>

                        <button
                            type="button"
                            className="btn btn-error"
                            onClick={handleConfirmDelete}
                            disabled={deleteInput.trim() !== project.name.trim()}
                        >
                            Supprimer définitivement
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
};

export default ProjectComponent;