import { DurableObject } from "cloudflare:workers";

export interface Env {
	link_limit: DurableObjectNamespace<LinkManager>;
}

// Durable Object
export class LinkManager extends DurableObject {

  async getLinks() {
    let value = (await this.ctx.storage.get("links")) || [];
    return value;
  }

  async getCount() {
    let value: string[] = (await this.ctx.storage.get("links")) || [];
    return value.length
  }

  async addLink(url: string) {
    let links: string[] = (await this.ctx.storage.get("links")) || [];
    links.push(url)
    // You do not have to worry about a concurrent request having modified the value in storage.
    // "input gates" will automatically protect against unwanted concurrency.
    // Read-modify-write is safe.
    await this.ctx.storage.put("links", links);
    return links;
  }
}

async function handleSession(websocket: WebSocket, env: Env) {
	websocket.accept()
	websocket.addEventListener("message", async ({ data }) => {
	  const req = JSON.parse(data.toString());
	  console.log("Message received")
	  const id = env.link_limit.idFromName("links")
	  const stub = env.link_limit.get(id);
	  stub.addLink(req.url)
	  // await env.request_queue_binding.send({ id_token: req.id_token, url: req.url });
	  websocket.send(JSON.stringify({ error: false, url: req.url }))
	})
  
	websocket.addEventListener("close", async evt => {
	  // Handle when a client closes the WebSocket connection
	  console.log(evt)
	})
  }
  
  
  const websocketHandler = async (request: Request, env: Env) => {
	const upgradeHeader = request.headers.get("Upgrade")
	if (upgradeHeader !== "websocket") {
	  return new Response("Expected websocket", { status: 400 })
	}
  
	const [client, server] = Object.values(new WebSocketPair())
	await handleSession(server, env)
  
	return new Response(null, {
	  status: 101,
	  webSocket: client
	})
  }
  
  export default {
	async fetch(request: Request, env: Env): Promise<Response> {
	  console.log(env)
	  try {
		const url = new URL(request.url)
		switch (url.pathname) {
		  case '/ws':
			return websocketHandler(request, env)
		  case '/count':
			const id = env.link_limit.idFromName("links")
			const stub = env.link_limit.get(id);
			return new Response((await stub.getCount()).toString())
		  default:
			return new Response("Not authorized", { status: 401 })
		}
	  } catch (err) {
		console.log(err)
		return new Response("error")
	  }
	}
  }