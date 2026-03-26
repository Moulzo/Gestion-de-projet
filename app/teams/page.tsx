"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import TeamComponent from "../components/TeamComponent";
import EmptyState from "../components/EmptyState";
import { createTeam, getTeamsForCurrentUser, joinTeamByInviteCode } from "../actions";
import { Team, TeamRole } from "@/type";
import { FolderPlus, UsersRound } from "lucide-react";
import { toast } from "react-toastify";

type TeamCardData = Team & {
    currentUserRole?: TeamRole;
    membersCount?: number;
    projectsCount?: number;
};

const page = () => {
    const [teams, setTeams] = useState<TeamCardData[]>([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [inviteCode, setInviteCode] = useState("");

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const data = await getTeamsForCurrentUser();
            setTeams(data as TeamCardData[]);
        } catch (error) {
            toast.error("Erreur lors du chargement des équipes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleCreateTeam = async () => {
        try {
            const modal = document.getElementById("create_team_modal") as HTMLDialogElement | null;

            await createTeam(name, description);

            setName("");
            setDescription("");
            modal?.close();
            await fetchTeams();

            toast.success("Équipe créée avec succès.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la création de l'équipe."
            );
        }
    };

    const handleJoinTeam = async () => {
        try {
            if (!inviteCode.trim()) {
                toast.error("Veuillez entrer un code d’invitation.");
                return;
            }

            await joinTeamByInviteCode(inviteCode);
            setInviteCode("");
            await fetchTeams();
            toast.success("Vous avez rejoint l’équipe avec succès.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la jointure de l’équipe."
            );
        }
    };

    return (
        <Wrapper>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Équipes</h1>
                        <p className="text-sm opacity-70 mt-1">
                            Gérez vos workspaces, leurs membres et leurs projets.
                        </p>
                    </div>

                    <button
                        className="btn btn-primary self-start lg:self-auto"
                        onClick={() =>
                            (document.getElementById("create_team_modal") as HTMLDialogElement | null)?.showModal()
                        }
                    >
                        Nouvelle équipe
                        <FolderPlus className="w-4 h-4" />
                    </button>
                </div>

                <div className="rounded-xl border border-base-300 p-4 md:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label className="label">
                                <span className="label-text">Code d’invitation d’équipe</span>
                            </label>
                            <input
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                type="text"
                                placeholder="Entrez un code d’invitation"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <button className="btn btn-outline md:btn-primary" onClick={handleJoinTeam}>
                            Rejoindre
                            <UsersRound className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <dialog id="create_team_modal" className="modal">
                    <div className="modal-box">
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                                ✕
                            </button>
                        </form>

                        <h3 className="font-bold text-lg">Nouvelle équipe</h3>
                        <p className="py-4 text-sm opacity-80">
                            Créez un workspace interne pour regrouper vos projets et collaborateurs.
                        </p>

                        <div className="space-y-4">
                            <input
                                placeholder="Nom de l’équipe"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input input-bordered w-full"
                            />

                            <textarea
                                placeholder="Description (optionnelle)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="textarea textarea-bordered w-full"
                            />

                            <button className="btn btn-primary w-full sm:w-auto" onClick={handleCreateTeam}>
                                Créer l’équipe
                                <FolderPlus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </dialog>

                {loading ? (
                    <div className="rounded-xl border border-base-300 p-5">
                        <p className="text-sm opacity-70">Chargement des équipes...</p>
                    </div>
                ) : teams.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        {teams.map((team) => (
                            <li key={team.id}>
                                <TeamComponent team={team} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        imageSrc="/empty-project.png"
                        imageAlt="Aucune équipe"
                        message="Aucune équipe disponible pour le moment"
                    />
                )}
            </div>
        </Wrapper>
    );
};

export default page;