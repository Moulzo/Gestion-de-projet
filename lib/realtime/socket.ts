import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getRealtimeSocket(email: string) {
    if (socket) return socket;

    socket = io(process.env.NEXT_PUBLIC_REALTIME_URL || window.location.origin, {
        transports: ["websocket"],
        autoConnect: false,
        auth: {
            email,
        },
    });

    return socket;
}

export function resetRealtimeSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
