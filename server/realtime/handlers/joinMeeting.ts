import { Server, Socket } from "socket.io";
import { REALTIME_EVENTS } from "../../../lib/realtime/events.ts";
import type {
    MeetingJoinPayload,
    MeetingErrorPayload,
    RealtimeParticipant,
} from "../../../lib/realtime/types.ts";
import { authorizeMeetingAccess } from "../services/authorizeMeetingAccess.ts";
import {
    addParticipantToMeeting,
} from "../services/meetingPresenceService.ts";

type AuthenticatedSocket = Socket & {
    data: {
        email?: string;
        userId?: string;
    };
};

export function registerJoinMeetingHandler(io: Server, socket: AuthenticatedSocket) {
    socket.on(
        REALTIME_EVENTS.MEETING_JOIN,
        async (payload: MeetingJoinPayload) => {
            try {
                if (!payload?.meetingId) {
                    const errorPayload: MeetingErrorPayload = {
                        message: "meetingId manquant.",
                        code: "MISSING_MEETING_ID",
                    };
                    socket.emit(REALTIME_EVENTS.MEETING_ERROR, errorPayload);
                    return;
                }

                const email = socket.data.email;
                if (!email) {
                    const errorPayload: MeetingErrorPayload = {
                        message: "Session temps réel non authentifiée.",
                        code: "UNAUTHENTICATED",
                    };
                    socket.emit(REALTIME_EVENTS.MEETING_ERROR, errorPayload);
                    return;
                }

                const { user, membership } = await authorizeMeetingAccess({
                    meetingId: payload.meetingId,
                    email,
                });

                socket.data.userId = user.id;

                const roomName = `meeting:${payload.meetingId}`;
                socket.join(roomName);

                const participant: RealtimeParticipant = {
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    role: membership.role,
                    socketId: socket.id,
                    joinedAt: new Date().toISOString(),
                };

                const participants = addParticipantToMeeting(
                    payload.meetingId,
                    participant
                );

                socket.emit(REALTIME_EVENTS.MEETING_JOINED, {
                    meetingId: payload.meetingId,
                    participant,
                });

                io.to(roomName).emit(REALTIME_EVENTS.MEETING_PARTICIPANTS, {
                    meetingId: payload.meetingId,
                    participants,
                });
            } catch (error) {
                const errorPayload: MeetingErrorPayload = {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Erreur lors de la connexion à la réunion.",
                    code: "JOIN_MEETING_FAILED",
                };

                socket.emit(REALTIME_EVENTS.MEETING_ERROR, errorPayload);
            }
        }
    );
}
