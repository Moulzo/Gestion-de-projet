import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerConnectionHandler } from "./handlers/onConnection.ts";

let io: SocketIOServer | null = null;

export function initSocketServer(server: HttpServer) {
    if (io) return io;

    io = new SocketIOServer(server, {
        cors: {
            origin: "*",
        },
    });

    io.use((socket, next) => {
        const email = socket.handshake.auth?.email;

        if (!email || typeof email !== "string") {
            return next(new Error("Socket non authentifié : email manquant."));
        }

        socket.data.email = email;
        return next();
    });

    io.on("connection", (socket) => {
        registerConnectionHandler(io!, socket);
    });

    return io;
}

export function getSocketServer() {
    if (!io) {
        throw new Error("Socket.IO server non initialisé.");
    }

    return io;
}
