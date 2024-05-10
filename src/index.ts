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
}

export { WebsocketServer } from "./websocket-server";