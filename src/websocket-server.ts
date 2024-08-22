import { DurableObject } from "cloudflare:workers";

export class WebsocketServer extends DurableObject<Env> {
	constructor(private readonly state: DurableObjectState, env: Env) {
		super(state, env);
	}

	async fetch(request: Request): Promise<Response> {
		if (request.method === "POST" && request.body) {
			const pageContentMessage: ImportMessage = await request.json()
			const websockets = this.state.getWebSockets("storeader")
			if (websockets.length > 0) {
				websockets[0].send(JSON.stringify({ url: request.url, content: pageContentMessage.content }))
				return new Response(null, { status: 200 })
			}
			console.error(`Failed to lookup websocket to send content to: ${JSON.stringify(request)}`)
			return new Response(null, { status: 500 })
		}

		const upgradeHeader = request.headers.get("Upgrade")
		if (upgradeHeader !== "websocket") {
			return new Response("Expected websocket", { status: 400 })
		}

		const [client, server] = Object.values(new WebSocketPair());
		this.state.acceptWebSocket(server, ["storeader"]);
		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}
	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		const req = JSON.parse(message.toString());
		console.log("Message received")
		
		if (req.content) {
			ws.send(req.content)
			return
		}

		try {
			await this.env.test_queue_binding.send({ url: req.url, ws_id: this.ctx.id.toString() });
			ws.send(JSON.stringify({ url: req.url }))
		} catch (e) {
			console.log(e)
			ws.send(JSON.stringify({ url: req.url, error: JSON.stringify(e) }))
		}
		ws.send(JSON.stringify({ error: false, url: req.url }))
	}
}