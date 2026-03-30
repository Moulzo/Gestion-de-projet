import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getRealtimeSocket() {
    if (socket) return socket;

    socket = io(process.env.NEXT_PUBLIC_REALTIME_URL || "http://localhost:3000", {
        transports: ["websocket"],
        autoConnect: false,
    });

    return socket;
}
