import { DurableObject } from "cloudflare:workers";

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