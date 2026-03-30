export type RealtimeParticipant = {
    userId: string;
    name: string;
    email: string;
    role: "OWNER" | "MANAGER" | "MEMBER";
    socketId: string;
    joinedAt: string;
};

export type MeetingJoinPayload = {
    meetingId: string;
};

export type MeetingLeavePayload = {
    meetingId: string;
};

export type MeetingJoinedPayload = {
    meetingId: string;
    participant: RealtimeParticipant;
};

export type MeetingLeftPayload = {
    meetingId: string;
    userId: string;
};

export type MeetingParticipantsPayload = {
    meetingId: string;
    participants: RealtimeParticipant[];
};

export type MeetingErrorPayload = {
    message: string;
    code?: string;
};
