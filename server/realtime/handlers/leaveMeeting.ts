import { Server, Socket } from "socket.io";
import { REALTIME_EVENTS } from "../../../lib/realtime/events.ts";
import type {
    MeetingErrorPayload,
    MeetingLeavePayload,
} from "../../../lib/realtime/types.ts";
import { removeParticipantFromMeeting } from "../services/meetingPresenceService.ts";

type AuthenticatedSocket = Socket & {
    data: {
        email?: string;
        userId?: string;
    };
};

export function registerLeaveMeetingHandler(io: Server, socket: AuthenticatedSocket) {
    socket.on(
        REALTIME_EVENTS.MEETING_LEAVE,
        async (payload: MeetingLeavePayload) => {
            try {
                if (!payload?.meetingId) {
                    const errorPayload: MeetingErrorPayload = {
                        message: "meetingId manquant.",
                        code: "MISSING_MEETING_ID",
                    };
                    socket.emit(REALTIME_EVENTS.MEETING_ERROR, errorPayload);
                    return;
                }

                const roomName = `meeting:${payload.meetingId}`;
                socket.leave(roomName);

                const participants = removeParticipantFromMeeting(
                    payload.meetingId,
                    socket.id
                );

                io.to(roomName).emit(REALTIME_EVENTS.MEETING_PARTICIPANTS, {
                    meetingId: payload.meetingId,
                    participants,
                });

                io.to(roomName).emit(REALTIME_EVENTS.MEETING_LEFT, {
                    meetingId: payload.meetingId,
                    userId: socket.data.userId,
                });
            } catch (error) {
                const errorPayload: MeetingErrorPayload = {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Erreur lors de la sortie de la réunion.",
                    code: "LEAVE_MEETING_FAILED",
                };

                socket.emit(REALTIME_EVENTS.MEETING_ERROR, errorPayload);
            }
        }
    );
}
