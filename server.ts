import { createServer } from "http";
import next from "next";
import { initSocketServer } from "./server/realtime/socket-server.ts";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

async function main() {
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    await app.prepare();

    const httpServer = createServer((req, res) => {
        handle(req, res);
    });

    initSocketServer(httpServer);

    httpServer.listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
}

main().catch((error) => {
    console.error("Erreur au démarrage du serveur :", error);
    process.exit(1);
});
