import { Server, Socket } from "socket.io";
import { registerJoinMeetingHandler } from "./joinMeeting.ts";
import { registerLeaveMeetingHandler } from "./leaveMeeting.ts";
import {
    removeSocketFromAllMeetings,
    getParticipantsInMeeting,
} from "../services/meetingPresenceService.ts";
import { REALTIME_EVENTS } from "../../../lib/realtime/events.ts";

type AuthenticatedSocket = Socket & {
    data: {
        email?: string;
        userId?: string;
    };
};

export function registerConnectionHandler(io: Server, socket: AuthenticatedSocket) {
    registerJoinMeetingHandler(io, socket);
    registerLeaveMeetingHandler(io, socket);

    socket.on("disconnect", () => {
        const affectedMeetings = removeSocketFromAllMeetings(socket.id);

        for (const item of affectedMeetings) {
            const roomName = `meeting:${item.meetingId}`;
            const participants = getParticipantsInMeeting(item.meetingId);

            io.to(roomName).emit(REALTIME_EVENTS.MEETING_PARTICIPANTS, {
                meetingId: item.meetingId,
                participants,
            });

            io.to(roomName).emit(REALTIME_EVENTS.MEETING_LEFT, {
                meetingId: item.meetingId,
                userId: item.userId,
            });
        }
    });
}
