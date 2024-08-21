export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
			const url = new URL(request.url)
			switch (url.pathname) {
				case '/ws':
					return env.websocket_server.get(env.websocket_server.newUniqueId()).fetch(request);
				default:
					return new Response("Not authorized", { status: 401 })
			}
		} catch (err) {
			console.log(err)
			return new Response("error")
		}
	},

	async queue(batch: MessageBatch, env: Env): Promise<void> {
		for (const message of batch.messages) {
			try {
				const importMessage = message.body as ImportMessage
				const response = await fetch(importMessage.url)
				const body = await response.text()
				console.info(`Consumer fetched: ${importMessage.url}`)

				if (importMessage.ws_id) {
					await env.websocket_server
						.get(env.websocket_server.idFromString(importMessage.ws_id))
						.fetch(new Request(importMessage.url,
							{ method: "POST", body: JSON.stringify({ content: body }) }));
				}
			} catch (e) {
				console.error(e)
			}
		}
	}
} satisfies ExportedHandler<Env>;

export { WebsocketServer } from "./websocket-server";