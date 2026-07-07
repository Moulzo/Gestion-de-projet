import type { RealtimeParticipant } from "../../../lib/realtime/types.ts";

type RoomParticipantsMap = Map<string, RealtimeParticipant[]>;

const roomParticipants: RoomParticipantsMap = new Map();

export function getParticipantsInMeeting(meetingId: string) {
    return roomParticipants.get(meetingId) || [];
}

export function addParticipantToMeeting(
    meetingId: string,
    participant: RealtimeParticipant
) {
    const existing = roomParticipants.get(meetingId) || [];

    const filtered = existing.filter(
        (item) => !(item.userId === participant.userId && item.socketId === participant.socketId)
    );

    const updated = [...filtered, participant];
    roomParticipants.set(meetingId, updated);

    return updated;
}

export function removeParticipantFromMeeting(
    meetingId: string,
    socketId: string
) {
    const existing = roomParticipants.get(meetingId) || [];
    const updated = existing.filter((item) => item.socketId !== socketId);

    if (updated.length === 0) {
        roomParticipants.delete(meetingId);
    } else {
        roomParticipants.set(meetingId, updated);
    }

    return updated;
}

export function removeSocketFromAllMeetings(socketId: string) {
    const affectedMeetings: { meetingId: string; userId?: string }[] = [];

    for (const [meetingId, participants] of roomParticipants.entries()) {
        const participant = participants.find((item) => item.socketId === socketId);
        if (!participant) continue;

        const updated = participants.filter((item) => item.socketId !== socketId);

        if (updated.length === 0) {
            roomParticipants.delete(meetingId);
        } else {
            roomParticipants.set(meetingId, updated);
        }

        affectedMeetings.push({
            meetingId,
            userId: participant.userId,
        });
    }

    return affectedMeetings;
}
