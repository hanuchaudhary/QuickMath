import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws,req) => {
    console.log(req.url!)
    ws.on("message", (data) => {

    })
});
