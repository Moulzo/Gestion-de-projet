export const REALTIME_EVENTS = {
    CONNECTION: "connection",

    MEETING_JOIN: "meeting:join",
    MEETING_LEAVE: "meeting:leave",

    MEETING_JOINED: "meeting:joined",
    MEETING_LEFT: "meeting:left",

    MEETING_PARTICIPANTS: "meeting:participants",
    MEETING_ERROR: "meeting:error",
} as const;
