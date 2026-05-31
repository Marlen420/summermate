import { createServer } from "http";
import next from "next";
import { initSocketServer } from "@/lib/socket/server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`> SummerMate ready on http://${hostname}:${port}`);
  });
});
