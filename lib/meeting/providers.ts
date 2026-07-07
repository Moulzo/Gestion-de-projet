export const MEETING_PROVIDERS = {
    NONE: "NONE",
    JITSI: "JITSI",
    NATIVE: "NATIVE",
} as const;

export type MeetingProviderValue =
    typeof MEETING_PROVIDERS[keyof typeof MEETING_PROVIDERS];

export const MEETING_PROVIDER_LABELS: Record<MeetingProviderValue, string> = {
    NONE: "Aucune visio",
    JITSI: "Jitsi",
    NATIVE: "Visio native",
};
