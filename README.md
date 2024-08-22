Cloudflare workers websocket server example -- sending thousands of urls to a websocket that attempts to fetch and return. 
The browser eventually receives a close event after a few minutes with an error code of 1006.

1. Deploy with `npx wrangler deploy`
2. Open `src/client/index.html` in your browser
3. Open devtools to console view
3. Select `src/client/raindrop-backup-may-2024.html` as the file to upload
4. Logs of sent and received messages between browser and DO Websocket server flow
5. After a few minutes you should see `Closed websocket, code: 1006, event: ` with no more logs coming through