import { EngineActor, SocketActor } from "socket.io-serverless";

export { EngineActor, SocketActor };

interface Env {
  ENGINE_ACTOR: DurableObjectNamespace;
  SOCKET_ACTOR: DurableObjectNamespace;
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    /*
     * Socket.IO / Engine.IO 客户端访问：
     *
     * /socket.io/
     *
     * 例如：
     *
     * https://collab.example.com/socket.io/?EIO=4&transport=websocket
     */

    if (url.pathname.startsWith("/socket.io/")) {
      const upgrade = request.headers.get("Upgrade");

      if (upgrade?.toLowerCase() !== "websocket") {
        return new Response(
          "This Excalidraw collaboration server only supports WebSocket transport.",
          {
            status: 426,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          },
        );
      }

      /*
       * socket.io-serverless 的 EngineActor
       *
       * 每个底层 Engine.IO 连接交给 Durable Object。
       */
      const id = env.ENGINE_ACTOR.idFromName(
        crypto.randomUUID(),
      );

      const stub = env.ENGINE_ACTOR.get(id);

      return stub.fetch(request);
    }

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          service: "excalidraw-collab",
          timestamp: Date.now(),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return new Response(
      "Excalidraw collaboration server",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  },
};
