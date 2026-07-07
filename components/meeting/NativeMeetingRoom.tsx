"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getRealtimeSocket, resetRealtimeSocket } from "@/lib/realtime/socket";
import { REALTIME_EVENTS } from "@/lib/realtime/events";
import {
    MeetingErrorPayload,
    MeetingParticipantsPayload,
    RealtimeParticipant,
} from "@/lib/realtime/types";
import { Loader, Radio, UsersRound } from "lucide-react";

type NativeMeetingRoomProps = {
    meetingId: string;
    roomId?: string | null;
};

type AuthState = {
    loading: boolean;
    email: string | null;
    name: string | null;
};

const NativeMeetingRoom = ({ meetingId, roomId }: NativeMeetingRoomProps) => {
    const [authState, setAuthState] = useState<AuthState>({
        loading: true,
        email: null,
        name: null,
    });

    const [participants, setParticipants] = useState<RealtimeParticipant[]>([]);
    const [connectionState, setConnectionState] = useState<
        "idle" | "connecting" | "connected" | "error"
    >("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchAuth = async () => {
            try {
                const response = await fetch("/api/realtime/auth", {
                    method: "GET",
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("Impossible de récupérer l'utilisateur courant.");
                }

                const data = await response.json();

                if (!isMounted) return;

                setAuthState({
                    loading: false,
                    email: data.email,
                    name: data.name,
                });
            } catch (error) {
                if (!isMounted) return;

                setAuthState({
                    loading: false,
                    email: null,
                    name: null,
                });

                setConnectionState("error");
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Erreur lors de l'authentification temps réel."
                );
            }
        };

        fetchAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (authState.loading || !authState.email || !meetingId) return;

        const socket = getRealtimeSocket(authState.email);

        const handleConnect = () => {
            setConnectionState("connected");
            setErrorMessage(null);

            socket.emit(REALTIME_EVENTS.MEETING_JOIN, {
                meetingId,
            });
        };

        const handleConnecting = () => {
            setConnectionState("connecting");
        };

        const handleParticipants = (payload: MeetingParticipantsPayload) => {
            if (payload.meetingId !== meetingId) return;
            setParticipants(payload.participants);
        };

        const handleError = (payload: MeetingErrorPayload) => {
            setConnectionState("error");
            setErrorMessage(payload.message || "Erreur temps réel.");
        };

        setConnectionState("connecting");

        socket.on("connect", handleConnect);
        socket.on("connect_error", handleConnecting);
        socket.on(REALTIME_EVENTS.MEETING_PARTICIPANTS, handleParticipants);
        socket.on(REALTIME_EVENTS.MEETING_ERROR, handleError);

        if (!socket.connected) {
            socket.connect();
        } else {
            handleConnect();
        }

        return () => {
            socket.emit(REALTIME_EVENTS.MEETING_LEAVE, { meetingId });

            socket.off("connect", handleConnect);
            socket.off("connect_error", handleConnecting);
            socket.off(REALTIME_EVENTS.MEETING_PARTICIPANTS, handleParticipants);
            socket.off(REALTIME_EVENTS.MEETING_ERROR, handleError);

            resetRealtimeSocket();
        };
    }, [authState.loading, authState.email, meetingId]);

    const currentUserParticipant = useMemo(() => {
        return participants.find((participant) => participant.email === authState.email) || null;
    }, [participants, authState.email]);

    if (authState.loading) {
        return (
            <div className="rounded-xl border border-base-300 p-4">
                <div className="flex items-center gap-2 text-sm opacity-70">
                    <Loader className="w-4 h-4 animate-spin" />
                    Chargement de la salle native...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-base-300 p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">Salle native</h3>
                        <p className="text-sm opacity-70 mt-1 break-all">
                            Room ID : {roomId || "Non défini"}
                        </p>
                    </div>

                    <div className="badge badge-outline h-auto py-2">
                        {connectionState === "connecting" && "Connexion..."}
                        {connectionState === "connected" && "Connecté"}
                        {connectionState === "error" && "Erreur"}
                        {connectionState === "idle" && "Inactif"}
                    </div>
                </div>

                {errorMessage ? (
                    <div className="alert alert-error mt-4">
                        <span>{errorMessage}</span>
                    </div>
                ) : null}

                <div className="mt-4 rounded-lg border border-dashed border-base-300 p-4">
                    <p className="text-sm opacity-80">
                        La partie temps réel est active. Le flux audio/vidéo WebRTC sera branché à l'étape suivante.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-base-300 p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                    <UsersRound className="w-4 h-4" />
                    <h3 className="font-semibold text-lg">
                        Participants connectés ({participants.length})
                    </h3>
                </div>

                {participants.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {participants.map((participant) => {
                            const isCurrentUser =
                                participant.email === authState.email;

                            return (
                                <div
                                    key={participant.socketId}
                                    className="rounded-lg border border-base-300 p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium wrap-break-word">
                                                {participant.name || participant.email}
                                                {isCurrentUser ? (
                                                    <span className="ml-2 text-xs opacity-60">
                                                        (Vous)
                                                    </span>
                                                ) : null}
                                            </p>
                                            <p className="text-sm opacity-70 break-all">
                                                {participant.email}
                                            </p>
                                            <p className="text-xs opacity-60 mt-1">
                                                Rôle : {participant.role}
                                            </p>
                                        </div>

                                        <div className="badge badge-success gap-1">
                                            <Radio className="w-3 h-3" />
                                            En ligne
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm opacity-70">
                        Aucun participant connecté pour le moment.
                    </p>
                )}

                {currentUserParticipant ? (
                    <p className="text-xs opacity-60 mt-4">
                        Vous êtes bien connecté à la salle native.
                    </p>
                ) : null}
            </div>
        </div>
    );
};

export default NativeMeetingRoom;
