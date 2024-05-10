import { DurableObject } from "cloudflare:workers";

export interface Env {
	db: D1Database
}

export class WebsocketServer extends DurableObject<Env> {
	constructor(private readonly state: DurableObjectState, env: Env) {
		super(state, env);
	}

	async fetch(_: Request): Promise<Response> {
		const [client, server] = Object.values(new WebSocketPair());
		this.state.acceptWebSocket(server);
		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}
	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		const req = JSON.parse(message.toString());
		console.log("Message received")
		await this.env.db.prepare(`insert into links (id, url) values (?, ?)`).bind(crypto.randomUUID(), req.url).run()
		ws.send(JSON.stringify({ error: false, url: req.url }))
	}
}